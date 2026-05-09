import fs from 'node:fs/promises';
import path from 'node:path';
import {
  KNOWLEDGE_CHUNK_OVERLAP,
  KNOWLEDGE_CHUNK_SIZE,
  KNOWLEDGE_INDEX_DIR,
  KNOWLEDGE_INDEX_FILE,
  KNOWLEDGE_INDEX_VERSION,
  KNOWLEDGE_KNOWLEDGE_FILE,
  KNOWLEDGE_MARKDOWN_SOURCE_DIR,
  KNOWLEDGE_METADATA_FILE,
  KNOWLEDGE_PDF_DIR,
  KNOWLEDGE_RAG_ROOT,
  KNOWLEDGE_UPLOADS_FILE,
} from '@/lib/knowledge-base/constants';
import { buildSimplePdf } from '@/lib/knowledge-base/pdf';
import { extractTopKeywords, normalizeText, tokenizeText } from '@/lib/knowledge-base/tokenize';
import type { KnowledgeChunk, KnowledgeDocument } from '@/lib/knowledge-base/types';

interface KnowledgeIndexMetadata {
  version: number;
  generatedAt: string;
  sourceSignature: string;
  documentCount: number;
  chunkCount: number;
  seedDocumentCount: number;
  uploadDocumentCount: number;
}

interface KnowledgeIndexPayload {
  version: number;
  generatedAt: string;
  sourceSignature: string;
  documents: KnowledgeDocument[];
  chunks: KnowledgeChunk[];
}

interface KnowledgeRetrieverState {
  documents: KnowledgeDocument[];
  chunks: KnowledgeChunk[];
  documentMap: Map<string, KnowledgeDocument>;
  chunksByDocId: Map<string, KnowledgeChunk[]>;
  metadata: KnowledgeIndexMetadata;
}

type BuildKnowledgeIndexOptions = {
  ensurePdfFiles?: boolean;
  force?: boolean;
};

type SearchChunkMatch = {
  chunkId: string;
  section?: string;
  text: string;
  score: number;
};

type SearchKnowledgeResult = {
  docId: string;
  title: string;
  module: string;
  summary: string;
  score: number;
  previewText: string;
  sourceType: KnowledgeDocument['sourceType'];
  sourceLabel: NonNullable<KnowledgeDocument['sourceLabel']>;
  difficulty?: KnowledgeDocument['difficulty'];
  recommendedTeachingGoals?: string[];
  matchedBy: 'title' | 'keyword' | 'chunk';
  titleMatch: boolean;
  keywordMatches: string[];
  topChunks: SearchChunkMatch[];
};

const EMPTY_FILE_CONTENT = '[]\n';

let retrieverState: KnowledgeRetrieverState | null = null;

type MarkdownKnowledgeSource = {
  titleKey: string;
  title: string;
  content: string;
  summary: string;
  keywords: string[];
};

function createTitleKey(input: string) {
  return normalizeText(input).replace(/[^a-z0-9\u4e00-\u9fff]+/g, '');
}

function isKnowledgeDocument(value: unknown): value is KnowledgeDocument {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.docId === 'string' &&
    typeof record.title === 'string' &&
    typeof record.course === 'string' &&
    typeof record.module === 'string' &&
    typeof record.summary === 'string' &&
    Array.isArray(record.keywords) &&
    typeof record.content === 'string' &&
    typeof record.pdfPath === 'string' &&
    (record.sourceType === 'seed' || record.sourceType === 'upload') &&
    (record.sourceLabel == null ||
      record.sourceLabel === '核心知识' ||
      record.sourceLabel === '实战专题' ||
      record.sourceLabel === '用户上传') &&
    (record.difficulty == null ||
      record.difficulty === 'beginner' ||
      record.difficulty === 'intermediate' ||
      record.difficulty === 'advanced') &&
    (record.recommendedTeachingGoals == null || Array.isArray(record.recommendedTeachingGoals)) &&
    (record.references == null || Array.isArray(record.references)) &&
    typeof record.createdAt === 'string' &&
    typeof record.updatedAt === 'string'
  );
}

