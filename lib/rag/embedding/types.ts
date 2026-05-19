/**
 * Embedding layer types — provider-agnostic request/response contracts.
 * Patterned after DeepTutor's deeptutor/services/embedding/.
 */

export interface EmbeddingConfig {
  model: string;
  apiKey: string;
  baseUrl: string;
  binding: EmbeddingBinding;
  dimensions?: number;
  batchSize: number;
  batchDelay: number;
  requestTimeout: number;
  extraHeaders?: Record<string, string>;
}

export type EmbeddingBinding =
  | 'openai'
  | 'siliconflow'
  | 'ollama'
  | 'dashscope'
  | 'jina'
  | 'cohere'
  | 'custom';

export interface EmbeddingProviderSpec {
  binding: EmbeddingBinding;
  adapter: string;
  defaultModel: string;
  defaultDimensions: number;
  maxBatchItems: number;
  supportsDimensions: boolean;
}

export interface EmbeddingRequest {
  texts: string[];
  model: string;
  dimensions?: number;
  encodingFormat?: 'float' | 'base64';
}

export interface EmbeddingResponse {
  embeddings: number[][];
  model: string;
  dimensions: number;
  usage?: Record<string, number>;
}

export interface ModelInfo {
  model: string;
  dimensions: number;
  supportedDimensions?: number[];
  supportsVariableDimensions: boolean;
  provider: string;
}
