/**
 * Unified embedding client — factory and batch-embedding orchestrator.
 * Patterned after DeepTutor's deeptutor/services/embedding/client.py.
 */

import type { EmbeddingBinding, EmbeddingConfig } from './types';
import { BaseEmbeddingAdapter } from './adapters/base';
import { OpenAICompatibleAdapter } from './adapters/openai-compat';
import { EMBEDDING_PROVIDERS } from './providers';
import { validateEmbeddingBatch } from './validation';

function buildAdapter(config: EmbeddingConfig): BaseEmbeddingAdapter {
  const spec = EMBEDDING_PROVIDERS[config.binding];
  if (!spec) {
    const supported = Object.keys(EMBEDDING_PROVIDERS).join(', ');
    throw new Error(`Unknown embedding binding: '${config.binding}'. Supported: ${supported}`);
  }

  const adapterConfig = {
    apiKey: config.apiKey,
    baseUrl: config.baseUrl,
    model: config.model,
    dimensions: config.dimensions,
    requestTimeout: config.requestTimeout,
    extraHeaders: config.extraHeaders || {},
  };

  switch (spec.adapter) {
    case 'openai_compat':
      return new OpenAICompatibleAdapter(adapterConfig);
    default:
      return new OpenAICompatibleAdapter(adapterConfig);
  }
}

export class EmbeddingClient {
  private config: EmbeddingConfig;
  private adapter: BaseEmbeddingAdapter;

  constructor(config: EmbeddingConfig) {
    this.config = config;
    this.adapter = buildAdapter(config);
  }

  async embed(
    texts: string[],
    progressCallback?: (done: number, total: number) => void,
  ): Promise<number[][]> {
    if (!texts.length) return [];

    const spec = EMBEDDING_PROVIDERS[this.config.binding];
    const providerMax = spec?.maxBatchItems ?? 256;
    const batchSize = Math.max(1, Math.min(this.config.batchSize, providerMax));
    const allEmbeddings: number[][] = [];
    const totalBatches = Math.ceil(texts.length / batchSize);

    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize;
      const batch = texts.slice(start, start + batchSize);

      const response = await this.adapter.embed({
        texts: batch,
        model: this.config.model,
        dimensions: this.config.dimensions,
      });

      validateEmbeddingBatch(
        response.embeddings,
        batch.length,
        this.config.binding,
        this.config.model,
        i + 1,
        totalBatches,
      );

      allEmbeddings.push(...response.embeddings);

      if (progressCallback) {
        try {
          progressCallback(i + 1, totalBatches);
        } catch { /* ignore */ }
      }

      if (i < totalBatches - 1 && this.config.batchDelay > 0) {
        await sleep(this.config.batchDelay * 1000);
      }
    }

    return allEmbeddings;
  }

  async embedSingle(text: string): Promise<number[]> {
    const result = await this.embed([text]);
    return result[0]!;
  }

  getConfig(): EmbeddingConfig {
    return { ...this.config };
  }

  getModelInfo() {
    return this.adapter.getModelInfo();
  }

  static async verifyConnectivity(config: EmbeddingConfig): Promise<{ ok: boolean; message: string }> {
    try {
      const client = new EmbeddingClient(config);
      await client.embed(['test']);
      return { ok: true, message: 'Embedding connection verified.' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { ok: false, message };
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let _client: EmbeddingClient | null = null;

export function getEmbeddingClient(config?: EmbeddingConfig): EmbeddingClient {
  if (config) {
    _client = new EmbeddingClient(config);
  }
  if (!_client) {
    throw new Error('EmbeddingClient not initialized. Call with config first.');
  }
  return _client;
}

export function resetEmbeddingClient(): void {
  _client = null;
}
