/**
 * Local JSON-persisted vector store with in-memory cosine similarity search.
 * No external database required — embeds persisted as versioned JSON files.
 * Patterned after DeepTutor's LlamaIndex storage layer.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { createLogger } from '@/lib/logger';
import {
  KNOWLEDGE_INDEX_DIR,
  KNOWLEDGE_INDEX_VERSION,
} from '@/lib/knowledge-base/constants';
import type {
  ChunkMetadata,
  ScoredChunk,
  VectorStoreIndexData,
} from './types';

const log = createLogger('LocalVectorStore');
const CURRENT_VERSION = KNOWLEDGE_INDEX_VERSION;

function getStorePath(signature: string): string {
  return path.join(KNOWLEDGE_INDEX_DIR, `vectors-${signature}.json`);
}

function computeEmbeddingSignature(model: string, dimensions: number, baseUrl: string): string {
  const input = `${model}|${dimensions}|${baseUrl.replace(/\/+$/, '')}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + ch;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  const magA = Math.sqrt(normA);
  const magB = Math.sqrt(normB);
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

/**
 * Hybrid score: combines vector cosine similarity with keyword overlap.
 * Weight: 0.7 vector + 0.3 lexical, following the plan's recommendation.
 */
function hybridScore(
  vectorSim: number,
  queryTokens: Set<string>,
  chunk: ChunkMetadata,
): number {
  let keywordOverlap = 0;
  if (queryTokens.size > 0 && chunk.keywords.length > 0) {
    let hits = 0;
    for (const kw of chunk.keywords) {
      for (const token of queryTokens) {
        if (kw.toLowerCase().includes(token.toLowerCase()) ||
            token.toLowerCase().includes(kw.toLowerCase())) {
          hits += 1;
          break;
        }
      }
    }
    keywordOverlap = hits / Math.max(chunk.keywords.length, queryTokens.size);
  }
  return vectorSim * 0.7 + keywordOverlap * 0.3;
}

export class LocalVectorStore {
  private index: VectorStoreIndexData | null = null;
  private loadedSignature: string | null = null;

  get signature(): string | null {
    return this.loadedSignature;
  }

  get chunkCount(): number {
    return this.index?.chunks.length ?? 0;
  }

  async createIndex(
    chunks: ChunkMetadata[],
    embeddings: number[][],
    model: string,
    dimensions: number,
    baseUrl: string,
  ): Promise<string> {
    if (chunks.length !== embeddings.length) {
      throw new Error(
        `Chunk count (${chunks.length}) does not match embedding count (${embeddings.length})`,
      );
    }
    if (chunks.length === 0) {
      throw new Error('Cannot create index with zero chunks');
    }

    const signature = computeEmbeddingSignature(model, dimensions, baseUrl);
    const data: VectorStoreIndexData = {
      version: CURRENT_VERSION,
      generatedAt: new Date().toISOString(),
      embeddingSignature: signature,
      embeddingModel: model,
      embeddingDimensions: dimensions,
      chunks,
      embeddings,
    };

    const storePath = getStorePath(signature);
    await fs.mkdir(path.dirname(storePath), { recursive: true });
    const json = JSON.stringify(data);
    await fs.writeFile(storePath, json, 'utf8');

    this.index = data;
    this.loadedSignature = signature;

    log.info(`Created vector index: ${chunks.length} chunks, dim=${dimensions}, signature=${signature}`);
    return signature;
  }

  async loadIndex(signature: string): Promise<boolean> {
    if (this.loadedSignature === signature && this.index) return true;

    const storePath = getStorePath(signature);
    try {
      const raw = await fs.readFile(storePath, 'utf8');
      const data = JSON.parse(raw) as VectorStoreIndexData;

      if (data.version !== CURRENT_VERSION) {
        log.warn(`Index version mismatch: ${data.version} vs ${CURRENT_VERSION}`);
        return false;
      }
      if (data.embeddingSignature !== signature) {
        log.warn('Index signature mismatch');
        return false;
      }
      if (!Array.isArray(data.chunks) || !Array.isArray(data.embeddings)) {
        log.warn('Index data corrupted: missing chunks or embeddings');
        return false;
      }
      if (data.chunks.length !== data.embeddings.length) {
        log.warn('Index data corrupted: chunk/embedding count mismatch');
        return false;
      }

      this.index = data;
      this.loadedSignature = signature;
      log.info(`Loaded vector index: ${data.chunks.length} chunks, signature=${signature}`);
      return true;
    } catch (err) {
      log.warn(`Failed to load vector index for signature ${signature}: ${err}`);
      return false;
    }
  }

  search(
    queryEmbedding: number[],
    topK: number,
    queryTokens?: Set<string>,
  ): ScoredChunk[] {
    if (!this.index) {
      throw new Error('Vector store not loaded. Call loadIndex() first.');
    }

    const results: ScoredChunk[] = [];

    for (let i = 0; i < this.index.embeddings.length; i++) {
      const vecSim = cosineSimilarity(queryEmbedding, this.index.embeddings[i]!);
      const chunk = this.index.chunks[i]!;
      const score = queryTokens
        ? hybridScore(vecSim, queryTokens, chunk)
        : vecSim;

      if (score > 0) {
        results.push({
          chunkId: chunk.chunkId,
          docId: chunk.docId,
          text: chunk.text,
          section: chunk.section,
          keywords: chunk.keywords,
          score,
        });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  async insertChunks(
    chunks: ChunkMetadata[],
    embeddings: number[][],
  ): Promise<void> {
    if (!this.index) {
      throw new Error('Vector store not loaded. Create or load an index first.');
    }
    if (chunks.length !== embeddings.length) {
      throw new Error('Chunk/embedding count mismatch');
    }
    if (embeddings[0]?.length !== this.index.embeddingDimensions) {
      throw new Error(
        `Embedding dimension mismatch: got ${embeddings[0]?.length ?? 0}, ` +
        `expected ${this.index.embeddingDimensions}`,
      );
    }

    this.index.chunks.push(...chunks);
    this.index.embeddings.push(...embeddings);
    this.index.generatedAt = new Date().toISOString();

    if (this.loadedSignature) {
      const storePath = getStorePath(this.loadedSignature);
      await fs.writeFile(storePath, JSON.stringify(this.index), 'utf8');
    }

    log.info(`Inserted ${chunks.length} chunks, total=${this.index.chunks.length}`);
  }

  async deleteIndex(signature: string): Promise<boolean> {
    const storePath = getStorePath(signature);
    try {
      await fs.unlink(storePath);
      log.info(`Deleted vector index: signature=${signature}`);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Scan for existing index files on disk and return the signature
   * that matches the given model/dim/baseUrl, if any.
   */
  static resolveSignature(
    model: string,
    dimensions: number,
    baseUrl: string,
  ): string {
    return computeEmbeddingSignature(model, dimensions, baseUrl);
  }

  static async findExistingIndex(signature: string): Promise<boolean> {
    try {
      await fs.access(getStorePath(signature));
      return true;
    } catch {
      return false;
    }
  }
}
