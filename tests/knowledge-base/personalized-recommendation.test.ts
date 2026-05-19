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
  KNOWLEDGE_COURSE_STRUCTURE_FILE,
  KNOWLEDGE_KNOWLEDGE_FILE,
  KNOWLEDGE_RAG_ROOT,
  KNOWLEDGE_UPLOADS_FILE,
} from '@/lib/knowledge-base/constants';
import {
  resetKnowledgeCache,
  searchKnowledgeBase,
} from '@/lib/knowledge-base/service';
import type {
  KnowledgeCourseStructure,
  KnowledgeDocument,
  KnowledgeSearchProfileContext,
} from '@/lib/knowledge-base/types';
import { createDefaultProfileDimensions } from '@/lib/types/student-profile';

const seededDocs: KnowledgeDocument[] = [
  {
    docId: 'core-deep-learning-foundations',
    title: '深度学习与神经网络基础',
    course: '人工智能课程',
    module: '核心知识',
    summary: '介绍神经网络基础、激活函数和反向传播。',
    keywords: ['深度学习', '神经网络', '训练'],
    conceptTerms: ['激活函数', '反向传播', '神经网络基础'],
    chapterId: 'chapter-foundation',
    chapterTitle: '基础章节',
    learningStage: 'foundation',
    prerequisites: [],
    resourceTypes: ['lecture', 'mindmap', 'quiz', 'reading'],
    estimatedStudyTimeMinutes: 45,
    content: '神经网络基础包括前向传播、损失函数、反向传播与激活函数，是进入训练实践前需要掌握的关键原理。',
    pdfPath: 'core-deep-learning-foundations.pdf',
    sourceType: 'seed',
    sourceLabel: '核心知识',
    difficulty: 'beginner',
    recommendedTeachingGoals: ['理解神经网络训练基础'],
    references: ['内部结构化教学整理'],
    createdAt: '2026-05-08T00:00:00.000Z',
    updatedAt: '2026-05-08T00:00:00.000Z',
  },
  {
    docId: 'practice-pytorch-workflow',
    title: 'PyTorch 实战工作流入门',
    course: '人工智能课程',
    module: '实战专题',
    summary: '介绍用 PyTorch 完成神经网络训练、调试和实验复现。',
    keywords: ['PyTorch', '训练循环', '代码实战'],
    conceptTerms: ['神经网络训练', '训练循环', '反向传播'],
    chapterId: 'chapter-practice',
    chapterTitle: '实践章节',
    learningStage: 'practice',
    prerequisites: ['core-deep-learning-foundations'],
    resourceTypes: ['lecture', 'code-lab', 'project', 'reading'],
    estimatedStudyTimeMinutes: 60,
    content: '通过 PyTorch 编写训练循环、优化器和验证流程，可以把神经网络训练真正落到代码实战。',
    pdfPath: 'practice-pytorch-workflow.pdf',
    sourceType: 'seed',
    sourceLabel: '实战专题',
    difficulty: 'intermediate',
    recommendedTeachingGoals: ['掌握训练代码实战流程'],
    references: ['内部实战整理'],
    createdAt: '2026-05-08T00:00:00.000Z',
    updatedAt: '2026-05-08T00:00:00.000Z',
  },
];

const courseStructure: KnowledgeCourseStructure = {
  courseId: 'test-course',
  title: '测试课程',
  description: '用于验证画像驱动推荐。',
  chapters: [
    {
      chapterId: 'chapter-foundation',
      title: '基础章节',
      summary: '基础知识',
      order: 1,
      learningStage: 'foundation',
      docIds: ['core-deep-learning-foundations'],
    },
    {
      chapterId: 'chapter-practice',
      title: '实践章节',
      summary: '实践知识',
      order: 2,
      learningStage: 'practice',
      prerequisiteChapterIds: ['chapter-foundation'],
      docIds: ['practice-pytorch-workflow'],
    },
  ],
  documentBindings: seededDocs.map((doc) => ({
    docId: doc.docId,
    chapterId: doc.chapterId!,
    chapterTitle: doc.chapterTitle!,
    learningStage: doc.learningStage!,
    prerequisites: doc.prerequisites,
    resourceTypes: doc.resourceTypes!,
    estimatedStudyTimeMinutes: doc.estimatedStudyTimeMinutes!,
  })),
};

