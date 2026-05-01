import fs from 'node:fs/promises';
import path from 'node:path';
import {
  KNOWLEDGE_CHUNK_OVERLAP,
  KNOWLEDGE_CHUNK_SIZE,
  KNOWLEDGE_INDEX_FILE,
  KNOWLEDGE_INDEX_VERSION,
  KNOWLEDGE_KNOWLEDGE_FILE,
  KNOWLEDGE_METADATA_FILE,
  KNOWLEDGE_PDF_DIR,
  KNOWLEDGE_RAG_ROOT,
  KNOWLEDGE_UPLOADS_FILE,
} from '@/lib/knowledge-base/constants';
import type { KnowledgeDocument } from '@/lib/knowledge-base/types';
import { buildSimplePdf } from '@/lib/knowledge-base/pdf';
import { extractTopKeywords, normalizeText, tokenizeText } from '@/lib/knowledge-base/tokenize';

type IndexedDocument = {
  docId: string;
  title: string;
  module: string;
  summary: string;
  keywords: string[];
  pdfPath: string;
  sourceType: 'seed' | 'upload';
  titleTokens: string[];
  keywordTokens: string[];
  contentTokens: string[];
};

type IndexedChunk = {
  chunkId: string;
  docId: string;
  section?: string;
  text: string;
  tokenSet: string[];
  keywords: string[];
};

type IndexPayload = {
  version: number;
  generatedAt: string;
  sourceSignature: string;
  documents: IndexedDocument[];
};

type MetadataPayload = {
  version: number;
  generatedAt: string;
  sourceSignature: string;
  chunks: IndexedChunk[];
};

type SearchCandidate = {
  docId: string;
  title: string;
  module: string;
  summary: string;
  score: number;
  sourceType: 'seed' | 'upload';
  matchedBy: 'title' | 'keyword' | 'chunk';
  previewText: string;
  titleMatch: boolean;
  keywordMatches: string[];
  topChunks: Array<IndexedChunk & { score: number }>;
};

let documentsCache: KnowledgeDocument[] | null = null;
let documentMapCache: Map<string, KnowledgeDocument> | null = null;
let indexCache: IndexPayload | null = null;
let metadataCache: MetadataPayload | null = null;

