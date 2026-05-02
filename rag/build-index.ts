import { buildKnowledgeIndex } from './retriever';

async function main() {
  await buildKnowledgeIndex({ ensurePdfFiles: true, force: true });
  console.log('RAG index build complete.');
}

main().catch((error) => {
  console.error('Failed to build RAG index:', error);
  process.exitCode = 1;
});
