/**
 * Base embedding adapter — abstract contract all providers must implement.
 * Patterned after DeepTutor's deeptutor/services/embedding/adapters/base.py.
 */

import type { EmbeddingRequest, EmbeddingResponse, ModelInfo } from '../types';

export class EmbeddingProviderError extends Error {
  constructor(
    message: string,
    public status?: number,
    public body?: string,
    public model?: string,
    public url?: string,
    public provider?: string,
  ) {
    super(message);
    this.name = 'EmbeddingProviderError';
  }

  override toString(): string {
    const parts = [this.message];
    if (this.provider) parts.push(`provider=${this.provider}`);
    if (this.model) parts.push(`model=${this.model}`);
    if (this.status !== undefined) parts.push(`status=${this.status}`);
    if (this.url) parts.push(`url=${this.url}`);
    if (this.body) {
      parts.push(`body=${this.body.length <= 500 ? this.body : this.body.slice(0, 500) + '...(truncated)'}`);
    }
    return parts.join(' | ');
  }
}

export interface AdapterConfig {
  apiKey: string;
  baseUrl: string;
  apiVersion?: string;
  model: string;
  dimensions?: number;
  sendDimensions?: boolean | null;
  requestTimeout: number;
  extraHeaders: Record<string, string>;
}

export abstract class BaseEmbeddingAdapter {
  protected apiKey: string;
  protected baseUrl: string;
  protected apiVersion?: string;
  protected model: string;
  protected dimensions?: number;
  protected sendDimensions: boolean | null;
  protected requestTimeout: number;
  protected extraHeaders: Record<string, string>;

  constructor(config: AdapterConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.apiVersion = config.apiVersion;
    this.model = config.model;
    this.dimensions = config.dimensions;
    this.sendDimensions = config.sendDimensions ?? null;
    this.requestTimeout = config.requestTimeout;
    this.extraHeaders = config.extraHeaders;
  }

  abstract embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;
  abstract getModelInfo(): ModelInfo;
}
