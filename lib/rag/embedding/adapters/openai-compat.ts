/**
 * OpenAI-compatible embedding adapter.
 * Supports OpenAI, DeepSeek, SiliconFlow, Qwen, Ollama, and any
 * OpenAI-compatible endpoint.
 * Patterned after DeepTutor's openai_compatible.py.
 */

import type { EmbeddingRequest, EmbeddingResponse } from '../types';
import { BaseEmbeddingAdapter, EmbeddingProviderError, type AdapterConfig } from './base';

const MODELS_INFO: Record<string, { default: number; dimensions: number[] }> = {
  'text-embedding-3-large': { default: 3072, dimensions: [256, 512, 1024, 3072] },
  'text-embedding-3-small': { default: 1536, dimensions: [512, 1536] },
  'text-embedding-ada-002': { default: 1536, dimensions: [] },
};

export class OpenAICompatibleAdapter extends BaseEmbeddingAdapter {
  private static readonly NO_KEY_SENTINEL = 'sk-no-key-required';
  private static readonly MAX_RETRIES = 5;
  private static readonly RETRY_BACKOFF = 1.0;
  private static readonly RATE_LIMIT_BACKOFF = 5.0;

  override async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const apiKey = this.resolveApiKey();

    if (this.apiVersion && apiKey) {
      headers['api-key'] = apiKey;
    } else if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    for (const [k, v] of Object.entries(this.extraHeaders)) {
      headers[k] = v;
    }

    const payload: Record<string, unknown> = {
      input: request.texts,
      model: request.model || this.model,
      encoding_format: request.encodingFormat || 'float',
    };

    if (request.dimensions || this.dimensions) {
      const dimValue = request.dimensions || this.dimensions;
      if (dimValue && this.shouldSendDimensions(request.model || this.model)) {
        payload.dimensions = dimValue;
      }
    }

    let url = this.baseUrl;
    if (this.apiVersion) {
      url += url.includes('?') ? `&api-version=${this.apiVersion}` : `?api-version=${this.apiVersion}`;
    }

    const timeout = Math.max(this.requestTimeout, 60) * 1000;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= 1 + OpenAICompatibleAdapter.MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (response.status === 429) {
          const retryAfter = parseFloat(response.headers.get('Retry-After') || '0');
          const wait = Math.max(retryAfter, OpenAICompatibleAdapter.RATE_LIMIT_BACKOFF * Math.pow(2, attempt));
          console.warn(`Embedding rate limited (429) attempt ${attempt}, retrying in ${wait.toFixed(1)}s...`);
          await sleep(wait * 1000);
          lastError = new Error('HTTP 429 Too Many Requests');
          continue;
        }

        if (response.status >= 400) {
          const bodyText = await response.text();
          throw new EmbeddingProviderError(
            `Embedding provider returned HTTP ${response.status}`,
            response.status,
            bodyText,
            request.model || this.model,
            url,
            'openai_compat',
          );
        }

        const contentType = response.headers.get('content-type') || '';
        let data: unknown;
        try {
          data = await response.json();
        } catch {
          const bodyText = await response.text();
          const bodyPreview = bodyText.trim().slice(0, 200) || '<empty body>';
          let hint = '';
          if (contentType.includes('text/html') || bodyPreview.startsWith('<')) {
            hint = ' Response was HTML, not JSON — the URL may be wrong.';
          } else if (!bodyText.trim()) {
            hint = ' Response body was empty — the endpoint may not support embeddings.';
          }
          throw new EmbeddingProviderError(
            `Embedding provider returned non-JSON response (content-type=${contentType!})${hint}`,
            response.status,
            bodyText,
            request.model || this.model,
            url,
            'openai_compat',
          );
        }

        const embeddings = extractEmbeddings(data);
        if (!embeddings.length) {
          throw new Error('Embedding response parsed but no vectors found.');
        }

