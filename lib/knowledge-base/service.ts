import fs from 'node:fs/promises';
import path from 'node:path';
import {
  buildKnowledgeIndex,
  getKnowledgeDocumentMap,
  getKnowledgeDocumentsFromStore,
  resetRetrieverCache,
  searchKnowledgeIndex as lexicalSearch,
} from '@/rag/retriever';
import type { SearchKnowledgeResult as LexicalResult } from '@/rag/retriever';
import {
  searchKnowledgeIndex as vectorSearch,
  resetVectorStoreCache,
} from '@/lib/rag/retriever';
import { getEmbeddingClient, resetEmbeddingClient } from '@/lib/rag/embedding/client';
import type { EmbeddingConfig } from '@/lib/rag/embedding/types';
import { LocalVectorStore } from '@/lib/rag/vector-store/local-store';
import type { ChunkMetadata } from '@/lib/rag/vector-store/types';
import {
  KNOWLEDGE_COURSE_STRUCTURE_FILE,
  KNOWLEDGE_PDF_DIR,
  KNOWLEDGE_SEARCH_MATCH_THRESHOLD,
  KNOWLEDGE_SEARCH_TOP_K,
  KNOWLEDGE_UPLOADS_FILE,
  DEFAULT_EMBEDDING_MODEL,
  DEFAULT_EMBEDDING_DIMENSIONS,
  DEFAULT_EMBEDDING_BATCH_SIZE,
  DEFAULT_EMBEDDING_BATCH_DELAY,
} from './constants';
import type {
  KnowledgeDocument,
  KnowledgeCourseStructure,
  KnowledgeLearningPath,
  KnowledgeSearchProfileContext,
  InjectedKnowledgeContext,
  KnowledgeSearchResponse,
  KnowledgeSearchResult,
  UploadKnowledgeIngestInput,
  UploadKnowledgeMatchResponse,
} from './types';
import { createLogger } from '@/lib/logger';
import { buildSimplePdf } from './pdf';
import { extractTopKeywords, normalizeText } from './tokenize';
import type { StudentProfileDimensions } from '@/lib/types/student-profile';

const log = createLogger('KnowledgeBase');
const SEARCH_CACHE_TTL_MS = 5 * 60 * 1000;
const SEARCH_CACHE_LIMIT = 60;

const searchCache = new Map<
  string,
  {
    expiresAt: number;
    response: KnowledgeSearchResponse;
  }
>();

let courseStructureCache: KnowledgeCourseStructure | null | undefined;

function buildReasons(result: {
  titleMatch: boolean;
  conceptMatches?: string[];
  keywordMatches: string[];
  topChunks: Array<{ section?: string }>;
  module: string;
  chapterTitle?: string;
  learningStage?: KnowledgeDocument['learningStage'];
  sourceLabel?: string;
}): string[] {
  const reasons: string[] = [];
  if (result.titleMatch) {
    reasons.push('标题与查询高度相关');
  }
  if (result.conceptMatches?.length) {
    reasons.push(`命中术语：${result.conceptMatches.slice(0, 4).join('、')}`);
  }
  if (result.keywordMatches.length > 0) {
    reasons.push(`匹配关键词：${result.keywordMatches.slice(0, 4).join('、')}`);
  }
  const section = result.topChunks[0]?.section;
  if (section) {
    reasons.push(`相关章节：${section}`);
  }
  if (result.chapterTitle) {
    reasons.push(`课程章节：${result.chapterTitle}`);
  }
  if (result.learningStage) {
    reasons.push(
      `学习阶段：${
        result.learningStage === 'foundation'
          ? '基础阶段'
          : result.learningStage === 'core'
            ? '核心阶段'
            : '实践阶段'
      }`,
    );
  }
  reasons.push(`课程模块：${result.module}`);
  if (result.sourceLabel) {
    reasons.push(`资料类型：${result.sourceLabel}`);
  }
  return reasons;
}

async function readCourseStructure(): Promise<KnowledgeCourseStructure | null> {
  if (courseStructureCache !== undefined) {
    return courseStructureCache;
  }

  try {
    const raw = await fs.readFile(KNOWLEDGE_COURSE_STRUCTURE_FILE, 'utf8');
    courseStructureCache = JSON.parse(raw) as KnowledgeCourseStructure;
    return courseStructureCache;
  } catch {
    courseStructureCache = null;
    return null;
  }
}

