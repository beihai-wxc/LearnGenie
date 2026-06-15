/**
 * Qwen Image (Alibaba Cloud / DashScope) Image Generation Adapter
 *
 * Uses DashScope multimodal generation API (synchronous, no polling needed).
 * Endpoint: https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
 *
 * Supported models (Wan 2.7 series & Qwen Image 2.0, updated 2026-06):
 * - wan2.7-image-pro     (highest quality, supports 4K)
 * - qwen-image-2.0-pro    (latest generation, high quality)
 * - wan2.7-image         (faster generation speed)
 *
 * Fallback chain (when primary model fails due to quota/rate-limit):
 *   wan2.7-image-pro → qwen-image-2.0-pro → wan2.7-image
 *
 * Legacy Qwen-Image models may also work via this endpoint depending on
 * account access, but Wan 2.7 / Qwen Image 2.0 is the current recommended series.
 *
 * API docs: https://help.aliyun.com/zh/model-studio/wan-image-generation-and-editing-api-reference
 */

import type {
  ImageGenerationConfig,
  ImageGenerationOptions,
  ImageGenerationResult,
} from '../types';
import { createLogger } from '@/lib/logger';

const log = createLogger('QwenImageAdapter');

const DEFAULT_MODEL = 'wan2.7-image-pro';
const DEFAULT_BASE_URL = 'https://dashscope.aliyuncs.com';

/**
 * Fallback chain for same-provider model degradation.
 * When the requested model fails (quota exhausted, rate limit, etc.),
 * the adapter tries each model in order until one succeeds.
 *
 * Order: highest quality → latest → fastest
 */
const MODEL_FALLBACK_CHAIN: string[] = [
  'wan2.7-image-pro',
  'qwen-image-2.0-pro',
  'wan2.7-image',
];

/**
 * Legacy model name → current valid model mapping.
 * Frontend localStorage may cache old model IDs; this maps them
 * to the current valid names so existing users don't get 404s.
 */
const LEGACY_MODEL_MAP: Record<string, string> = {
  'qwen-image-max': 'wan2.7-image-pro',
  'qwen-image-max-2025-12-30': 'wan2.7-image-pro',
  'qwen-image-plus': 'wan2.7-image',
  'qwen-image-plus-2026-01-09': 'wan2.7-image',
  'qwen-image': 'wan2.7-image',
  'z-image-turbo': 'wan2.7-image',
};

/** HTTP status codes and error patterns that indicate quota/rate-limit issues */
const RETRYABLE_PATTERNS = [
  'QuotaExceeded',
  'quota',
  'RateLimit',
  'rate.limit',
  'throttling',
  'ResourceExhausted',
  'InsufficientBalance',
  '429',
];

/**
 * Resolve the effective model ID, translating legacy names to current ones.
 */
function resolveModel(rawModel: string | undefined): string {
  if (!rawModel) return DEFAULT_MODEL;
  return LEGACY_MODEL_MAP[rawModel] || rawModel;
}

/**
 * Build the fallback chain starting from the resolved primary model.
 * Ensures the requested model is tried first, then falls back through
 * the remaining models in priority order (without duplicates).
 */
function buildFallbackChain(primaryModel: string): string[] {
  const resolved = resolveModel(primaryModel);
  const seen = new Set<string>();
  const chain: string[] = [];

  // Primary model first
  if (!seen.has(resolved)) {
    chain.push(resolved);
    seen.add(resolved);
  }

  // Then the rest of the fallback chain in order
  for (const model of MODEL_FALLBACK_CHAIN) {
    if (!seen.has(model)) {
      chain.push(model);
      seen.add(model);
    }
  }

  return chain;
}

/**
 * Check if an error indicates a retryable condition (quota, rate-limit, etc.)
 * that should trigger fallback to the next model.
 */
function isRetryableError(errorMsg: string): boolean {
  const lower = errorMsg.toLowerCase();
  return RETRYABLE_PATTERNS.some((pattern) => lower.includes(pattern.toLowerCase()));
}

/**
 * Map our width x height to DashScope size format "WxH".
 * Common sizes: 1024*1024, 1280*720, 1664*928, 1120*1440, etc.
 */
function resolveDashScopeSize(options: ImageGenerationOptions): string {
  const w = options.width || 1024;
  const h = options.height || 576;
  return `${w}*${h}`;
}

