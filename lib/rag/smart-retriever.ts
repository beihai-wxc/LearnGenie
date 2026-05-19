/**
 * SmartRetriever — LLM-powered multi-query expansion and aggregation.
 * Generates diverse search queries from context, executes them in parallel,
 * then synthesises results into a concise answer.
 * Patterned after DeepTutor's smart_retriever.py.
 */

import { searchKnowledgeIndex } from './retriever';
import { createLogger } from '@/lib/logger';

const log = createLogger('SmartRetriever');

export interface SmartRetrieveOptions {
  model: string;
  dimensions: number;
  baseUrl: string;
  maxQueries?: number;
  llmCall?: (prompt: string, systemPrompt: string) => Promise<string>;
}

/**
 * Execute a multi-query retrieval and return aggregated results.
 */
export async function smartRetrieve(
  context: string,
  options: SmartRetrieveOptions,
): Promise<{ answer: string; sources: string[]; passages: string[] }> {
  const maxQueries = options.maxQueries ?? 3;

  // 1. Generate diverse search queries
  const queries = options.llmCall
    ? await generateQueriesWithLLM(context, maxQueries, options.llmCall)
    : deriveQueries(context, maxQueries);

  log.info(`SmartRetrieve: ${queries.length} queries generated`);

  // 2. Parallel search
  const searchOptions = {
    model: options.model,
    dimensions: options.dimensions,
    baseUrl: options.baseUrl,
  };

  const results = await Promise.allSettled(
    queries.map((q) => searchKnowledgeIndex(q, 3, searchOptions)),
  );

  // 3. Collect passages
  const passages: string[] = [];
  const sources: string[] = [];

  for (const result of results) {
    if (result.status === 'rejected') continue;
    for (const item of result.value) {
      const text = item.previewText || item.topChunks[0]?.text;
      if (text && !passages.includes(text)) {
        passages.push(text);
        sources.push(item.title);
      }
    }
  }

  if (passages.length === 0) {
    return { answer: '', sources: [], passages: [] };
  }

  // 4. Aggregate with LLM
  const aggregated = options.llmCall
    ? await aggregateWithLLM(context, passages, options.llmCall)
    : passages.join('\n\n');

  return { answer: aggregated, sources: [...new Set(sources)], passages };
}

async function generateQueriesWithLLM(
  context: string,
  n: number,
  llmCall: (prompt: string, systemPrompt: string) => Promise<string>,
): Promise<string[]> {
  try {
    const prompt = [
      `Generate ${n} diverse search queries to retrieve information relevant`,
      'to the following context. Return ONLY the queries, one per line.',
      '',
      `Context:\n${context.slice(0, 2000)}`,
    ].join(' ');

    const raw = await llmCall(prompt, 'You are a search query generator.');
    return raw
      .split('\n')
      .map((line) => line.trim().replace(/^[\d.\-)\s]+/, ''))
      .filter((line) => line.length > 0)
      .slice(0, n);
  } catch (err) {
    log.warn('Query generation failed, using fallback:', err);
    return deriveQueries(context, n);
  }
}

function deriveQueries(context: string, n: number): string[] {
  const sentences = context
    .split(/[。.!！?？\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  if (sentences.length === 0) return [context.slice(0, 200)];

  const step = Math.max(1, Math.floor(sentences.length / n));
  const queries: string[] = [];
  for (let i = 0; i < sentences.length && queries.length < n; i += step) {
    queries.push(sentences[i]!.slice(0, 200));
  }
  return queries;
}

async function aggregateWithLLM(
  context: string,
  passages: string[],
  llmCall: (prompt: string, systemPrompt: string) => Promise<string>,
): Promise<string> {
  try {
    const combined = passages.join('\n---\n');
    const prompt = [
      'Synthesise the following retrieved passages into a concise,',
      'relevant summary for the given context.',
      '',
      `Context:\n${context.slice(0, 1000)}`,
      '',
      `Passages:\n${combined.slice(0, 6000)}`,
    ].join('\n');

    return await llmCall(prompt, 'You are a knowledge synthesiser.');
  } catch (err) {
    log.warn('Aggregation failed, returning raw passages:', err);
    return passages.join('\n\n');
  }
}
