/**
 * Qwen Image (Alibaba Cloud / DashScope) Image Generation Adapter
 *
 * Uses DashScope multimodal generation API (synchronous, no polling needed).
 * Endpoint: https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
 *
 * Supported models (Wan 2.7 series, updated 2026-05):
 * - wan2.7-image-pro     (highest quality, supports 4K)
 * - wan2.7-image         (faster generation speed)
 *
 * Legacy Qwen-Image models may also work via this endpoint depending on
 * account access, but Wan 2.7 is the current recommended series.
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
 * Legacy model name → current Wan 2.7 model mapping.
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

/** Resolve the effective model, translating legacy names */
function resolveModel(rawModel: string | undefined): string {
  if (!rawModel) return DEFAULT_MODEL;
  return LEGACY_MODEL_MAP[rawModel] || rawModel;
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

export async function generateWithQwenImage(
  config: ImageGenerationConfig,
  options: ImageGenerationOptions,
): Promise<ImageGenerationResult> {
  const baseUrl = config.baseUrl || DEFAULT_BASE_URL;
  const url = `${baseUrl}/api/v1/services/aigc/multimodal-generation/generation`;
  log.info(`Calling Qwen Image: model=${resolveModel(config.model)}, url=${url}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: resolveModel(config.model),
      input: {
        messages: [
          {
            role: 'user',
            content: [
              {
                text: options.prompt,
              },
            ],
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
    throw new Error(`Qwen Image generation failed (${response.status}): ${text}`);
  }

  const data = await response.json();

  // DashScope multimodal generation response format:
  // { output: { choices: [{ message: { content: [{ image: "url" }] } }] } }
  const choices = data.output?.choices;
  if (!choices || choices.length === 0) {
    // Check for error in response
    if (data.code || data.message) {
      throw new Error(`Qwen Image error: ${data.code} - ${data.message}`);
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
