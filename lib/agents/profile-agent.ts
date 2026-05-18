import type { KnowledgeSearchProfileContext } from '@/lib/knowledge-base/types';
import {
  createDefaultProfileDimensions,
  mergeProfileDimensions,
  type StudentProfileDimensions,
} from '@/lib/types/student-profile';
import type { AgentStageResultEnvelope, LearnerProfileSnapshot } from './types';

function normalize(input: string) {
  return input.toLowerCase();
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function inferProfileUpdates(text: string): Partial<StudentProfileDimensions> {
  const normalized = normalize(text);
  const now = Date.now();
  const updates: Partial<StudentProfileDimensions> = {};

  if (
    includesAny(normalized, ['零基础', '初学', '入门', '新手', 'beginner', 'from scratch']) &&
    !includesAny(normalized, ['进阶', '高级', '深入'])
  ) {
    updates.knowledgeFoundation = {
      score: 30,
      description: '从对话中判断当前更需要基础讲解与循序渐进的内容。',
      keywords: ['基础', '入门'],
      updatedAt: now,
    };
  } else if (includesAny(normalized, ['进阶', '高级', '深入', '研究', 'advanced'])) {
    updates.knowledgeFoundation = {
      score: 78,
      description: '从对话中判断已经具备一定基础，更适合进阶或深度内容。',
      keywords: ['进阶', '高级'],
      updatedAt: now,
    };
  }

  if (includesAny(normalized, ['图', '流程图', '思维导图', '可视化', 'visual'])) {
    updates.cognitiveStyle = {
      score: 70,
      description: '更偏好图示化、可视化的信息组织方式。',
      style: 'visual',
      keywords: ['图示', '可视化'],
      updatedAt: now,
    };
  } else if (includesAny(normalized, ['推导', '分析', '原理', '逻辑'])) {
    updates.cognitiveStyle = {
      score: 68,
      description: '更偏好分析型、原理型的讲解方式。',
      style: 'analytical',
      keywords: ['推导', '分析'],
      updatedAt: now,
    };
  }

  if (includesAny(normalized, ['代码', '实战', '项目', '动手', '实践'])) {
    updates.interactionPreference = {
      score: 80,
      description: '偏好结合代码与实践案例学习。',
      preference: 'with-code',
      updatedAt: now,
    };
    updates.interestDirection = {
      score: 70,
      description: '偏好把知识尽快迁移到实操场景。',
      areas: ['实战应用', '项目实践'],
      updatedAt: now,
    };
  } else if (includesAny(normalized, ['例子', '举例', '案例'])) {
    updates.interactionPreference = {
      score: 70,
      description: '偏好通过例子和案例理解抽象概念。',
      preference: 'with-example',
      updatedAt: now,
    };
  } else if (includesAny(normalized, ['详细', '展开', '全面', '系统'])) {
    updates.interactionPreference = {
      score: 66,
      description: '偏好更完整、详细的说明方式。',
      preference: 'detailed',
      updatedAt: now,
    };
  } else if (includesAny(normalized, ['简短', '快速', '速通', 'brief'])) {
    updates.interactionPreference = {
      score: 62,
      description: '偏好简洁快速的说明方式。',
      preference: 'brief',
      updatedAt: now,
    };
  }

  if (includesAny(normalized, ['学得慢', '慢一点', '别太快', '一步一步'])) {
    updates.learningPace = {
      score: 72,
      description: '更适合循序渐进的学习节奏。',
      paceLevel: 'slow',
      updatedAt: now,
    };
  } else if (includesAny(normalized, ['快一点', '快速', '直接重点', '高效'])) {
    updates.learningPace = {
      score: 70,
      description: '更适合较快推进和重点导向的学习节奏。',
      paceLevel: 'fast',
      updatedAt: now,
    };
  }

  if (includesAny(normalized, ['考试', '刷题', '做题'])) {
    updates.metaCognitiveStrategy = {
      score: 64,
      description: '学习目标更接近应试与练习反馈驱动。',
      strategy: 'self-checking',
      updatedAt: now,
    };
  } else if (includesAny(normalized, ['自己探索', '自学', '探索'])) {
    updates.metaCognitiveStrategy = {
      score: 65,
      description: '倾向自主探索式学习。',
      strategy: 'independent-exploration',
      updatedAt: now,
    };
  }

  if (includesAny(normalized, ['兴趣', '好奇', '喜欢', '想了解'])) {
    updates.emotionalMotivation = {
      score: 60,
      description: '更偏向内在兴趣驱动。',
      motivation: 'intrinsic',
      updatedAt: now,
    };
  } else if (includesAny(normalized, ['作业', '考核', '面试', '比赛'])) {
    updates.emotionalMotivation = {
      score: 67,
      description: '当前学习更偏向外部目标驱动。',
      motivation: 'achievement',
      updatedAt: now,
    };
  }

  const weakPatterns = ['激活函数', '反向传播', '梯度下降', 'loss', 'transformer', 'rag', 'agent']
    .filter((term) => normalized.includes(term.toLowerCase()) || text.includes(term));
  if (weakPatterns.length > 0) {
    updates.errorPronePatterns = {
      score: 58,
      description: '对话中出现了需要重点补强的知识主题。',
      patterns: weakPatterns,
      updatedAt: now,
    };
  }

  const interests = ['人工智能', '机器学习', '深度学习', '大模型', 'RAG', 'Agent', '计算机视觉', '自然语言处理']
    .filter((term) => normalized.includes(term.toLowerCase()) || text.includes(term));
  if (interests.length > 0) {
    updates.interestDirection = {
      score: 65,
      description: '已从对话中识别出当前学习主题方向。',
      areas: interests,
      updatedAt: now,
    };
  }

  return updates;
}

export function summarizeProfile(dimensions: StudentProfileDimensions): string[] {
  const summary: string[] = [];
  if (dimensions.knowledgeFoundation.score > 0) {
    summary.push(
      dimensions.knowledgeFoundation.score < 45 ? '当前更适合基础讲解' : '可以接受更进阶内容',
    );
  }
  if (dimensions.cognitiveStyle.style !== 'unknown') {
    summary.push(`认知风格：${dimensions.cognitiveStyle.style}`);
  }
  if (dimensions.interactionPreference.preference !== 'unknown') {
    summary.push(`内容偏好：${dimensions.interactionPreference.preference}`);
  }
  if (dimensions.learningPace.paceLevel !== 'unknown') {
    summary.push(`学习节奏：${dimensions.learningPace.paceLevel}`);
  }
  if (dimensions.errorPronePatterns.patterns.length > 0) {
    summary.push(`当前薄弱点：${dimensions.errorPronePatterns.patterns.slice(0, 2).join('、')}`);
  }
  return summary;
}

export function buildLearnerProfileFromDialogue(input: {
  query: string;
  existingProfile?: StudentProfileDimensions;
  nickname?: string;
  bio?: string;
}): AgentStageResultEnvelope<LearnerProfileSnapshot> {
  const baseProfile = input.existingProfile ?? createDefaultProfileDimensions();
  const inferred = inferProfileUpdates([input.query, input.bio].filter(Boolean).join('\n'));
  const merged = mergeProfileDimensions(baseProfile, inferred);
  const inferredFromDialogue = Object.keys(inferred) as Array<keyof StudentProfileDimensions>;

  return {
    success: true,
    stage: 'profile',
    confidence: inferredFromDialogue.length > 0 ? 0.82 : 0.45,
    warnings:
      inferredFromDialogue.length > 0
        ? []
        : ['当前对话中可提取的画像信号较少，后续推荐将以通用学习路径为主。'],
    sources: [],
    nextAction: 'show_recommendations',
    data: {
      nickname: input.nickname,
      bio: input.bio,
      dimensions: merged,
      inferredFromDialogue,
      summaryLines: summarizeProfile(merged),
    },
  };
}

export function toKnowledgeProfileContext(
  snapshot: LearnerProfileSnapshot,
): KnowledgeSearchProfileContext {
  return {
    nickname: snapshot.nickname,
    bio: snapshot.bio,
    learningProfile: snapshot.dimensions,
  };
}
