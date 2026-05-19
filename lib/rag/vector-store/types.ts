/**
 * Vector store types — chunk metadata and index structures.
 */

export interface ChunkMetadata {
  chunkId: string;
  docId: string;
  text: string;
  section?: string;
  keywords: string[];
}

export interface ScoredChunk {
  chunkId: string;
  docId: string;
  text: string;
  section?: string;
  keywords: string[];
  score: number;
}

export interface VectorStoreIndexData {
  version: number;
  generatedAt: string;
  embeddingSignature: string;
  embeddingModel: string;
  embeddingDimensions: number;
  chunks: ChunkMetadata[];
  embeddings: number[][];
}

export interface VectorSearchResult {
  chunks: ScoredChunk[];
  totalChunks: number;
}
