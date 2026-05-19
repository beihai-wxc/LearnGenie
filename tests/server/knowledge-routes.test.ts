import fs from 'node:fs/promises';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import {
  KNOWLEDGE_COURSE_STRUCTURE_FILE,
  KNOWLEDGE_KNOWLEDGE_FILE,
  KNOWLEDGE_RAG_ROOT,
  KNOWLEDGE_UPLOADS_FILE,
} from '@/lib/knowledge-base/constants';
import { resetKnowledgeCache } from '@/lib/knowledge-base/service';
import type { KnowledgeCourseStructure, KnowledgeDocument } from '@/lib/knowledge-base/types';

const seededDocs: KnowledgeDocument[] = [
  {
    docId: 'capability-agent-systems',
    title: 'Agent 智能体系统与工作流',
    course: '人工智能课程',
    module: '重点能力',
    summary: '解释 Agent、工具调用、计划和状态管理。',
    keywords: ['Agent', '智能体', '工具调用', '计划'],
    content: 'Agent 系统会围绕目标、状态、工具调用和记忆来推进任务。',
    pdfPath: 'capability-agent-systems.pdf',
    sourceType: 'seed',
    sourceLabel: '核心知识',
    difficulty: 'intermediate',
    chapterId: 'chapter-agent',
    chapterTitle: 'Agent 章节',
    learningStage: 'core',
    resourceTypes: ['lecture', 'project', 'reading', 'mindmap'],
    estimatedStudyTimeMinutes: 45,
    recommendedTeachingGoals: ['理解 Agent 系统组成'],
    references: ['内部结构化教学整理'],
    createdAt: '2026-05-08T00:00:00.000Z',
    updatedAt: '2026-05-08T00:00:00.000Z',
  },
];

const courseStructure: KnowledgeCourseStructure = {
  courseId: 'route-test-course',
  title: 'Route Test Course',
  description: 'Used for route tests',
  chapters: [
    {
      chapterId: 'chapter-agent',
      title: 'Agent 章节',
      summary: 'Agent 相关章节',
      order: 1,
      learningStage: 'core',
      docIds: ['capability-agent-systems'],
    },
  ],
  documentBindings: [
    {
      docId: 'capability-agent-systems',
      chapterId: 'chapter-agent',
      chapterTitle: 'Agent 章节',
      learningStage: 'core',
      prerequisites: [],
      resourceTypes: ['lecture', 'project', 'reading', 'mindmap'],
      estimatedStudyTimeMinutes: 45,
    },
  ],
};

let originalKnowledgeBaseFile: string | null = null;
let originalUploadsFile: string | null = null;
let originalCourseStructureFile: string | null = null;

async function writeStores(seeds: KnowledgeDocument[], uploads: KnowledgeDocument[] = []) {
  await fs.mkdir(KNOWLEDGE_RAG_ROOT, { recursive: true });
  await fs.writeFile(KNOWLEDGE_KNOWLEDGE_FILE, JSON.stringify(seeds, null, 2), 'utf8');
  await fs.writeFile(KNOWLEDGE_UPLOADS_FILE, JSON.stringify(uploads, null, 2), 'utf8');
  await fs.writeFile(KNOWLEDGE_COURSE_STRUCTURE_FILE, JSON.stringify(courseStructure, null, 2), 'utf8');
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
  if (originalCourseStructureFile !== null) {
    await fs.mkdir(KNOWLEDGE_RAG_ROOT, { recursive: true });
    await fs.writeFile(KNOWLEDGE_COURSE_STRUCTURE_FILE, originalCourseStructureFile, 'utf8');
  } else {
    await fs.rm(KNOWLEDGE_COURSE_STRUCTURE_FILE, { force: true });
  }
}

describe.sequential('knowledge api routes', () => {
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
    try {
      originalCourseStructureFile = await fs.readFile(KNOWLEDGE_COURSE_STRUCTURE_FILE, 'utf8');
    } catch {
      originalCourseStructureFile = null;
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

  it('returns structured search results from the search route', async () => {
    const { POST } = await import('@/app/api/knowledge/search/route');
    const req = new Request('http://localhost/api/knowledge/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '什么是 Agent' }),
    });

    const res = await POST(req as never);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.results?.[0]?.docId).toBe('capability-agent-systems');
    expect(json.results?.[0]?.sourceLabel).toBe('核心知识');
  });

  it('returns detailed document metadata with recommendation', async () => {
    const { GET } = await import('@/app/api/knowledge/document/[docId]/meta/route');
    const req = new NextRequest(
      'http://localhost/api/knowledge/document/capability-agent-systems/meta?query=Agent',
    );

    const res = await GET(req as never, {
      params: Promise.resolve({ docId: 'capability-agent-systems' }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.document.sourceLabel).toBe('核心知识');
    expect(json.document.recommendedTeachingGoals).toContain('理解 Agent 系统组成');
    expect(json.document.learningStage).toBe('core');
    expect(json.document.chapterTitle).toBeTruthy();
    expect(json.document.recommendedRequirement).toContain('Agent');
  });

  it('returns a pdf response for a known knowledge document', async () => {
    const { GET } = await import('@/app/api/knowledge/document/[docId]/route');
    const req = new Request('http://localhost/api/knowledge/document/capability-agent-systems');

    const res = await GET(req as never, {
      params: Promise.resolve({ docId: 'capability-agent-systems' }),
    });
    const bytes = await res.arrayBuffer();

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/pdf');
    expect(bytes.byteLength).toBeGreaterThan(0);
  });
});