function deriveSourceLabel(doc: KnowledgeDocument): NonNullable<KnowledgeDocument['sourceLabel']> {
  if (doc.sourceType === 'upload') {
    return '用户上传';
  }
  if (doc.sourceLabel) {
    return doc.sourceLabel;
  }
  return doc.module.includes('实战') || doc.module.includes('工程') ? '实战专题' : '核心知识';
}

async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function ensureFile(filePath: string, defaultContent = EMPTY_FILE_CONTENT) {
  try {
    await fs.access(filePath);
  } catch {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, defaultContent, 'utf8');
  }
}

async function ensureGitkeep(dirPath: string) {
  await ensureDir(dirPath);
  await ensureFile(path.join(dirPath, '.gitkeep'), '');
}

function markdownToPlainText(markdown: string) {
  return markdown
    .replace(/\r/g, '')
    .replace(/^```[^\n]*$/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/^\|?\s*[-:]+\s*(\|\s*[-:]+\s*)+\|?$/gm, '')
    .replace(/\|/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractMarkdownTitle(markdown: string, fallback: string) {
  const headingMatch = markdown.match(/^#\s+(.+)$/m);
  if (headingMatch?.[1]) {
    return headingMatch[1].trim();
  }
  return fallback;
}

function extractMarkdownSummary(title: string, content: string) {
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const firstBodyParagraph =
    paragraphs.find((paragraph) => paragraph !== title && !paragraph.startsWith('目录')) ?? content;
  return firstBodyParagraph.replace(/\s+/g, ' ').slice(0, 180);
}

async function listMarkdownFiles(rootDir: string): Promise<string[]> {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listMarkdownFiles(fullPath)));
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

async function readMarkdownKnowledgeSources() {
  try {
    await fs.access(KNOWLEDGE_MARKDOWN_SOURCE_DIR);
  } catch {
    return new Map<string, MarkdownKnowledgeSource>();
  }

  const markdownFiles = await listMarkdownFiles(KNOWLEDGE_MARKDOWN_SOURCE_DIR);
  const sources = new Map<string, MarkdownKnowledgeSource>();

  for (const filePath of markdownFiles) {
    const rawMarkdown = await fs.readFile(filePath, 'utf8');
    const title = extractMarkdownTitle(rawMarkdown, path.basename(filePath, '.md'));
    const content = markdownToPlainText(rawMarkdown);
    if (!content) continue;
    const titleKey = createTitleKey(title);
    sources.set(titleKey, {
      titleKey,
      title,
      content,
      summary: extractMarkdownSummary(title, content),
      keywords: extractTopKeywords(content, 18),
    });
  }

  return sources;
}

async function readDocumentFile(
  filePath: string,
  sourceType: KnowledgeDocument['sourceType'],
): Promise<KnowledgeDocument[]> {
  await ensureFile(filePath);

  const raw = await fs.readFile(filePath, 'utf8');

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Invalid knowledge store at ${filePath}: failed to parse JSON. ${
        error instanceof Error ? error.message : 'Unknown parse error.'
      }`,
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`Invalid knowledge store at ${filePath}: expected a JSON array of documents.`);
  }

  const invalidIndex = parsed.findIndex((value) => !isKnowledgeDocument(value));
  if (invalidIndex >= 0) {
    throw new Error(
      `Invalid knowledge store at ${filePath}: item ${invalidIndex} is not a valid knowledge document.`,
    );
  }

  return parsed.map((doc) => ({
    ...doc,
    sourceType,
    sourceLabel:
      sourceType === 'upload'
        ? '用户上传'
        : doc.sourceLabel === '实战专题'
          ? '实战专题'
          : '核心知识',
    keywords: [...new Set(doc.keywords.map((keyword) => keyword.trim()).filter(Boolean))],
    recommendedTeachingGoals: (doc.recommendedTeachingGoals ?? [])
      .map((goal) => `${goal}`.trim())
      .filter(Boolean),
    references: (doc.references ?? []).map((reference) => `${reference}`.trim()).filter(Boolean),
  }));
}

