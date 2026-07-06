import fs from 'node:fs';
import path from 'node:path';
import { buildKnowledgeIndex } from './retriever';

// Load .env.local so EMBEDDING_* variables are available to the CLI script.
// (Next.js loads this automatically for the app, but tsx CLI scripts do not.)
try {
  const envPath = path.join(process.cwd(), '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  }
} catch {
  // .env.local not found or unreadable, continue with existing env
}

async function main() {
  // 1. Build the lexical index (document loading + chunking)
  await buildKnowledgeIndex({ ensurePdfFiles: true, force: true });
  console.log('Lexical RAG index build complete.');

  // 2. Optionally build vector index if embedding is configured
  const embeddingModel = process.env.EMBEDDING_MODEL;
  const embeddingBaseUrl = process.env.EMBEDDING_BASE_URL;
  const embeddingDimensions = parseInt(process.env.EMBEDDING_DIMENSIONS || '0', 10);

  if (embeddingModel && embeddingBaseUrl && embeddingDimensions) {
    console.log(`Building vector index with model=${embeddingModel}, dim=${embeddingDimensions}...`);
    const { getEmbeddingClient } = await import('@/lib/rag/embedding/client');
    const { buildVectorIndex } = await import('@/lib/rag/indexer');

    // Initialize the embedding client with config before building the index
    const embeddingApiKey = process.env.EMBEDDING_API_KEY || '';
    const embeddingBinding = (process.env.EMBEDDING_BINDING || 'openai') as
      'openai' | 'siliconflow' | 'ollama' | 'dashscope' | 'jina' | 'cohere' | 'custom';
    getEmbeddingClient({
      model: embeddingModel,
      apiKey: embeddingApiKey,
      baseUrl: embeddingBaseUrl,
      binding: embeddingBinding,
      dimensions: embeddingDimensions,
      batchSize: 10,
      batchDelay: 0.2,
      requestTimeout: 60,
    });

    const result = await buildVectorIndex({
      model: embeddingModel,
      baseUrl: embeddingBaseUrl,
      dimensions: embeddingDimensions,
      force: true,
      ensurePdfFiles: false,
    });
    console.log(`Vector index built: signature=${result.signature}, chunks=${result.chunkCount}`);
  } else {
    console.log('Skipping vector index (EMBEDDING_MODEL/BASE_URL/DIMENSIONS not set).');
    console.log('Set EMBEDDING_MODEL, EMBEDDING_BASE_URL, and EMBEDDING_DIMENSIONS in .env.local to enable vector search.');
  }

  console.log('RAG index build complete.');
}

main().catch((error) => {
  console.error('Failed to build RAG index:', error);
  process.exitCode = 1;
});
