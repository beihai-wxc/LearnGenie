/**
 * Shared model resolution utilities for API routes.
 *
 * Extracts the repeated parseModelString → resolveApiKey → resolveBaseUrl →
 * resolveProxy → getModel boilerplate into a single call.
 */

import type { NextRequest } from 'next/server';
import { getModel, parseModelString, type ModelWithInfo } from '@/lib/ai/providers';
import { resolveApiKey, resolveBaseUrl, resolveProxy } from '@/lib/server/provider-config';
import { validateUrlForSSRF } from '@/lib/server/ssrf-guard';

export interface ResolvedModel extends ModelWithInfo {
  /** Original model string (e.g. "openai/gpt-4o-mini") */
  modelString: string;
  /** Resolved provider ID (e.g. "openai", "ollama") */
  providerId: string;
  /** Effective API key after server-side fallback resolution */
  apiKey: string;
}

/**
 * Resolve a language model from explicit parameters.
 *
 * Use this when model config comes from the request body.
 */
export async function resolveModel(params: {
  modelString?: string;
  apiKey?: string;
  baseUrl?: string;
  providerType?: string;
}): Promise<ResolvedModel> {
  const serverModel = process.env.DEFAULT_MODEL;

  // Use server DEFAULT_MODEL as override when set.
  // This ensures the app uses the configured server model regardless of
  // stale client-side config.
  let resolvedModelString = serverModel || params.modelString || 'gpt-4o-mini';
  let resolvedApiKey = serverModel ? '' : (params.apiKey || '');
  let resolvedBaseUrl = serverModel ? undefined : params.baseUrl;
  let resolvedProviderType = serverModel ? undefined : params.providerType;

  const { providerId, modelId } = parseModelString(resolvedModelString);

  // SSRF validation applies only to client-supplied base URLs.
  // Server-configured URLs (e.g. OLLAMA_BASE_URL from env/YAML) flow through
  // resolveBaseUrl() and bypass this check — they're trusted by the operator.
  const clientBaseUrl = resolvedBaseUrl || undefined;
  if (clientBaseUrl && process.env.NODE_ENV === 'production') {
    const ssrfError = await validateUrlForSSRF(clientBaseUrl);
    if (ssrfError) {
      throw new Error(ssrfError);
    }
  }

  const effectiveApiKey = clientBaseUrl
    ? resolvedApiKey || ''
    : resolveApiKey(providerId, resolvedApiKey || '');
  const effectiveBaseUrl = clientBaseUrl
    ? clientBaseUrl
    : resolveBaseUrl(providerId, resolvedBaseUrl);
  const proxy = resolveProxy(providerId);
  const { model, modelInfo } = getModel({
    providerId,
    modelId,
    apiKey: effectiveApiKey,
    baseUrl: effectiveBaseUrl,
    proxy,
    providerType: resolvedProviderType as 'openai' | 'anthropic' | 'google' | undefined,
  });

  return { model, modelInfo, modelString: resolvedModelString, providerId, apiKey: effectiveApiKey };
}

/**
 * Resolve a language model from standard request headers.
 *
 * Reads: x-model, x-api-key, x-base-url, x-provider-type
 * Note: requiresApiKey is derived server-side from the provider registry,
 * never from client headers, to prevent auth bypass.
 */
export async function resolveModelFromHeaders(req: NextRequest): Promise<ResolvedModel> {
  // Use server DEFAULT_MODEL as override when set.
  // This ensures the app uses the configured server model regardless of
  // stale client-side localStorage (e.g. cached GLM config after user
  // deleted the model switcher UI).
  const serverModel = process.env.DEFAULT_MODEL;
  if (serverModel) {
    return resolveModel({
      modelString: serverModel,
      apiKey: '', // Let resolveModel fall back to server-side env config
      baseUrl: undefined, // Let resolveModel use provider default
      providerType: undefined, // Let resolveModel infer from registry
    });
  }

  // Fallback: use client-provided model config
  return resolveModel({
    modelString: req.headers.get('x-model') || undefined,
    apiKey: req.headers.get('x-api-key') || undefined,
    baseUrl: req.headers.get('x-base-url') || undefined,
    providerType: req.headers.get('x-provider-type') || undefined,
  });
}