function inferSection(doc: KnowledgeDocument): string | undefined {
  const [firstLine] = doc.content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (firstLine && firstLine.length <= 80 && firstLine !== doc.title) {
    return firstLine;
  }
  return undefined;
}

function chunkDocument(doc: KnowledgeDocument): KnowledgeChunk[] {
  const content = doc.content.replace(/\r/g, '').trim();
  if (!content) return [];

  const section = inferSection(doc);
  const chunks: KnowledgeChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < content.length) {
    const end = Math.min(start + KNOWLEDGE_CHUNK_SIZE, content.length);
    const text = content.slice(start, end).trim();
    if (text) {
      chunks.push({
        chunkId: `${doc.docId}::chunk-${index + 1}`,
        docId: doc.docId,
        text,
        section,
        keywords: doc.keywords,
        tokenSet: [
          ...new Set(tokenizeText(`${doc.title}\n${doc.summary}\n${doc.keywords.join(' ')}\n${text}`)),
        ],
      });
      index += 1;
    }

    if (end >= content.length) break;
    start = Math.max(end - KNOWLEDGE_CHUNK_OVERLAP, start + 1);
  }

  return chunks;
}

async function ensurePdfForDocument(doc: KnowledgeDocument, forceRewrite = false) {
  const pdfPath = path.join(KNOWLEDGE_PDF_DIR, doc.pdfPath);
  if (!forceRewrite) {
    try {
      await fs.access(pdfPath);
      return;
    } catch {
      // Fall through and generate the file.
    }
  }
  const pdfBuffer = buildSimplePdf(doc.title, `${doc.summary}\n\n${doc.content}`);
  await fs.mkdir(path.dirname(pdfPath), { recursive: true });
  await fs.writeFile(pdfPath, pdfBuffer);
}

async function ensureKnowledgeAssets() {
  await ensureDir(KNOWLEDGE_RAG_ROOT);
  await ensureGitkeep(KNOWLEDGE_INDEX_DIR);
  await ensureGitkeep(KNOWLEDGE_PDF_DIR);
  await ensureFile(KNOWLEDGE_KNOWLEDGE_FILE);
  await ensureFile(KNOWLEDGE_UPLOADS_FILE);
}

async function loadDocumentsFromStore() {
  await ensureKnowledgeAssets();
  const seedDocuments = await readDocumentFile(KNOWLEDGE_KNOWLEDGE_FILE, 'seed');
  const uploadedDocuments = await readDocumentFile(KNOWLEDGE_UPLOADS_FILE, 'upload');
  const markdownSources = await readMarkdownKnowledgeSources();

  const mergedSeedDocuments = seedDocuments.map((doc) => {
    const markdownSource = markdownSources.get(createTitleKey(doc.title));
    if (!markdownSource) {
      return doc;
    }
    return {
      ...doc,
      content: markdownSource.content,
      summary: markdownSource.summary || doc.summary,
      keywords: [...new Set([...doc.keywords, ...markdownSource.keywords])],
    };
  });

  return [...mergedSeedDocuments, ...uploadedDocuments];
}

function computeSourceSignature(documents: KnowledgeDocument[]) {
  return JSON.stringify(
    documents.map((doc) => ({
      docId: doc.docId,
      title: doc.title,
      course: doc.course,
      module: doc.module,
      summary: doc.summary,
      keywords: doc.keywords,
      content: doc.content,
      pdfPath: doc.pdfPath,
      sourceType: doc.sourceType,
      sourceLabel: doc.sourceLabel,
      difficulty: doc.difficulty,
      recommendedTeachingGoals: doc.recommendedTeachingGoals,
      references: doc.references,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    })),
  );
}

