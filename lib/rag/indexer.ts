/**
 * RAG Indexer — document loading + chunking + embedding + vector store persistence.
 * Replaces the lexical index building in rag/retriever.ts with vector-based indexing.
 * Patterned after DeepTutor's LlamaIndexPipeline + LearnGenie's existing retriever.
 */

import {
  buildKnowledgeIndex,
  type BuildKnowledgeIndexOptions,
} from '@/rag/retriever';
import { getEmbeddingClient } from './embedding/client';
import { LocalVectorStore } from './vector-store/local-store';
import { createLogger } from '@/lib/logger';
import type { ChunkMetadata } from './vector-store/types';
import type { KnowledgeChunk } from '@/lib/knowledge-base/types';

const log = createLogger('RagIndexer');

export interface IndexBuildResult {
  signature: string;
  chunkCount: number;
  documentCount: number;
  embeddingModel: string;
  embeddingDimensions: number;
}

/**
 * Convert a KnowledgeChunk to a ChunkMetadata for the vector store.
 * Also normalizes the text for better embedding quality.
 */
function toChunkMetadata(chunk: KnowledgeChunk): ChunkMetadata {
  return {
    chunkId: chunk.chunkId,
    docId: chunk.docId,
    text: chunk.text.trim(),
    section: chunk.section,
    keywords: chunk.keywords || [],
  };
}

/**
 * Build a vector-based index from all documents in the knowledge store.
 * Steps:
 *   1. Load and chunk documents using the existing retriever pipeline
 *   2. Generate embeddings for all chunks via EmbeddingClient
 *   3. Persist the vector index to disk
 */
export async function buildVectorIndex(
  options: BuildKnowledgeIndexOptions & {
    model: string;
    baseUrl: string;
    dimensions: number;
  },
): Promise<IndexBuildResult> {
  const { model, baseUrl, dimensions } = options;

  log.info(`Building vector index with model=${model}, dim=${dimensions}`);

  // 1. Build the lexical index first (this loads and chunks all documents)
  const lexicalIndex = await buildKnowledgeIndex({
    ensurePdfFiles: options.ensurePdfFiles,
    force: options.force,
  });

  if (lexicalIndex.chunks.length === 0) {
    throw new Error('No chunks generated from documents');
  }

  log.info(`Loaded ${lexicalIndex.documents.length} documents, ${lexicalIndex.chunks.length} chunks`);

  // 2. Convert chunks to metadata
  const chunkMetadata = lexicalIndex.chunks.map(toChunkMetadata);

  // 3. Generate embeddings for all chunks
  const embeddingClient = getEmbeddingClient();
  const texts = chunkMetadata.map((chunk) => chunk.text);

  log.info(`Generating embeddings for ${texts.length} chunks...`);
  const embeddings = await embeddingClient.embed(texts, (done, total) => {
    if (done % 5 === 0 || done === total) {
      log.info(`Embedding progress: ${done}/${total} batches`);
    }
  });

  log.info(`Generated ${embeddings.length} embeddings (dim=${embeddings[0]?.length ?? 0})`);

  // 4. Create the vector store index
  const vectorStore = new LocalVectorStore();
  const signature = await vectorStore.createIndex(
    chunkMetadata,
    embeddings,
    model,
    dimensions,
    baseUrl,
  );

  log.info(`Vector index built: signature=${signature}, chunks=${chunkMetadata.length}`);

  return {
    signature,
    chunkCount: chunkMetadata.length,
    documentCount: lexicalIndex.documents.length,
    embeddingModel: model,
    embeddingDimensions: dimensions,
  };
}

/**
 * Rebuild the vector index, forcing regeneration of embeddings.
 */
export async function rebuildVectorIndex(
  options: {
    model: string;
    baseUrl: string;
    dimensions: number;
  },
): Promise<IndexBuildResult> {
  return buildVectorIndex({ ...options, force: true, ensurePdfFiles: true });
}

/**
 * Check whether a vector index exists and matches the current embedding config.
 */
export async function ensureVectorIndex(
  model: string,
  dimensions: number,
  baseUrl: string,
): Promise<LocalVectorStore> {
  const signature = LocalVectorStore.resolveSignature(model, dimensions, baseUrl);
  const vectorStore = new LocalVectorStore();

  const exists = await vectorStore.loadIndex(signature);
  if (exists) {
    log.info(`Using existing vector index: signature=${signature}`);
    return vectorStore;
  }

  log.info('No matching vector index found, building new one...');
  await buildVectorIndex({ model, baseUrl, dimensions, force: true });
  const loaded = await vectorStore.loadIndex(signature);
  if (!loaded) {
    throw new Error('Failed to load newly built vector index');
  }
  return vectorStore;
}
