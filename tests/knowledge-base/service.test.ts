import fs from 'node:fs/promises';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import {
  KNOWLEDGE_KNOWLEDGE_FILE,
  KNOWLEDGE_RAG_ROOT,
  KNOWLEDGE_UPLOADS_FILE,
} from '@/lib/knowledge-base/constants';
import {
  buildRecommendedRequirement,
  ingestUploadedKnowledge,
  matchUploadedKnowledge,
  resetKnowledgeCache,
  searchKnowledgeBase,
} from '@/lib/knowledge-base/service';
import type { KnowledgeDocument } from '@/lib/knowledge-base/types';

const seededDocs: KnowledgeDocument[] = [
  {
    docId: 'core-ai-overview',
    title: '人工智能全景导论',
    course: '人工智能课程',
    module: '核心知识',
    summary: '系统介绍人工智能的主要分支、应用和学习路线。',
    keywords: ['人工智能', '机器学习', '深度学习', '智能体'],
    content: '人工智能课程会覆盖机器学习、深度学习、检索增强生成和智能体系统。',
    pdfPath: 'core-ai-overview.pdf',
    sourceType: 'seed',
    sourceLabel: '核心知识',
    difficulty: 'beginner',
    recommendedTeachingGoals: ['建立 AI 全景认知'],
    references: ['内部结构化教学整理'],
    createdAt: '2026-05-08T00:00:00.000Z',
    updatedAt: '2026-05-08T00:00:00.000Z',
  },
  {
    docId: 'capability-rag-systems',
    title: 'RAG 检索增强生成系统设计',
    course: '人工智能课程',
    module: '重点能力',
    summary: '介绍 RAG 的切块、召回、重排和生成链路。',
    keywords: ['RAG', '检索增强生成', '知识库', '召回', '重排'],
    content:
      'RAG 系统会先检索知识库，再把相关片段注入提示词，从而降低大模型幻觉并提升答案可溯源性。',
    pdfPath: 'capability-rag-systems.pdf',
    sourceType: 'seed',
    sourceLabel: '核心知识',
    difficulty: 'intermediate',
    recommendedTeachingGoals: ['理解 RAG 完整链路'],
    references: ['公开技术资料摘要'],
    createdAt: '2026-05-08T00:00:00.000Z',
    updatedAt: '2026-05-08T00:00:00.000Z',
  },
];

let originalKnowledgeBaseFile: string | null = null;
let originalUploadsFile: string | null = null;

async function writeStores(seeds: KnowledgeDocument[], uploads: KnowledgeDocument[] = []) {
  await fs.mkdir(KNOWLEDGE_RAG_ROOT, { recursive: true });
  await fs.writeFile(KNOWLEDGE_KNOWLEDGE_FILE, JSON.stringify(seeds, null, 2), 'utf8');
  await fs.writeFile(KNOWLEDGE_UPLOADS_FILE, JSON.stringify(uploads, null, 2), 'utf8');
}

async function restoreStores() {
  if (originalKnowledgeBaseFile !== null) {
    await fs.mkdir(KNOWLEDGE_RAG_ROOT, { recursive: true });
    await fs.writeFile(KNOWLEDGE_KNOWLEDGE_FILE, originalKnowledgeBaseFile, 'utf8');
  } else {
    await fs.rm(KNOWLEDGE_KNOWLEDGE_FILE, { force: true });
  }
  if (originalUploadsFile !== null) {
    await fs.mkdir(KNOWLEDGE_RAG_ROOT, { recursive: true });
    await fs.writeFile(KNOWLEDGE_UPLOADS_FILE, originalUploadsFile, 'utf8');
  } else {
    await fs.rm(KNOWLEDGE_UPLOADS_FILE, { force: true });
  }
}

describe.sequential('knowledge-base service', () => {
  beforeAll(async () => {
    try {
      originalKnowledgeBaseFile = await fs.readFile(KNOWLEDGE_KNOWLEDGE_FILE, 'utf8');
    } catch {
      originalKnowledgeBaseFile = null;
    }

    try {
      originalUploadsFile = await fs.readFile(KNOWLEDGE_UPLOADS_FILE, 'utf8');
    } catch {
      originalUploadsFile = null;
    }
  });

  beforeEach(async () => {
    await writeStores(seededDocs, []);
    await resetKnowledgeCache();
  });

  afterEach(async () => {
    await resetKnowledgeCache();
    await restoreStores();
  });

  it('formats search results with labels, goals, and pdf links', async () => {
    const response = await searchKnowledgeBase('什么是 RAG，如何做检索增强生成', 5);

    expect(response.matched).toBe(true);
    expect(response.results[0]?.docId).toBe('capability-rag-systems');
    expect(response.results[0]?.pdfUrl).toBe('/api/knowledge/document/capability-rag-systems');
    expect(response.results[0]?.sourceLabel).toBe('核心知识');
    expect(response.results[0]?.recommendedTeachingGoals).toContain('理解 RAG 完整链路');
  });

  it('builds a stable recommended requirement string', () => {
    const requirement = buildRecommendedRequirement(
      'RAG 会先检索知识，再把片段交给模型。',
      'RAG 学习笔记',
    );

    expect(requirement).toContain('RAG 学习笔记');
    expect(requirement).toContain('生成一节人工智能课程');
  });

  it('returns upload recommendations without blocking fallback generation', async () => {
    const response = await matchUploadedKnowledge(
      '这份资料介绍了 RAG 的切块、召回、重排和引用设计。',
      '我的 RAG 资料',
    );

    expect(response.matched).toBe(true);
    expect(response.results[0]?.docId).toBe('capability-rag-systems');
    expect(response.recommendedRequirement).toContain('我的 RAG 资料');
    expect(response.fallbackAction).toBe('open_pdf');
  });

  it('deduplicates repeated uploaded knowledge ingest', async () => {
    const payload = {
      title: '我的 RAG 实验记录',
      text: 'RAG 通过向量检索找到上下文，再交给生成模型作答。',
    };

    const first = await ingestUploadedKnowledge(payload);
    const second = await ingestUploadedKnowledge(payload);

    expect(second.docId).toBe(first.docId);
    expect(second.sourceLabel).toBe('用户上传');
  });
});