function buildChunkMap(chunks: KnowledgeChunk[]) {
  const chunksByDocId = new Map<string, KnowledgeChunk[]>();
  for (const chunk of chunks) {
    const list = chunksByDocId.get(chunk.docId) ?? [];
    list.push(chunk);
    chunksByDocId.set(chunk.docId, list);
  }
  return chunksByDocId;
}

function buildMetadata(
  documents: KnowledgeDocument[],
  chunks: KnowledgeChunk[],
  sourceSignature: string,
): KnowledgeIndexMetadata {
  return {
    version: KNOWLEDGE_INDEX_VERSION,
    generatedAt: new Date().toISOString(),
    sourceSignature,
    documentCount: documents.length,
    chunkCount: chunks.length,
    seedDocumentCount: documents.filter((doc) => doc.sourceType === 'seed').length,
    uploadDocumentCount: documents.filter((doc) => doc.sourceType === 'upload').length,
  };
}

async function writeIndexFiles(documents: KnowledgeDocument[], chunks: KnowledgeChunk[]) {
  const sourceSignature = computeSourceSignature(documents);
  const payload: KnowledgeIndexPayload = {
    version: KNOWLEDGE_INDEX_VERSION,
    generatedAt: new Date().toISOString(),
    sourceSignature,
    documents,
    chunks,
  };
  const metadata = buildMetadata(documents, chunks, sourceSignature);

  await ensureDir(KNOWLEDGE_INDEX_DIR);
  await fs.writeFile(KNOWLEDGE_INDEX_FILE, JSON.stringify(payload, null, 2), 'utf8');
  await fs.writeFile(KNOWLEDGE_METADATA_FILE, JSON.stringify(metadata, null, 2), 'utf8');

  return metadata;
}

async function readPersistedIndex() {
  try {
    const [indexRaw, metadataRaw] = await Promise.all([
      fs.readFile(KNOWLEDGE_INDEX_FILE, 'utf8'),
      fs.readFile(KNOWLEDGE_METADATA_FILE, 'utf8'),
    ]);
    const payload = JSON.parse(indexRaw) as KnowledgeIndexPayload;
    const metadata = JSON.parse(metadataRaw) as KnowledgeIndexMetadata;

    if (
      payload.version !== KNOWLEDGE_INDEX_VERSION ||
      metadata.version !== KNOWLEDGE_INDEX_VERSION ||
      !Array.isArray(payload.documents) ||
      !Array.isArray(payload.chunks) ||
      typeof payload.sourceSignature !== 'string' ||
      typeof metadata.sourceSignature !== 'string'
    ) {
      return null;
    }

    return { payload, metadata };
  } catch {
    return null;
  }
}

async function ensureRetrieverState(options: BuildKnowledgeIndexOptions = {}) {
  if (retrieverState && !options.force) {
    return retrieverState;
  }

  await ensureKnowledgeAssets();

  const documents = await loadDocumentsFromStore();
  const sourceSignature = computeSourceSignature(documents);

  if (!options.force) {
    const persisted = await readPersistedIndex();
    if (
      persisted &&
      persisted.payload.sourceSignature === sourceSignature &&
      persisted.metadata.sourceSignature === sourceSignature
    ) {
      retrieverState = {
        documents: persisted.payload.documents,
        chunks: persisted.payload.chunks,
        documentMap: new Map(persisted.payload.documents.map((doc) => [doc.docId, doc])),
        chunksByDocId: buildChunkMap(persisted.payload.chunks),
        metadata: persisted.metadata,
      };
      return retrieverState;
    }
  }

  if (options.ensurePdfFiles) {
    for (const document of documents) {
      await ensurePdfForDocument(document, options.force);
    }
  }

  const chunks = documents.flatMap((document) => chunkDocument(document));
  const metadata = await writeIndexFiles(documents, chunks);
  retrieverState = {
    documents,
    chunks,
    documentMap: new Map(documents.map((doc) => [doc.docId, doc])),
    chunksByDocId: buildChunkMap(chunks),
    metadata,
  };
  return retrieverState;
}