function createSearchCacheKey(query: string, topK: number) {
  return `${normalizeText(query)}::${topK}`;
}

function getCachedSearchResponse(query: string, topK: number) {
  const key = createSearchCacheKey(query, topK);
  const cached = searchCache.get(key);
  if (!cached) {
    return null;
  }
  if (cached.expiresAt < Date.now()) {
    searchCache.delete(key);
    return null;
  }
  return cached.response;
}

function setCachedSearchResponse(query: string, topK: number, response: KnowledgeSearchResponse) {
  const key = createSearchCacheKey(query, topK);
  searchCache.set(key, {
    expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
    response,
  });

  if (searchCache.size <= SEARCH_CACHE_LIMIT) {
    return;
  }

  const oldestKey = searchCache.keys().next().value;
  if (oldestKey) {
    searchCache.delete(oldestKey);
  }
}

function buildInjectedKnowledgeContext(
  query: string,
  results: KnowledgeSearchResult[],
): InjectedKnowledgeContext | null {
  if (results.length === 0) {
    return null;
  }

  const topResults = results.slice(0, 2);
  const topChunks = topResults
    .flatMap((result) =>
      result.matchedChunks.slice(0, 2).map((chunk) => ({
        docId: result.docId,
        title: result.title,
        text: chunk.text.trim(),
      })),
    )
    .filter((chunk) => chunk.text.length > 0)
    .slice(0, 4);

  if (topChunks.length === 0) {
    return null;
  }

  const sourceTitles = [...new Set(topResults.map((result) => result.title))];
  const contextLines = [
    `## Knowledge Base Context`,
    `User query: ${query.trim()}`,
    `Matched sources: ${sourceTitles.join(' | ')}`,
    '',
    ...topChunks.map(
      (chunk, index) => `[${index + 1}] ${chunk.title}\n${chunk.text.replace(/\s+/g, ' ').slice(0, 420)}`,
    ),
  ];

  return {
    contextText: contextLines.join('\n').trim(),
    docIds: [...new Set(topResults.map((result) => result.docId))],
    sourceTitles,
    chunkCount: topChunks.length,
  };
}

function getConfidenceLevel(score: number): 'low' | 'medium' | 'high' {
  if (score >= 0.26) return 'high';
  if (score >= 0.16) return 'medium';
  return 'low';
}

function buildProfileHints(profile?: StudentProfileDimensions): string[] {
  if (!profile) return [];
  const hints: string[] = [];
  if (profile.learningPace.paceLevel !== 'unknown' && profile.learningPace.score > 20) {
    hints.push(`学习节奏：${profile.learningPace.paceLevel}`);
  }
  if (profile.interactionPreference.preference !== 'unknown' && profile.interactionPreference.score > 20) {
    hints.push(`交互偏好：${profile.interactionPreference.preference}`);
  }
  if (profile.cognitiveStyle.style !== 'unknown' && profile.cognitiveStyle.score > 20) {
    hints.push(`认知风格：${profile.cognitiveStyle.style}`);
  }
  if (profile.interestDirection.areas.length > 0 && profile.interestDirection.score > 20) {
    hints.push(`兴趣方向：${profile.interestDirection.areas.slice(0, 2).join('、')}`);
  }
  return hints;
}