/**
 * Make a single image generation call to DashScope with a specific model.
 * Returns the result or throws on failure.
 */
async function callDashScope(
  config: ImageGenerationConfig,
  options: ImageGenerationOptions,
  model: string,
): Promise<ImageGenerationResult> {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  const url = `${baseUrl}/api/v1/services/aigc/multimodal-generation/generation`;

  log.info(`Calling Qwen Image: model=${model}, url=${url}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: {
        messages: [
          {
            role: 'user',
            content: [{ text: options.prompt }],
          },
        ],
      },
      parameters: {
        negative_prompt: options.negativePrompt || undefined,
        prompt_extend: true,
        watermark: false,
        size: resolveDashScopeSize(options),
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Qwen Image failed (${response.status}): ${text}`);
  }

  const data = await response.json();

  // DashScope multimodal generation response format:
  // { output: { choices: [{ message: { content: [{ image: "url" }] } }] } }
  const choices = data.output?.choices;
  if (!choices || choices.length === 0) {
    if (data.code || data.message) {
      throw new Error(`Qwen Image error [${data.code}]: ${data.message}`);
    }
    throw new Error('Qwen Image returned empty response');
  }

  const content = choices[0]?.message?.content;
  const imageContent = content?.find((c: { image?: string }) => c.image);

  if (!imageContent?.image) {
    throw new Error('Qwen Image response missing image URL');
  }

  return {
    url: imageContent.image,
    width: options.width || 1024,
    height: options.height || 576,
  };
}

/**
 * Lightweight connectivity test — validates API key by making a minimal
 * request. 401/403 means key invalid; other errors mean key is valid.
 */
export async function testQwenImageConnectivity(
  config: ImageGenerationConfig,
): Promise<{ success: boolean; message: string }> {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  try {
    const response = await fetch(
      `${baseUrl}/api/v1/services/aigc/multimodal-generation/generation`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: resolveModel(config.model),
          input: { messages: [{ role: 'user', content: [{ text: '' }] }] },
          parameters: { size: '1*1' },
        }),
      },
    );
    if (response.status === 401 || response.status === 403) {
      const text = await response.text();
      return {
        success: false,
        message: `Qwen Image auth failed (${response.status}): ${text}`,
      };
    }
    return { success: true, message: 'Connected to Qwen Image' };
  } catch (err) {
    return { success: false, message: `Qwen Image connectivity error: ${err}` };
  }
}

/**
 * Generate an image using Qwen Image (DashScope) with automatic model fallback.
 *
 * When the primary model fails due to quota exhaustion or rate limiting,
 * automatically tries the next model in the fallback chain:
 *   wan2.7-image-pro → qwen-image-2.0-pro → wan2.7-image
 *
 * All fallback attempts are logged so users can see which model was used.
 */
export async function generateWithQwenImage(
  config: ImageGenerationConfig,
  options: ImageGenerationOptions,
): Promise<ImageGenerationResult> {
  const chain = buildFallbackChain(config.model || DEFAULT_MODEL);
  let lastError: Error | null = null;

  for (let i = 0; i < chain.length; i++) {
    const model = chain[i];
    const isFallback = i > 0;

    try {
      const result = await callDashScope(config, options, model);

      if (isFallback) {
        log.warn(
          `Qwen Image fallback succeeded: primary model "${chain[0]}" failed, used fallback "${model}"`,
        );
      }

      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      const errMsg = lastError.message;

      log.warn(
        `Qwen Image attempt ${i + 1}/${chain.length} failed for model "${model}": ${errMsg}`,
      );

      // If error is not retryable (auth error, invalid request, etc.), don't fallback
      if (!isRetryableError(errMsg)) {
        log.error(
          `Qwen Image non-retryable error for model "${model}", aborting fallback: ${errMsg}`,
        );
        throw lastError;
      }

      // If this was the last model in the chain, throw the last error
      if (i === chain.length - 1) {
        log.error(
          `Qwen Image all ${chain.length} models exhausted. Last error (${model}): ${errMsg}`,
        );
        throw new Error(
          `All Qwen Image models unavailable (tried: ${chain.join(', ')}). Last error: ${errMsg}`,
        );
      }

      log.info(
        `Qwen Image retryable error for model "${model}", falling back to "${chain[i + 1]}"...`,
      );
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError || new Error('Qwen Image generation failed');
}
