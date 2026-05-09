import fs from 'node:fs/promises';
import path from 'node:path';
import {
  buildKnowledgeIndex,
  getKnowledgeDocumentMap,
  getKnowledgeDocumentsFromStore,
  resetRetrieverCache,
  searchKnowledgeIndex,
} from '@/rag/retriever';
import {
  KNOWLEDGE_PDF_DIR,
  KNOWLEDGE_SEARCH_MATCH_THRESHOLD,
  KNOWLEDGE_SEARCH_TOP_K,
  KNOWLEDGE_UPLOADS_FILE,
} from './constants';
import type {
  KnowledgeDocument,
  KnowledgeSearchResponse,
  KnowledgeSearchResult,
  UploadKnowledgeIngestInput,
  UploadKnowledgeMatchResponse,
} from './types';
import { createLogger } from '@/lib/logger';
import { buildSimplePdf } from './pdf';
import { extractTopKeywords, normalizeText } from './tokenize';

const log = createLogger('KnowledgeBase');

function buildReasons(result: {
  titleMatch: boolean;
  keywordMatches: string[];
  topChunks: Array<{ section?: string }>;
  module: string;
  sourceLabel?: string;
}): string[] {
  const reasons: string[] = [];
  if (result.titleMatch) {
    reasons.push('标题与查询高度相关');
  }
  if (result.keywordMatches.length > 0) {
    reasons.push(`匹配关键词：${result.keywordMatches.slice(0, 4).join('、')}`);
  }
  const section = result.topChunks[0]?.section;
  if (section) {
    reasons.push(`相关章节：${section}`);
  }
  reasons.push(`课程模块：${result.module}`);
  if (result.sourceLabel) {
    reasons.push(`资料类型：${result.sourceLabel}`);
  }
  return reasons;
}

function toSearchResult(
  result: Awaited<ReturnType<typeof searchKnowledgeIndex>>[number],
): KnowledgeSearchResult {
  return {
    docId: result.docId,
    title: result.title,
    module: result.module,
    summary: result.summary,
    score: Number(result.score.toFixed(4)),
    reasons: buildReasons(result),
    pdfUrl: `/api/knowledge/document/${result.docId}`,
    previewText: result.previewText,
    matchedChunks: result.topChunks.map((chunk) => ({
      chunkId: chunk.chunkId,
      section: chunk.section,
      text: chunk.text.slice(0, 220),
      score: Number(chunk.score.toFixed(4)),
    })),
    pdfAvailable: true,
    sourceType: result.sourceType,
    sourceLabel: result.sourceLabel,
    difficulty: result.difficulty,
    recommendedTeachingGoals: result.recommendedTeachingGoals,
    matchedBy: result.matchedBy,
  };
}

async function ensureKnowledgeIndexReady() {
  await buildKnowledgeIndex({ ensurePdfFiles: false });
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
    const pdf = buildSimplePdf(doc.title, `${doc.summary}\n\n${doc.content}`);
    await fs.mkdir(KNOWLEDGE_PDF_DIR, { recursive: true });
    await fs.writeFile(targetPath, pdf);
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
): Promise<KnowledgeSearchResponse> {
  await ensureKnowledgeIndexReady();
  const results = await searchKnowledgeIndex(query, topK);
  const formatted = results.map(toSearchResult);
  const bestMatch = formatted[0] ?? null;
  return {
    matched: !!bestMatch && bestMatch.score >= KNOWLEDGE_SEARCH_MATCH_THRESHOLD,
    results: formatted,
    bestMatch,
    fallbackAction:
      bestMatch && bestMatch.score >= KNOWLEDGE_SEARCH_MATCH_THRESHOLD
        ? 'open_pdf'
        : 'generate_classroom',
  };
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
): Promise<UploadKnowledgeMatchResponse> {
  const query = title?.trim() ? `${title}\n${text.slice(0, 1800)}` : text.slice(0, 2000);
  const response = await searchKnowledgeBase(query);
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
  await buildKnowledgeIndex({ ensurePdfFiles: true, force: true });
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
}