        const actualDims = embeddings[0]?.length ?? 0;
        const modelName = (data as Record<string, unknown>)?.model as string | undefined;

        return {
          embeddings,
          model: modelName || request.model || this.model,
          dimensions: actualDims,
          usage: (data as Record<string, unknown>)?.usage as Record<string, number> | undefined,
        };
      } catch (err) {
        if (err instanceof EmbeddingProviderError) throw err;
        if (err instanceof DOMException && err.name === 'AbortError') {
          lastError = new Error(`Embedding request timed out after ${timeout}ms`);
        } else {
          lastError = err instanceof Error ? err : new Error(String(err));
        }

        if (attempt <= OpenAICompatibleAdapter.MAX_RETRIES) {
          const wait = OpenAICompatibleAdapter.RETRY_BACKOFF * Math.pow(2, attempt);
          console.warn(`Embedding transport error (${lastError.message}) attempt ${attempt}, retrying in ${wait.toFixed(1)}s...`);
          await sleep(wait * 1000);
        } else {
          throw lastError;
        }
      }
    }

    throw lastError || new Error('Embedding request failed after all retries');
  }

  override getModelInfo() {
    const modelInfo = MODELS_INFO[this.model];
    if (modelInfo) {
      return {
        model: this.model,
        dimensions: modelInfo.default,
        supportedDimensions: modelInfo.dimensions,
        supportsVariableDimensions: modelInfo.dimensions.length > 1,
        provider: 'openai_compatible',
      };
    }
    return {
      model: this.model,
      dimensions: this.dimensions ?? 0,
      supportsVariableDimensions: false,
      provider: 'openai_compatible',
    };
  }

  private resolveApiKey(): string {
    const key = (this.apiKey || '').trim();
    return key === OpenAICompatibleAdapter.NO_KEY_SENTINEL ? '' : key;
  }

  private shouldSendDimensions(modelName: string): boolean {
    if (this.sendDimensions === true) return true;
    if (this.sendDimensions === false) return false;
    const lower = modelName.toLowerCase();
    if (lower.startsWith('text-embedding-3')) return true;
    if (lower.includes('qwen3-embedding') || lower.includes('qwen3-vl-embedding')) return true;
    return false;
  }
}

function extractEmbeddings(data: unknown): number[][] {
  if (!data || typeof data !== 'object') {
    throw new Error(`Embedding response is not a JSON object: type=${typeof data}`);
  }
  const d = data as Record<string, unknown>;

  if ('error' in d) {
    const err = d.error as Record<string, unknown> | undefined;
    const msg = err?.message || err?.msg || err?.detail || JSON.stringify(err);
    throw new Error(`Embedding provider error: ${msg}`);
  }

  const candidates: unknown[] = [];

  if (Array.isArray(d.data)) candidates.push(d.data);
  if (Array.isArray(d.embeddings)) candidates.push(d.embeddings);
  if (Array.isArray(d.embedding)) {
    const emb = d.embedding as unknown[];
    candidates.push(emb.length > 0 && typeof emb[0] === 'number' ? [emb] : emb);
  }

  for (const key of ['result', 'output'] as const) {
    const nested = d[key];
    if (nested && typeof nested === 'object') {
      const nd = nested as Record<string, unknown>;
      if (Array.isArray(nd.data)) candidates.push(nd.data);
      if (Array.isArray(nd.embeddings)) candidates.push(nd.embeddings);
    }
  }

  for (const c of candidates) {
    if (!Array.isArray(c) || c.length === 0) continue;
    const first = c[0];
    if (first && typeof first === 'object' && 'embedding' in (first as object)) {
      return c.map((item) => (item as Record<string, unknown>).embedding as number[] || []);
    }
    if (Array.isArray(first)) {
      return c.filter((item): item is number[] => Array.isArray(item));
    }
  }

  throw new Error(
    `Cannot parse embeddings from response. Top-level keys: ${Object.keys(d).sort().join(', ')}`,
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
