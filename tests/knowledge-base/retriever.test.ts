import fs from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
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
  searchKnowledgeIndex,
} from '@/rag/retriever';

const seedDoc: KnowledgeDocument = {
  docId: 'core-ai-overview',
  title: '人工智能核心概览',
  course: '人工智能课程',
  module: '基础认知',
  summary: '介绍人工智能的主要分支，以及推理、学习、搜索和感知之间的联系。',
  keywords: ['人工智能', '机器学习', '知识系统', '搜索', '感知'],
  content: `人工智能是一个跨越推理、学习、搜索与感知的综合领域。

机器学习帮助系统从数据中持续改进，知识表示方法则把规则、概念和关系组织成机器可用的结构。

现代人工智能产品常常把检索、生成、规划和评估组合在一起，让回答既贴近需求又有来源依据。

这份概览面向初学者，帮助学习者在继续深入计算机视觉、自然语言处理和机器人之前，先建立清晰的知识地图。`,
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

let originalKnowledgeBaseFile: string | null = null;

async function restoreOriginalKnowledgeBaseFile() {
  if (originalKnowledgeBaseFile === null) return;
  await fs.mkdir(KNOWLEDGE_RAG_ROOT, { recursive: true });
  await fs.writeFile(KNOWLEDGE_KNOWLEDGE_FILE, originalKnowledgeBaseFile, 'utf8');
}

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
  beforeAll(async () => {
    try {
      originalKnowledgeBaseFile = await fs.readFile(KNOWLEDGE_KNOWLEDGE_FILE, 'utf8');
    } catch {
      originalKnowledgeBaseFile = null;
    }
  });

  beforeEach(async () => {
    resetRetrieverCache();
    await removeKnowledgeAssets();
  });

  afterEach(async () => {
    resetRetrieverCache();
    await removeKnowledgeAssets();
    await restoreOriginalKnowledgeBaseFile();
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

  it('fails loudly without rewriting stores when a knowledge file is invalid', async () => {
    await fs.mkdir(KNOWLEDGE_RAG_ROOT, { recursive: true });
    await fs.writeFile(KNOWLEDGE_KNOWLEDGE_FILE, '{"broken": true}', 'utf8');

    await expect(getKnowledgeDocumentsFromStore()).rejects.toThrow(
      `Invalid knowledge store at ${KNOWLEDGE_KNOWLEDGE_FILE}`,
    );
    await expect(fs.readFile(KNOWLEDGE_KNOWLEDGE_FILE, 'utf8')).resolves.toBe('{"broken": true}');
  });

  it('supports Chinese retrieval for built-in seed knowledge', async () => {
    await seedStore({
      seeds: [seedDoc],
      uploads: [],
    });

    await buildKnowledgeIndex({ force: true });
    const results = await searchKnowledgeIndex('什么是人工智能中的知识表示', 3);

    expect(results[0]?.docId).toBe('core-ai-overview');
    expect(results[0]?.sourceType).toBe('seed');
    expect(results[0]?.previewText).toContain('知识表示');
  });

  it('reuses a valid persisted index after cache reset without rewriting it', async () => {
    await seedStore({
      seeds: [seedDoc],
      uploads: [uploadDoc],
    });

    await buildKnowledgeIndex({ force: true });
    const firstIndexRaw = await fs.readFile(KNOWLEDGE_INDEX_FILE, 'utf8');
    const firstMetadataRaw = await fs.readFile(KNOWLEDGE_METADATA_FILE, 'utf8');

    resetRetrieverCache();

    const rebuilt = await buildKnowledgeIndex();
    const secondIndexRaw = await fs.readFile(KNOWLEDGE_INDEX_FILE, 'utf8');
    const secondMetadataRaw = await fs.readFile(KNOWLEDGE_METADATA_FILE, 'utf8');

    expect(rebuilt.documents).toHaveLength(2);
    expect(secondIndexRaw).toBe(firstIndexRaw);
    expect(secondMetadataRaw).toBe(firstMetadataRaw);
  });
});