function overlapScore(left: string[], right: string[]) {
  if (left.length === 0 || right.length === 0) return 0;
  const rightSet = new Set(right);
  let matches = 0;
  for (const token of left) {
    if (rightSet.has(token)) {
      matches += 1;
    }
  }
  return matches / Math.max(left.length, rightSet.size);
}

function simplifyQuery(query: string) {
  return normalizeText(query)
    .replace(/[?.!,，。！？；：]/g, ' ')
    .replace(/什么是|什么叫|请介绍|介绍一下|讲解一下|解释一下|请问|一下/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function ensureKnowledgeAssetsForTests() {
  await ensureKnowledgeAssets();
}

export function resetRetrieverCache() {
  retrieverState = null;
}

export async function getKnowledgeDocumentsFromStore() {
  const state = await ensureRetrieverState();
  return state.documents;
}

export async function getKnowledgeDocumentMap() {
  const state = await ensureRetrieverState();
  return state.documentMap;
}

export async function buildKnowledgeIndex(options: BuildKnowledgeIndexOptions = {}) {
  const state = await ensureRetrieverState(options);
  return {
    documents: state.documents,
    chunks: state.chunks,
    metadata: state.metadata,
  };
}

export async function searchKnowledgeIndex(query: string, topK = 5): Promise<SearchKnowledgeResult[]> {
  const state = await ensureRetrieverState();
  const normalizedQuery = normalizeText(query);
  const simplifiedQuery = simplifyQuery(query);
  const queryTokens = tokenizeText(query);

  if (!normalizedQuery || queryTokens.length === 0) {
    return [];
  }

  return state.documents
    .map((doc) => {
      const normalizedTitle = normalizeText(doc.title);
      const titleMatch =
        normalizedTitle.includes(normalizedQuery) ||
        (!!simplifiedQuery &&
          (normalizedTitle.includes(simplifiedQuery) || simplifiedQuery.includes(normalizedTitle)));
      const keywordMatches = doc.keywords.filter((keyword) => {
        const normalizedKeyword = normalizeText(keyword);
        return (
          normalizedKeyword.includes(normalizedQuery) ||
          queryTokens.includes(normalizedKeyword) ||
          (!!simplifiedQuery &&
            normalizedKeyword.length > 1 &&
            (simplifiedQuery.includes(normalizedKeyword) ||
              normalizedKeyword.includes(simplifiedQuery)))
        );
      });
      const topChunks = (state.chunksByDocId.get(doc.docId) ?? [])
        .map((chunk) => ({
          chunkId: chunk.chunkId,
          section: chunk.section,
          text: chunk.text,
          score:
            overlapScore(queryTokens, chunk.tokenSet) +
            (simplifiedQuery && normalizeText(chunk.text).includes(simplifiedQuery) ? 0.24 : 0),
        }))
        .filter((chunk) => chunk.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      const titleScore = titleMatch ? 1 : overlapScore(queryTokens, tokenizeText(doc.title));
      const keywordScore = keywordMatches.length
        ? keywordMatches.length / Math.max(doc.keywords.length, queryTokens.length, 1)
        : 0;
      const chunkScore = topChunks[0]?.score ?? 0;
      const score = titleScore * 0.5 + keywordScore * 0.18 + chunkScore * 0.32;

      if (score <= 0) {
        return null;
      }

      const matchedBy: SearchKnowledgeResult['matchedBy'] = titleMatch
        ? 'title'
        : keywordMatches.length > 0
          ? 'keyword'
          : 'chunk';

      return {
        docId: doc.docId,
        title: doc.title,
        module: doc.module,
        summary: doc.summary,
        score,
        previewText: topChunks[0]?.text ?? doc.summary,
        sourceType: doc.sourceType,
        sourceLabel: deriveSourceLabel(doc),
        difficulty: doc.difficulty,
        recommendedTeachingGoals: doc.recommendedTeachingGoals,
        matchedBy,
        titleMatch,
        keywordMatches,
        topChunks,
      };
    })
    .filter((result): result is SearchKnowledgeResult => result !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
