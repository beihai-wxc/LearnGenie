import fs from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  KNOWLEDGE_CHUNK_OVERLAP,
  KNOWLEDGE_CHUNK_SIZE,
  KNOWLEDGE_INDEX_DIR,
  KNOWLEDGE_INDEX_FILE,
  KNOWLEDGE_KNOWLEDGE_FILE,
  KNOWLEDGE_METADATA_FILE,
  KNOWLEDGE_PDF_DIR,
  KNOWLEDGE_RAG_ROOT,
  KNOWLEDGE_UPLOADS_FILE,
} from '@/lib/knowledge-base/constants';
import type { KnowledgeDocument } from '@/lib/knowledge-base/types';
import {
  buildKnowledgeIndex,
  ensureKnowledgeAssetsForTests,
  getKnowledgeDocumentMap,
  getKnowledgeDocumentsFromStore,
  resetRetrieverCache,
} from '@/rag/retriever';

const seedDoc: KnowledgeDocument = {
  docId: 'core-ai-overview',
  title: 'Core AI Overview',
  course: 'Artificial Intelligence',
  module: 'Foundations',
  summary: 'Introduces the main branches of AI and how they connect.',
  keywords: ['ai', 'machine learning', 'knowledge systems'],
  content: `Artificial intelligence is a broad field that connects reasoning, learning, search, and perception.

Machine learning helps systems improve from data, while knowledge-based approaches encode expert rules and representations.

Modern AI products often combine planning, retrieval, generation, and evaluation so that systems can respond with grounded answers.

The goal of this overview is to give beginners a map of the space before they dive into specialized topics such as computer vision, language models, or robotics.`,
  pdfPath: 'core-ai-overview.pdf',
  sourceType: 'seed',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const uploadDoc: KnowledgeDocument = {
  docId: 'upload-ai-notes',
  title: 'Upload AI Notes',
  course: 'Artificial Intelligence',
  module: 'Uploads',
  summary: 'User-supplied notes about retrieval systems.',
  keywords: ['retrieval', 'rag', 'search'],
  content:
    'Retrieval augmented generation connects user questions to relevant document chunks before answer generation.',
  pdfPath: 'upload-ai-notes.pdf',
  sourceType: 'upload',
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

async function removeKnowledgeAssets() {
  await fs.rm(KNOWLEDGE_KNOWLEDGE_FILE, { force: true });
  await fs.rm(KNOWLEDGE_UPLOADS_FILE, { force: true });
  await fs.rm(KNOWLEDGE_INDEX_DIR, { recursive: true, force: true });
  await fs.rm(KNOWLEDGE_PDF_DIR, { recursive: true, force: true });
  try {
    await fs.rmdir(KNOWLEDGE_RAG_ROOT);
  } catch {
    // The retriever source file may still live here, which is expected.
  }
}

async function seedStore({
  seeds = [seedDoc],
  uploads = [uploadDoc],
}: {
  seeds?: KnowledgeDocument[];
  uploads?: KnowledgeDocument[];
} = {}) {
  await fs.mkdir(KNOWLEDGE_RAG_ROOT, { recursive: true });
  await fs.writeFile(KNOWLEDGE_KNOWLEDGE_FILE, JSON.stringify(seeds, null, 2), 'utf8');
  await fs.writeFile(KNOWLEDGE_UPLOADS_FILE, JSON.stringify(uploads, null, 2), 'utf8');
}

function expectedChunkCount(text: string) {
  if (!text.trim()) return 0;
  if (text.length <= KNOWLEDGE_CHUNK_SIZE) return 1;

  let count = 0;
  let start = 0;
  while (start < text.length) {
    count += 1;
    const end = start + KNOWLEDGE_CHUNK_SIZE;
    if (end >= text.length) break;
    start = Math.max(end - KNOWLEDGE_CHUNK_OVERLAP, start + 1);
  }
  return count;
}

describe('knowledge retriever bootstrap and indexing', () => {
  beforeEach(async () => {
    resetRetrieverCache();
    await removeKnowledgeAssets();
  });

  afterEach(async () => {
    resetRetrieverCache();
    await removeKnowledgeAssets();
  });

  it('recreates missing rag assets for local tests', async () => {
    await ensureKnowledgeAssetsForTests();

    await expect(fs.readFile(KNOWLEDGE_KNOWLEDGE_FILE, 'utf8')).resolves.toBe('[]\n');
    await expect(fs.readFile(KNOWLEDGE_UPLOADS_FILE, 'utf8')).resolves.toBe('[]\n');
    await expect(fs.readFile(path.join(KNOWLEDGE_INDEX_DIR, '.gitkeep'), 'utf8')).resolves.toBe('');
    await expect(fs.readFile(path.join(KNOWLEDGE_PDF_DIR, '.gitkeep'), 'utf8')).resolves.toBe('');

    await expect(fs.stat(KNOWLEDGE_INDEX_DIR)).resolves.toMatchObject({ isDirectory: expect.any(Function) });
    await expect(fs.stat(KNOWLEDGE_PDF_DIR)).resolves.toMatchObject({ isDirectory: expect.any(Function) });
  });

  it('builds an index from seeded and uploaded docs while keeping stores separate', async () => {
    await seedStore({
      seeds: [seedDoc],
      uploads: [uploadDoc],
    });

    const index = await buildKnowledgeIndex({ ensurePdfFiles: true, force: true });
    const storedDocs = await getKnowledgeDocumentsFromStore();
    const documentMap = await getKnowledgeDocumentMap();
    const metadata = JSON.parse(await fs.readFile(KNOWLEDGE_METADATA_FILE, 'utf8'));
    const diskIndex = JSON.parse(await fs.readFile(KNOWLEDGE_INDEX_FILE, 'utf8'));

    expect(storedDocs).toHaveLength(2);
    expect(storedDocs.map((doc) => doc.docId)).toEqual(['core-ai-overview', 'upload-ai-notes']);
    expect(documentMap.get('core-ai-overview')?.sourceType).toBe('seed');
    expect(documentMap.get('upload-ai-notes')?.sourceType).toBe('upload');

    expect(index.documents).toHaveLength(2);
    expect(index.documents[0]?.docId).toBe('core-ai-overview');
    expect(index.chunks.length).toBe(
      expectedChunkCount(seedDoc.content) + expectedChunkCount(uploadDoc.content),
    );
    expect(index.chunks.every((chunk) => chunk.text.length <= KNOWLEDGE_CHUNK_SIZE)).toBe(true);
    expect(index.chunks.every((chunk) => chunk.tokenSet.length > 0)).toBe(true);

    expect(metadata.documentCount).toBe(2);
    expect(metadata.chunkCount).toBe(index.chunks.length);
    expect(metadata.seedDocumentCount).toBe(1);
    expect(metadata.uploadDocumentCount).toBe(1);

    expect(diskIndex.documents.map((doc: KnowledgeDocument) => doc.docId)).toEqual([
      'core-ai-overview',
      'upload-ai-notes',
    ]);

    await expect(fs.stat(path.join(KNOWLEDGE_PDF_DIR, seedDoc.pdfPath))).resolves.toBeTruthy();
    await expect(fs.stat(path.join(KNOWLEDGE_PDF_DIR, uploadDoc.pdfPath))).resolves.toBeTruthy();

    const seedStoreOnDisk = JSON.parse(await fs.readFile(KNOWLEDGE_KNOWLEDGE_FILE, 'utf8'));
    const uploadStoreOnDisk = JSON.parse(await fs.readFile(KNOWLEDGE_UPLOADS_FILE, 'utf8'));
    expect(seedStoreOnDisk).toEqual([expect.objectContaining({ docId: 'core-ai-overview' })]);
    expect(uploadStoreOnDisk).toEqual([expect.objectContaining({ docId: 'upload-ai-notes' })]);
  });
});