let originalKnowledgeBaseFile: string | null = null;
let originalUploadsFile: string | null = null;
let originalCourseStructureFile: string | null = null;

async function writeStores() {
  await fs.mkdir(KNOWLEDGE_RAG_ROOT, { recursive: true });
  await fs.writeFile(KNOWLEDGE_KNOWLEDGE_FILE, JSON.stringify(seededDocs, null, 2), 'utf8');
  await fs.writeFile(KNOWLEDGE_UPLOADS_FILE, '[]\n', 'utf8');
  await fs.writeFile(KNOWLEDGE_COURSE_STRUCTURE_FILE, JSON.stringify(courseStructure, null, 2), 'utf8');
}

async function restoreStores() {
  if (originalKnowledgeBaseFile !== null) {
    await fs.writeFile(KNOWLEDGE_KNOWLEDGE_FILE, originalKnowledgeBaseFile, 'utf8');
  }
  if (originalUploadsFile !== null) {
    await fs.writeFile(KNOWLEDGE_UPLOADS_FILE, originalUploadsFile, 'utf8');
  }
  if (originalCourseStructureFile !== null) {
    await fs.writeFile(KNOWLEDGE_COURSE_STRUCTURE_FILE, originalCourseStructureFile, 'utf8');
  }
}

describe.sequential('knowledge personalization', () => {
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
    await writeStores();
    await resetKnowledgeCache();
  });

  afterEach(async () => {
    await resetKnowledgeCache();
    await restoreStores();
  });

  it('boosts practice resources for learners who want code-heavy fast-paced content', async () => {
    const learningProfile = createDefaultProfileDimensions();
    learningProfile.learningPace = {
      ...learningProfile.learningPace,
      score: 80,
      paceLevel: 'fast',
      description: '喜欢快速推进',
    };
    learningProfile.interactionPreference = {
      ...learningProfile.interactionPreference,
      score: 90,
      preference: 'with-code',
      description: '偏好带代码讲解',
    };

    const profileContext: KnowledgeSearchProfileContext = { learningProfile };
    const baseline = await searchKnowledgeBase('我想学习神经网络训练', 5);
    const response = await searchKnowledgeBase('我想学习神经网络训练', 5, profileContext);
    const baselinePractice = baseline.results.find((item) => item.docId === 'practice-pytorch-workflow');
    const personalizedPractice = response.results.find(
      (item) => item.docId === 'practice-pytorch-workflow',
    );

    expect(personalizedPractice?.score).toBeGreaterThan(baselinePractice?.score ?? 0);
    expect(personalizedPractice?.personalizationReasons).toContain('符合带代码学习偏好');
    expect(personalizedPractice?.personalizationReasons).toContain('匹配较快学习节奏，优先实践型内容');
    expect(response.recommendedPath?.steps[0]?.chapterTitle).toBe('基础章节');
  });

  it('prefers foundation resources for learners with weaker knowledge base', async () => {
    const learningProfile = createDefaultProfileDimensions();
    learningProfile.knowledgeFoundation = {
      ...learningProfile.knowledgeFoundation,
      score: 20,
      description: '基础偏弱',
      keywords: ['神经网络基础'],
    };
    learningProfile.learningPace = {
      ...learningProfile.learningPace,
      score: 70,
      paceLevel: 'slow',
      description: '希望循序渐进',
    };

    const profileContext: KnowledgeSearchProfileContext = { learningProfile };
    const response = await searchKnowledgeBase('我想学习神经网络训练', 5, profileContext);

    expect(response.results[0]?.docId).toBe('core-deep-learning-foundations');
    expect(response.results[0]?.personalizationReasons).toContain('匹配当前知识基础，优先基础内容');
    expect(response.recommendedPath?.steps[0]?.chapterTitle).toBe('基础章节');
  });
});
