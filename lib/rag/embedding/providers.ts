/**
 * Embedding provider registry — maps binding names to adapter specs.
 * Patterned after DeepTutor's provider_runtime.py EMBEDDING_PROVIDERS.
 */

import type { EmbeddingBinding, EmbeddingProviderSpec } from './types';

export const EMBEDDING_PROVIDERS: Record<EmbeddingBinding, EmbeddingProviderSpec> = {
  openai: {
    binding: 'openai',
    adapter: 'openai_compat',
    defaultModel: 'text-embedding-3-large',
    defaultDimensions: 3072,
    maxBatchItems: 2048,
    supportsDimensions: true,
  },
  siliconflow: {
    binding: 'siliconflow',
    adapter: 'openai_compat',
    defaultModel: 'Qwen3-Embedding-8B',
    defaultDimensions: 4096,
    maxBatchItems: 32,
    supportsDimensions: false,
  },
  ollama: {
    binding: 'ollama',
    adapter: 'openai_compat',
    defaultModel: 'nomic-embed-text',
    defaultDimensions: 768,
    maxBatchItems: 256,
    supportsDimensions: false,
  },
  dashscope: {
    binding: 'dashscope',
    adapter: 'openai_compat',
    defaultModel: 'qwen3-vl-embedding',
    defaultDimensions: 2560,
    maxBatchItems: 20,
    supportsDimensions: false,
  },
  jina: {
    binding: 'jina',
    adapter: 'openai_compat',
    defaultModel: 'jina-embeddings-v3',
    defaultDimensions: 1024,
    maxBatchItems: 256,
    supportsDimensions: false,
  },
  cohere: {
    binding: 'cohere',
    adapter: 'cohere',
    defaultModel: 'embed-v4.0',
    defaultDimensions: 1024,
    maxBatchItems: 96,
    supportsDimensions: false,
  },
  custom: {
    binding: 'custom',
    adapter: 'openai_compat',
    defaultModel: '',
    defaultDimensions: 0,
    maxBatchItems: 256,
    supportsDimensions: false,
  },
};

export function resolveAdapterClass(binding: EmbeddingBinding): string {
  return EMBEDDING_PROVIDERS[binding]?.adapter || 'openai_compat';
}

export function getProviderSpec(binding: EmbeddingBinding): EmbeddingProviderSpec {
  const spec = EMBEDDING_PROVIDERS[binding];
  if (!spec) {
    const supported = Object.keys(EMBEDDING_PROVIDERS).join(', ');
    throw new Error(`Unknown embedding binding: '${binding}'. Supported: ${supported}`);
  }
  return spec;
}