function computeProfileBoost(
  result: KnowledgeSearchResult,
  profile?: StudentProfileDimensions,
): { scoreDelta: number; reasons: string[] } {
  if (!profile) {
    return { scoreDelta: 0, reasons: [] };
  }

  let scoreDelta = 0;
  const reasons: string[] = [];
  const haystack = normalizeText(
    [
      result.title,
      result.summary,
      result.chapterTitle,
      ...(result.conceptMatches ?? []),
      ...result.matchedChunks.map((chunk) => chunk.text),
    ]
      .filter(Boolean)
      .join(' '),
  );

  if (profile.knowledgeFoundation.score > 0 && profile.knowledgeFoundation.score < 45) {
    if (result.learningStage === 'foundation' || result.difficulty === 'beginner') {
      scoreDelta += 0.045;
      reasons.push('匹配当前知识基础，优先基础内容');
    }
  }

  if (profile.learningPace.paceLevel === 'slow' && (result.estimatedStudyTimeMinutes ?? 0) <= 50) {
    scoreDelta += 0.02;
    reasons.push('匹配较慢学习节奏，优先较易吸收的内容');
  }
  if (profile.learningPace.paceLevel === 'fast' && result.learningStage === 'practice') {
    scoreDelta += 0.04;
    reasons.push('匹配较快学习节奏，优先实践型内容');
  }

  if (profile.interactionPreference.preference === 'with-code' && result.resourceTypes?.includes('code-lab')) {
    scoreDelta += 0.08;
    reasons.push('符合带代码学习偏好');
  }
  if (profile.interactionPreference.preference === 'with-example' && result.resourceTypes?.includes('quiz')) {
    scoreDelta += 0.025;
    reasons.push('符合例题驱动学习偏好');
  }
  if (profile.interactionPreference.preference === 'detailed' && result.resourceTypes?.includes('reading')) {
    scoreDelta += 0.02;
    reasons.push('符合详细讲解偏好');
  }

  if (profile.cognitiveStyle.style === 'visual' && result.resourceTypes?.some((type) => type === 'mindmap' || type === 'video-script')) {
    scoreDelta += 0.025;
    reasons.push('适合视觉型学习方式');
  }
  if (profile.cognitiveStyle.style === 'analytical' && result.resourceTypes?.some((type) => type === 'quiz' || type === 'code-lab')) {
    scoreDelta += 0.025;
    reasons.push('适合分析型学习方式');
  }

  const weakPatterns = profile.errorPronePatterns.patterns ?? [];
  for (const pattern of weakPatterns) {
    const normalizedPattern = normalizeText(pattern);
    if (normalizedPattern && haystack.includes(normalizedPattern)) {
      scoreDelta += 0.035;
      reasons.push(`覆盖当前薄弱点：${pattern}`);
      break;
    }
  }

  const interestAreas = profile.interestDirection.areas ?? [];
  for (const area of interestAreas) {
    const normalizedArea = normalizeText(area);
    if (normalizedArea && haystack.includes(normalizedArea)) {
      scoreDelta += 0.03;
      reasons.push(`贴合兴趣方向：${area}`);
      break;
    }
  }

  return {
    scoreDelta: Number(scoreDelta.toFixed(4)),
    reasons,
  };
}

function personalizeSearchResults(
  results: KnowledgeSearchResult[],
  profileContext?: KnowledgeSearchProfileContext,
) {
  const profile = profileContext?.learningProfile;
  return results
    .map((result) => {
      const boost = computeProfileBoost(result, profile);
      const boostedScore = Number((result.score + boost.scoreDelta).toFixed(4));
      return {
        ...result,
        score: boostedScore,
        confidenceLevel: getConfidenceLevel(boostedScore),
        personalizationReasons: boost.reasons,
      };
    })
    .sort((a, b) => b.score - a.score);
}

function chooseRecommendedResources(
  resourceTypes: KnowledgeSearchResult['resourceTypes'],
  profile?: StudentProfileDimensions,
) {
  const types = resourceTypes ?? ['lecture', 'reading'];
  if (!profile) {
    return types.slice(0, 3);
  }

  const preferred = new Set<typeof types[number]>();
  if (profile.interactionPreference.preference === 'with-code') {
    preferred.add('code-lab');
    preferred.add('project');
  }
  if (profile.cognitiveStyle.style === 'visual') {
    preferred.add('mindmap');
    preferred.add('video-script');
  }
  if (profile.interactionPreference.preference === 'with-example') {
    preferred.add('quiz');
  }
  preferred.add('lecture');

  const prioritized = [
    ...types.filter((type) => preferred.has(type)),
    ...types.filter((type) => !preferred.has(type)),
  ];
  return [...new Set(prioritized)].slice(0, 3);
}