async function ensureRagDirectories() {
  await fs.mkdir(KNOWLEDGE_RAG_ROOT, { recursive: true });
  await fs.mkdir(path.dirname(KNOWLEDGE_INDEX_FILE), { recursive: true });
  await fs.mkdir(KNOWLEDGE_PDF_DIR, { recursive: true });
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function computeSourceSignature(documents: KnowledgeDocument[]) {
  return documents
    .map((doc) => `${doc.docId}:${doc.updatedAt}:${doc.content.length}:${doc.pdfPath}`)
    .join('|');
}

function chunkDocument(doc: KnowledgeDocument): IndexedChunk[] {
  const normalized = doc.content.replace(/\r/g, '').trim();
  if (!normalized) return [];

  const chunks: IndexedChunk[] = [];
  let index = 0;
  const step = Math.max(1, KNOWLEDGE_CHUNK_SIZE - KNOWLEDGE_CHUNK_OVERLAP);
  for (let start = 0; start < normalized.length; start += step) {
    const text = normalized.slice(start, start + KNOWLEDGE_CHUNK_SIZE).trim();
    if (!text) continue;
    index += 1;
    const sectionLine = text
      .split('\n')
      .find((line) => line.trim().length > 0)
      ?.trim()
      .slice(0, 80);
    chunks.push({
      chunkId: `${doc.docId}::chunk-${index}`,
      docId: doc.docId,
      section: sectionLine,
      text,
      tokenSet: tokenizeText(text),
      keywords: [...new Set([...doc.keywords, ...extractTopKeywords(text, 8)])],
    });
    if (start + KNOWLEDGE_CHUNK_SIZE >= normalized.length) {
      break;
    }
  }
  return chunks;
}

function createIndexPayload(
  documents: KnowledgeDocument[],
): { index: IndexPayload; metadata: MetadataPayload } {
  const sourceSignature = computeSourceSignature(documents);
  const generatedAt = new Date().toISOString();
  const chunks = documents.flatMap(chunkDocument);
  return {
    index: {
      version: KNOWLEDGE_INDEX_VERSION,
      generatedAt,
      sourceSignature,
      documents: documents.map((doc) => ({
        docId: doc.docId,
        title: doc.title,
        module: doc.module,
        summary: doc.summary,
        keywords: doc.keywords,
        pdfPath: doc.pdfPath,
        sourceType: doc.sourceType,
        titleTokens: tokenizeText(doc.title),
        keywordTokens: [...new Set(doc.keywords.flatMap((keyword) => tokenizeText(keyword)))],
        contentTokens: tokenizeText(doc.content),
      })),
    },
    metadata: {
      version: KNOWLEDGE_INDEX_VERSION,
      generatedAt,
      sourceSignature,
      chunks,
    },
  };
}

async function persistPdfFile(doc: KnowledgeDocument) {
  const pdfFile = path.join(KNOWLEDGE_PDF_DIR, doc.pdfPath);
  try {
    await fs.access(pdfFile);
  } catch {
    const pdf = buildSimplePdf(doc.title, `${doc.summary}\n\n${doc.content}`);
    await fs.writeFile(pdfFile, pdf);
  }
}

async function loadSeedDocuments(): Promise<KnowledgeDocument[]> {
  return readJsonFile<KnowledgeDocument[]>(KNOWLEDGE_KNOWLEDGE_FILE, []);
}

async function loadUploadedDocuments(): Promise<KnowledgeDocument[]> {
  return readJsonFile<KnowledgeDocument[]>(KNOWLEDGE_UPLOADS_FILE, []);
}

export async function getKnowledgeDocumentsFromStore(): Promise<KnowledgeDocument[]> {
  if (documentsCache) {
    return documentsCache;
  }
  await ensureRagDirectories();
  const [seedDocuments, uploadedDocuments] = await Promise.all([
    loadSeedDocuments(),
    loadUploadedDocuments(),
  ]);
  documentsCache = [...seedDocuments, ...uploadedDocuments];
  documentMapCache = new Map(documentsCache.map((doc) => [doc.docId, doc]));
  return documentsCache;
}

export async function getKnowledgeDocumentMap(): Promise<Map<string, KnowledgeDocument>> {
  if (documentMapCache) {
    return documentMapCache;
  }
  await getKnowledgeDocumentsFromStore();
  return documentMapCache ?? new Map();
}

async function loadPersistedIndex(): Promise<{
  index: IndexPayload | null;
  metadata: MetadataPayload | null;
}> {
  const [index, metadata] = await Promise.all([
    readJsonFile<IndexPayload | null>(KNOWLEDGE_INDEX_FILE, null),
    readJsonFile<MetadataPayload | null>(KNOWLEDGE_METADATA_FILE, null),
  ]);
  return { index, metadata };
}

export async function buildKnowledgeIndex(options?: { ensurePdfFiles?: boolean; force?: boolean }) {
  await ensureRagDirectories();
  const documents = await getKnowledgeDocumentsFromStore();
  const sourceSignature = computeSourceSignature(documents);

  if (!options?.force) {
    const { index, metadata } = await loadPersistedIndex();
    if (
      index &&
      metadata &&
      index.version === KNOWLEDGE_INDEX_VERSION &&
      metadata.version === KNOWLEDGE_INDEX_VERSION &&
      index.sourceSignature === sourceSignature &&
      metadata.sourceSignature === sourceSignature
    ) {
      indexCache = index;
      metadataCache = metadata;
      if (options?.ensurePdfFiles) {
        await Promise.all(documents.map(persistPdfFile));
      }
      return;
    }
  }

  if (options?.ensurePdfFiles) {
    await Promise.all(documents.map(persistPdfFile));
  }

  const payload = createIndexPayload(documents);
  await Promise.all([
    fs.writeFile(KNOWLEDGE_INDEX_FILE, JSON.stringify(payload.index, null, 2), 'utf8'),
    fs.writeFile(KNOWLEDGE_METADATA_FILE, JSON.stringify(payload.metadata, null, 2), 'utf8'),
  ]);

  indexCache = payload.index;
  metadataCache = payload.metadata;
}

async function ensureLoaded() {
  if (indexCache && metadataCache) {
    return;
  }
  await buildKnowledgeIndex({ ensurePdfFiles: true });
  if (!indexCache || !metadataCache) {
    const { index, metadata } = await loadPersistedIndex();
    indexCache = index;
    metadataCache = metadata;
  }
}

function overlapScore(queryTokens: string[], targetTokens: string[]): number {
  if (queryTokens.length === 0 || targetTokens.length === 0) return 0;
  const target = new Set(targetTokens);
  let matches = 0;
  for (const token of queryTokens) {
    if (target.has(token)) matches += 1;
  }
  return matches / Math.sqrt(queryTokens.length * Math.max(targetTokens.length, 1));
}

function simplifyQuery(query: string): string {
  return normalizeText(query)
    .replace(/[?.!,，。！？；：]/g, ' ')
    .replace(/什么是|什么叫|请介绍|介绍一下|讲解一下|解释一下|请问|一下/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function searchKnowledgeIndex(query: string, topK = 5): Promise<SearchCandidate[]> {
  await ensureLoaded();
  if (!indexCache || !metadataCache) {
    return [];
  }

  const queryTokens = tokenizeText(query);
  const simplifiedQuery = simplifyQuery(query);
  const chunksByDocId = new Map<string, IndexedChunk[]>();
  for (const chunk of metadataCache.chunks) {
    const list = chunksByDocId.get(chunk.docId) ?? [];
    list.push(chunk);
    chunksByDocId.set(chunk.docId, list);
  }

  return indexCache.documents
    .map((doc) => {
      const matchedChunks = (chunksByDocId.get(doc.docId) ?? [])
        .map((chunk) => {
          const chunkScore = overlapScore(queryTokens, chunk.tokenSet);
          const keywordScore = overlapScore(queryTokens, chunk.keywords);
          const textScore = normalizeText(chunk.text).includes(normalizeText(query)) ? 0.3 : 0;
          return {
            ...chunk,
            score: chunkScore * 0.62 + keywordScore * 0.28 + textScore,
          };
        })
        .filter((chunk) => chunk.score > 0.02)
        .sort((a, b) => b.score - a.score);

      const bestChunkScore = matchedChunks[0]?.score ?? 0;
      const titleMatch =
        !!simplifiedQuery &&
        (simplifiedQuery.includes(normalizeText(doc.title)) ||
          normalizeText(doc.title).includes(simplifiedQuery));
      const keywordMatches = doc.keywords.filter((keyword) => {
        const normalizedKeyword = normalizeText(keyword);
        return (
          queryTokens.includes(normalizedKeyword) ||
          (!!simplifiedQuery &&
            normalizedKeyword.length > 1 &&
            (simplifiedQuery.includes(normalizedKeyword) ||
              normalizedKeyword.includes(simplifiedQuery)))
        );
      });
      const docKeywordScore = overlapScore(queryTokens, [...doc.keywordTokens, ...doc.titleTokens]);
      const docTextScore = overlapScore(queryTokens, doc.contentTokens);
      const titlePhraseMatch = titleMatch ? 0.45 : 0;
      const keywordPhraseMatch = keywordMatches.length > 0 ? 0.32 : 0;
      const score =
        bestChunkScore * 0.52 +
        docKeywordScore * 0.18 +
        docTextScore * 0.08 +
        titlePhraseMatch +
        keywordPhraseMatch;

      let matchedBy: 'title' | 'keyword' | 'chunk' = 'chunk';
      if (titleMatch) {
        matchedBy = 'title';
      } else if (keywordMatches.length > 0) {
        matchedBy = 'keyword';
      }

      return {
        docId: doc.docId,
        title: doc.title,
        module: doc.module,
        summary: doc.summary,
        score,
        sourceType: doc.sourceType,
        matchedBy,
        previewText: matchedChunks[0]?.text.slice(0, 220) ?? doc.summary,
        titleMatch,
        keywordMatches,
        topChunks: matchedChunks.slice(0, 3),
      };
    })
    .filter((candidate) => candidate.score > 0.04)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export function resetRetrieverCache() {
  documentsCache = null;
  documentMapCache = null;
  indexCache = null;
  metadataCache = null;
}
