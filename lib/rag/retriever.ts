/**
 * Vector-based knowledge retriever — replaces the lexical overlap scoring in
 * rag/retriever.ts with embedding-based cosine similarity search, while
 * retaining the existing document metadata enrichment layer.
 */

import {
  searchKnowledgeIndex as lexicalSearch,
  type SearchKnowledgeResult as LexicalSearchResult,
} from '@/rag/retriever';
import { getEmbeddingClient } from './embedding/client';
import { ensureVectorIndex } from './indexer';
import { LocalVectorStore } from './vector-store/local-store';
import { normalizeText, tokenizeText } from '@/lib/knowledge-base/tokenize';
import type { KnowledgeDocument } from '@/lib/knowledge-base/types';
import { createLogger } from '@/lib/logger';

const log = createLogger('VectorRetriever');

export interface SearchKnowledgeResult {
  docId: string;
  title: string;
  module: string;
  chapterId?: string;
  chapterTitle?: string;
  learningStage?: KnowledgeDocument['learningStage'];
  summary: string;
  score: number;
  previewText: string;
  sourceType: KnowledgeDocument['sourceType'];
  sourceLabel: NonNullable<KnowledgeDocument['sourceLabel']>;
  difficulty?: KnowledgeDocument['difficulty'];
  resourceTypes?: NonNullable<KnowledgeDocument['resourceTypes']>;
  estimatedStudyTimeMinutes?: number;
  recommendedTeachingGoals?: string[];
  matchedBy: 'vector' | 'hybrid' | 'title' | 'concept' | 'keyword' | 'chunk';
  conceptMatches: string[];
  topChunks: Array<{
    chunkId: string;
    section?: string;
    text: string;
    score: number;
  }>;
}

let vectorStoreCache: { store: LocalVectorStore; signature: string } | null = null;

async function getVectorStore(
  model: string,
  dimensions: number,
  baseUrl: string,
): Promise<LocalVectorStore> {
  const signature = LocalVectorStore.resolveSignature(model, dimensions, baseUrl);
  if (vectorStoreCache?.signature === signature) {
    return vectorStoreCache.store;
  }
  const store = await ensureVectorIndex(model, dimensions, baseUrl);
  vectorStoreCache = { store, signature };
  return store;
}

export function resetVectorStoreCache(): void {
  vectorStoreCache = null;
}

/**
 * Vector-based knowledge search.
 * Returns results in the same format as the lexical search for drop-in compatibility.
 */
export async function searchKnowledgeIndex(
  query: string,
  topK = 5,
  options: {
    model: string;
    dimensions: number;
    baseUrl: string;
    hybridRatio?: number;
  },
): Promise<SearchKnowledgeResult[]> {
  const normalizedQuery = normalizeText(query);
  const queryTokens = tokenizeText(query);

  if (!normalizedQuery || queryTokens.length === 0) {
    return [];
  }

  // 1. Get vector store
  const vectorStore = await getVectorStore(options.model, options.dimensions, options.baseUrl);

  // 2. Generate query embedding
  const embeddingClient = getEmbeddingClient();
  const queryEmbedding = await embeddingClient.embedSingle(normalizedQuery);

  // 3. Vector search with optional hybrid scoring
  const queryTokenSet = new Set(queryTokens.map((t) => t.toLowerCase()));
  const results = await vectorStore.search(queryEmbedding, topK * 3, queryTokenSet);

  if (results.length === 0) {
    return [];
  }

  // 4. Also run lexical search for hybrid combination
  let lexicalResults: LexicalSearchResult[] = [];
  try {
    lexicalResults = await lexicalSearch(query, topK * 2);
  } catch (err) {
    log.warn('Lexical search fallback failed:', err);
  }

  // 5. Merge vector and lexical results, aggregate by docId
  const docScores = new Map<string, {
    vectorScore: number;
    lexicalScore: number;
    topChunks: SearchKnowledgeResult['topChunks'];
  }>();

  for (const result of results) {
    const existing = docScores.get(result.docId);
    if (!existing || result.score > existing.vectorScore) {
      docScores.set(result.docId, {
        vectorScore: result.score,
        lexicalScore: existing?.lexicalScore ?? 0,
        topChunks: [{
          chunkId: result.chunkId,
          section: result.section,
          text: result.text.slice(0, 220),
          score: result.score,
        }],
      });
    } else if (docScores.get(result.docId)!.topChunks.length < 3) {
      docScores.get(result.docId)!.topChunks.push({
        chunkId: result.chunkId,
        section: result.section,
        text: result.text.slice(0, 220),
        score: result.score,
      });
    }
  }

  // Add lexical results to the merge
  const lexicalMap = new Map(lexicalResults.map((r) => [r.docId, r]));
  for (const [docId, lr] of lexicalMap) {
    const existing = docScores.get(docId);
    if (existing) {
      existing.lexicalScore = lr.score;
    } else {
      docScores.set(docId, {
        vectorScore: 0,
        lexicalScore: lr.score,
        topChunks: lr.topChunks.map((c: { chunkId: string; section?: string; text: string; score: number }) => ({
          chunkId: c.chunkId,
          section: c.section,
          text: c.text,
          score: c.score,
        })),
      });
    }
    // Merge concept matches from lexical search
    if (lr.conceptMatches?.length && existing) {
      // Store concept matches for later enrichment
      existing.topChunks[0] = {
        ...existing.topChunks[0]!,
        text: existing.topChunks[0]!.text,
      };
    }
  }

  // 6. Compute final hybrid scores and build results
  const hybridRatio = options.hybridRatio ?? 0.7;
  const finalResults: SearchKnowledgeResult[] = [];

  for (const [docId, scores] of docScores) {
    const combinedScore = scores.vectorScore * hybridRatio + scores.lexicalScore * (1 - hybridRatio);
    const lr = lexicalMap.get(docId);
    const conceptMatches = lr?.conceptMatches ?? [];

    finalResults.push({
      docId,
      title: lr?.title ?? docId,
      module: lr?.module ?? '',
      chapterId: lr?.chapterId,
      chapterTitle: lr?.chapterTitle,
      learningStage: lr?.learningStage,
      summary: lr?.summary ?? '',
      score: Number(combinedScore.toFixed(4)),
      previewText: scores.topChunks[0]?.text ?? lr?.previewText ?? '',
      sourceType: lr?.sourceType ?? 'seed',
      sourceLabel: lr?.sourceLabel ?? '核心知识',
      difficulty: lr?.difficulty,
      resourceTypes: lr?.resourceTypes,
      estimatedStudyTimeMinutes: lr?.estimatedStudyTimeMinutes,
      recommendedTeachingGoals: lr?.recommendedTeachingGoals,
      matchedBy: scores.vectorScore > 0 && scores.lexicalScore > 0 ? 'hybrid' : 'vector',
      conceptMatches,
      topChunks: scores.topChunks.slice(0, 3),
    });
  }

  return finalResults
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Pure vector search (no lexical fallback). Faster but may miss exact term matches.
 */
export async function pureVectorSearch(
  query: string,
  topK = 5,
  options: {
    model: string;
    dimensions: number;
    baseUrl: string;
  },
): Promise<SearchKnowledgeResult[]> {
  return searchKnowledgeIndex(query, topK, { ...options, hybridRatio: 1.0 });
}