async function buildRecommendedLearningPath(
  results: KnowledgeSearchResult[],
  profileContext?: KnowledgeSearchProfileContext,
): Promise<KnowledgeLearningPath | null> {
  if (results.length === 0) {
    return null;
  }

  const structure = await readCourseStructure();
  if (!structure) {
    return null;
  }

  const topResult = results[0];
  if (!topResult.chapterId) {
    return null;
  }

  const chapterMap = new Map(structure.chapters.map((chapter) => [chapter.chapterId, chapter]));
  const targetChapter = chapterMap.get(topResult.chapterId);
  if (!targetChapter) {
    return null;
  }

  const prerequisiteChapters = (targetChapter.prerequisiteChapterIds ?? [])
    .map((chapterId) => chapterMap.get(chapterId))
    .filter((chapter): chapter is NonNullable<typeof chapter> => !!chapter)
    .slice(-2);
  const nextChapter = structure.chapters.find((chapter) => chapter.order === targetChapter.order + 1);
  const profile = profileContext?.learningProfile;
  const personalizedFor = buildProfileHints(profile);

  const steps = [
    ...prerequisiteChapters.map((chapter) => ({
      chapterId: chapter.chapterId,
      chapterTitle: chapter.title,
      learningStage: chapter.learningStage,
      reason: '先补足前置知识，建立进入当前主题所需的概念基础',
      recommendedResources: ['lecture', 'mindmap', 'quiz'],
    })),
    {
      chapterId: targetChapter.chapterId,
      chapterTitle: targetChapter.title,
      learningStage: targetChapter.learningStage,
      reason:
        topResult.personalizationReasons?.[0] ??
        '优先聚焦当前最相关的课程章节，围绕问题进行定向学习',
      recommendedResources: chooseRecommendedResources(topResult.resourceTypes, profile),
    },
    ...(nextChapter
      ? [
          {
            chapterId: nextChapter.chapterId,
            chapterTitle: nextChapter.title,
            learningStage: nextChapter.learningStage,
            reason: '完成当前主题后继续衔接下一章，形成连续学习路径',
            recommendedResources: ['reading', 'quiz', 'project'],
          },
        ]
      : []),
  ];

  return {
    title: `推荐学习路径：${topResult.title}`,
    summary: `已结合知识命中结果${personalizedFor.length ? '与学习画像' : ''}，生成一条从前置知识到目标章节的学习路径。`,
    personalizedFor,
    steps: steps as import('@/lib/knowledge-base/types').KnowledgeLearningPathStep[],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toSearchResult(result: any): KnowledgeSearchResult {
  return {
    docId: result.docId,
    title: result.title,
    module: result.module,
    chapterId: result.chapterId,
    chapterTitle: result.chapterTitle,
    learningStage: result.learningStage,
    summary: result.summary,
    score: Number(result.score.toFixed(4)),
    reasons: buildReasons(result),
    pdfUrl: `/api/knowledge/document/${result.docId}`,
    previewText: result.previewText,
    matchedChunks: result.topChunks.map((chunk: any) => ({
      chunkId: chunk.chunkId,
      section: chunk.section,
      text: (chunk.text ?? '').slice(0, 220),
      score: Number((chunk.score ?? 0).toFixed(4)),
    })),
    pdfAvailable: true,
    sourceType: result.sourceType,
    sourceLabel: result.sourceLabel,
    difficulty: result.difficulty,
    resourceTypes: result.resourceTypes,
    estimatedStudyTimeMinutes: result.estimatedStudyTimeMinutes,
    recommendedTeachingGoals: result.recommendedTeachingGoals,
    matchedBy: result.matchedBy as KnowledgeSearchResult['matchedBy'],
    conceptMatches: result.conceptMatches,
    confidenceLevel: getConfidenceLevel(Number(result.score.toFixed(4))),
  };
}

let vectorIndexReady = false;

async function ensureKnowledgeIndexReady() {
  await buildKnowledgeIndex({ ensurePdfFiles: false });
}

async function ensureVectorIndexReady(embeddingConfig: EmbeddingConfig) {
  if (vectorIndexReady) return;
  const signature = LocalVectorStore.resolveSignature(
    embeddingConfig.model,
    embeddingConfig.dimensions || DEFAULT_EMBEDDING_DIMENSIONS,
    embeddingConfig.baseUrl,
  );
  const store = new LocalVectorStore();
  const exists = await store.loadIndex(signature);
  if (!exists) {
    const { buildVectorIndex } = await import('@/lib/rag/indexer');
    await buildVectorIndex({
      model: embeddingConfig.model,
      baseUrl: embeddingConfig.baseUrl,
      dimensions: embeddingConfig.dimensions || DEFAULT_EMBEDDING_DIMENSIONS,
      force: true,
    });
    await store.loadIndex(signature);
  }
  vectorIndexReady = true;
}

function getEmbeddingConfig(): EmbeddingConfig | null {
  // Priority 1: environment variables (set in .env.local)
  const envModel = process.env.EMBEDDING_MODEL;
  const envBaseUrl = process.env.EMBEDDING_BASE_URL;
  const envApiKey = process.env.EMBEDDING_API_KEY;
  const envDimensions = parseInt(process.env.EMBEDDING_DIMENSIONS || '0', 10);
  const envBinding = (process.env.EMBEDDING_BINDING || 'openai') as EmbeddingConfig['binding'];
  if (envModel && envBaseUrl && envDimensions) {
    return {
      model: envModel,
      apiKey: envApiKey || '',
      baseUrl: envBaseUrl,
      binding: envBinding,
      dimensions: envDimensions,
      batchSize: DEFAULT_EMBEDDING_BATCH_SIZE,
      batchDelay: DEFAULT_EMBEDDING_BATCH_DELAY,
      requestTimeout: 60,
    };
  }

  // Priority 2: settings store (configured via UI)
  try {
    const { useSettingsStore } = require('@/lib/store/settings');
    const settings = useSettingsStore.getState();
    if (!settings.embeddingEnabled || !settings.embeddingModel) return null;
    const binding = (settings.embeddingBinding || 'openai') as EmbeddingConfig['binding'];
    return {
      model: settings.embeddingModel || DEFAULT_EMBEDDING_MODEL,
      apiKey: settings.embeddingApiKey || settings.providersConfig?.openai?.apiKey || '',
      baseUrl: settings.embeddingBaseUrl || settings.providersConfig?.openai?.baseUrl || '',
      binding,
      dimensions: settings.embeddingDimensions || DEFAULT_EMBEDDING_DIMENSIONS,
      batchSize: DEFAULT_EMBEDDING_BATCH_SIZE,
      batchDelay: DEFAULT_EMBEDDING_BATCH_DELAY,
      requestTimeout: 60,
    };
  } catch {
    return null;
  }
}

async function writeUploadedDocuments(documents: KnowledgeDocument[]) {
  await fs.writeFile(KNOWLEDGE_UPLOADS_FILE, JSON.stringify(documents, null, 2), 'utf8');
}

async function readUploadedDocuments(): Promise<KnowledgeDocument[]> {
  try {
    const raw = await fs.readFile(KNOWLEDGE_UPLOADS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as KnowledgeDocument[]) : [];
  } catch {
    return [];
  }
}

export async function ensureKnowledgePdf(doc: KnowledgeDocument): Promise<string> {
  const targetPath = path.join(KNOWLEDGE_PDF_DIR, doc.pdfPath);
  
  try {
    await fs.access(targetPath);
    return targetPath;
  } catch {
    // 目录不存在则创建
    await fs.mkdir(KNOWLEDGE_PDF_DIR, { recursive: true });
    
    // 优先级1：使用原始PDF（如果存在）
    if (doc.hasOriginalPdf && doc.originalPdfPath) {
      const originalPath = path.join(KNOWLEDGE_PDF_DIR, doc.originalPdfPath);
      try {
        await fs.access(originalPath);
        // 创建软链接或复制文件
        await fs.copyFile(originalPath, targetPath);
        log.info(`[PDF] Using original PDF for ${doc.docId}`);
        return targetPath;
      } catch {
        log.warn(`[PDF] Original PDF not found, falling back to generated: ${doc.originalPdfPath}`);
      }
    }
    
    // 优先级2：生成简单PDF
    const pdf = buildSimplePdf(doc.title, `${doc.summary}\n\n${doc.content}`);
    await fs.writeFile(targetPath, pdf);
    log.info(`[PDF] Generated simple PDF for ${doc.docId}`);
    return targetPath;
  }
}

export async function getKnowledgeDocuments(): Promise<KnowledgeDocument[]> {
  await ensureKnowledgeIndexReady();
  return getKnowledgeDocumentsFromStore();
}

export async function getKnowledgeDocumentById(docId: string): Promise<KnowledgeDocument | null> {
  await ensureKnowledgeIndexReady();
  const documentMap = await getKnowledgeDocumentMap();
  const document = documentMap.get(docId) ?? null;
  if (document) {
    await ensureKnowledgePdf(document);
  }
  return document;
}

export async function searchKnowledgeBase(
  query: string,
  topK = KNOWLEDGE_SEARCH_TOP_K,
  profileContext?: KnowledgeSearchProfileContext,
): Promise<KnowledgeSearchResponse> {
  const cached = getCachedSearchResponse(query, topK);
  if (cached && !profileContext?.learningProfile) {
    return cached;
  }
  await ensureKnowledgeIndexReady();

  const embedConfig = getEmbeddingConfig();
  let results: Awaited<ReturnType<typeof vectorSearch>>;

  if (embedConfig) {
    try {
      getEmbeddingClient(embedConfig);
      await ensureVectorIndexReady(embedConfig);
      results = await vectorSearch(query, topK, {
        model: embedConfig.model,
        dimensions: embedConfig.dimensions || DEFAULT_EMBEDDING_DIMENSIONS,
        baseUrl: embedConfig.baseUrl,
      });
    } catch (err) {
      log.warn('Vector search failed, falling back to lexical:', err);
      const lexResults = await lexicalSearch(query, topK);
      results = lexResults.map((r) => ({
        ...r,
        topChunks: r.topChunks.map((c) => ({ ...c, score: c.score })),
      }));
    }
  } else {
    const lexResults = await lexicalSearch(query, topK);
    results = lexResults.map((r) => ({
      ...r,
      topChunks: r.topChunks.map((c) => ({ ...c, score: c.score })),
    }));
  }

  const formatted = personalizeSearchResults(results.map(toSearchResult), profileContext);
  const bestMatch = formatted[0] ?? null;
  const recommendedPath =
    bestMatch && bestMatch.score >= KNOWLEDGE_SEARCH_MATCH_THRESHOLD
      ? await buildRecommendedLearningPath(formatted, profileContext)
      : null;
  const matched = !!bestMatch && bestMatch.score >= KNOWLEDGE_SEARCH_MATCH_THRESHOLD;
  const response = {
    matched,
    results: formatted,
    bestMatch,
    fallbackAction: matched ? 'open_pdf' : 'generate_classroom',
    autoContext: matched ? buildInjectedKnowledgeContext(query, formatted) : null,
    recommendedPath,
    safetyNote: matched
      ? bestMatch?.confidenceLevel === 'low'
        ? '当前知识命中较弱，建议先查看候选资料或补充更具体的问题描述。'
        : '生成时将优先参考知识库命中内容，并保留来源透明度。'
      : '当前知识库未找到足够强的命中，系统会回退为基于主题的生成。',
  } satisfies KnowledgeSearchResponse;
  if (!profileContext?.learningProfile) {
    setCachedSearchResponse(query, topK, response);
  }
  return response;
}

export function buildRecommendedRequirement(
  text: string,
  title?: string,
  fallbackTitle = '上传资料',
): string {
  const source = title?.trim() || fallbackTitle;
  const preview = text.replace(/\s+/g, ' ').slice(0, 160);
  return `请基于《${source}》生成一节人工智能课程，提炼核心知识点、关键概念和适合初学者的讲解顺序。参考内容摘要：${preview}`;
}

export async function matchUploadedKnowledge(
  text: string,
  title?: string,
  profileContext?: KnowledgeSearchProfileContext,
): Promise<UploadKnowledgeMatchResponse> {
  const query = title?.trim() ? `${title}\n${text.slice(0, 1800)}` : text.slice(0, 2000);
  const response = await searchKnowledgeBase(query, KNOWLEDGE_SEARCH_TOP_K, profileContext);
  return {
    ...response,
    recommendedRequirement: buildRecommendedRequirement(text, title),
  };
}

function createUploadDocId(title: string) {
  const normalized = normalizeText(title)
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return normalized ? `upload-${normalized}-${Date.now()}` : `upload-${Date.now()}`;
}

/**
 * Incrementally insert a newly ingested document's chunks into the existing
 * vector index, without rebuilding the whole index. Falls back silently if
 * embedding is not configured or the vector index does not exist yet.
 */
async function incrementallyUpdateVectorIndex(document: KnowledgeDocument) {
  const embedConfig = getEmbeddingConfig();
  if (!embedConfig) return; // embedding not configured, skip

  try {
    const signature = LocalVectorStore.resolveSignature(
      embedConfig.model,
      embedConfig.dimensions || DEFAULT_EMBEDDING_DIMENSIONS,
      embedConfig.baseUrl,
    );
    const store = new LocalVectorStore();
    const exists = await store.loadIndex(signature);
    if (!exists) {
      // No existing vector index — the next search will trigger a full build,
      // so we don't need to do anything here.
      log.info('Vector index not yet built, skipping incremental insert');
      return;
    }

    // Chunk the new document using the same chunking strategy as the indexer.
    // We import buildKnowledgeIndex's internal chunker indirectly by reading
    // the freshly-built lexical index and filtering by docId.
    const lexicalIndex = await buildKnowledgeIndex({ ensurePdfFiles: false });
    const newChunks = lexicalIndex.chunks.filter((c) => c.docId === document.docId);
    if (newChunks.length === 0) {
      log.warn(`No chunks found for ingested document ${document.docId}`);
      return;
    }

    // Generate embeddings for the new chunks only
    const client = getEmbeddingClient(embedConfig);
    const texts = newChunks.map((c) => c.text);
    log.info(`Incrementally embedding ${texts.length} new chunks for ${document.docId}...`);
    const embeddings = await client.embed(texts);

    // Convert to ChunkMetadata and insert
    const chunkMetadata: ChunkMetadata[] = newChunks.map((c) => ({
      chunkId: c.chunkId,
      docId: c.docId,
      text: c.text.trim(),
      section: c.section,
      keywords: c.keywords || [],
    }));

    await store.insertChunks(chunkMetadata, embeddings);
    log.info(`Incrementally inserted ${chunkMetadata.length} chunks into vector index`);
  } catch (err) {
    log.warn('Failed to incrementally update vector index (non-fatal):', err);
  }
}

export async function ingestUploadedKnowledge(
  input: UploadKnowledgeIngestInput,
): Promise<KnowledgeDocument> {
  await ensureKnowledgeIndexReady();
  const uploadedDocuments = await readUploadedDocuments();
  const normalizedTitle = normalizeText(input.title);
  const normalizedText = normalizeText(input.text).slice(0, 800);

  const existing = uploadedDocuments.find(
    (doc) =>
      doc.sourceType === 'upload' &&
      normalizeText(doc.title) === normalizedTitle &&
      normalizeText(doc.content).slice(0, 800) === normalizedText,
  );
  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const docId = createUploadDocId(input.title);
  const summary = input.summary?.trim() || input.text.replace(/\s+/g, ' ').slice(0, 180);
  const keywords = [...new Set([...(input.keywords ?? []), ...extractTopKeywords(input.text, 14)])];
  const record: KnowledgeDocument = {
    docId,
    title: input.title.trim(),
    course: '人工智能课程',
    module: input.module?.trim() || '用户上传资料',
    summary,
    keywords,
    content: input.text.trim(),
    pdfPath: `${docId}.pdf`,
    sourceType: 'upload',
    sourceLabel: '用户上传',
    difficulty: 'intermediate',
    learningStage: 'practice',
    resourceTypes: ['lecture', 'reading'],
    estimatedStudyTimeMinutes: 35,
    recommendedTeachingGoals: ['基于上传资料梳理知识点', '围绕用户资料生成结构化课堂'],
    references: ['用户上传资料'],
    createdAt: now,
    updatedAt: now,
  };

  const existingUploads = uploadedDocuments.filter((doc) => doc.sourceType === 'upload');
  existingUploads.push(record);
  await writeUploadedDocuments(existingUploads);
  await ensureKnowledgePdf(record);
  resetRetrieverCache();
  searchCache.clear();
  await buildKnowledgeIndex({ ensurePdfFiles: true, force: true });

  // Incrementally update the vector index (if embedding is configured) so the
  // newly ingested document is immediately searchable via vector search.
  await incrementallyUpdateVectorIndex(record);

  log.info(`Knowledge document ingested: ${record.docId}`);
  return record;
}

export async function getKnowledgePdfBuffer(docId: string): Promise<Buffer | null> {
  const document = await getKnowledgeDocumentById(docId);
  if (!document) {
    return null;
  }
  const pdfPath = await ensureKnowledgePdf(document);
  return fs.readFile(pdfPath);
}

export async function resetKnowledgeCache() {
  resetRetrieverCache();
  resetVectorStoreCache();
  resetEmbeddingClient();
  searchCache.clear();
  courseStructureCache = undefined;
  vectorIndexReady = false;
}
