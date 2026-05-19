import { buildKnowledgeIndex } from './retriever';

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
    const { buildVectorIndex } = await import('@/lib/rag/indexer');
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
