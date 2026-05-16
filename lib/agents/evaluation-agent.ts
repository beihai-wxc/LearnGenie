import type { StudentProfileDimensions } from '@/lib/types/student-profile';
import type { AgentStageResultEnvelope, EvaluationAgentData, EvaluationAgentInput } from './types';

export function runEvaluationAgent(input: {
  currentProfile: StudentProfileDimensions;
  evaluation: EvaluationAgentInput;
}): AgentStageResultEnvelope<EvaluationAgentData> {
  const updates: Partial<StudentProfileDimensions> = {};
  const recommendedActions: string[] = [];
  const weakTopics: string[] = [];
  let masteryEstimate = 60;

  if (input.evaluation.selfReportedUnderstanding === 'low') {
    masteryEstimate = 38;
    weakTopics.push('建议回到上一阶段继续补强核心概念');
    recommendedActions.push('重新学习基础讲解与思维导图');
  } else if (input.evaluation.selfReportedUnderstanding === 'medium') {
    masteryEstimate = 63;
    recommendedActions.push('补练习题并继续做一轮代码实操');
  } else if (input.evaluation.selfReportedUnderstanding === 'high') {
    masteryEstimate = 82;
    recommendedActions.push('可以切换到更进阶的实践项目');
  }

  if (input.evaluation.completedQuiz) {
    masteryEstimate += 6;
  }
  if (input.evaluation.viewedResourceTypes?.includes('code-lab')) {
    recommendedActions.push('继续保持代码实践节奏');
  }

  if (input.evaluation.freeformFeedback?.includes('还是不懂')) {
    weakTopics.push('当前主题仍需要更细的拆解');
    updates.learningPace = {
      ...input.currentProfile.learningPace,
      score: Math.max(input.currentProfile.learningPace.score, 72),
      description: '根据学习反馈，后续建议放慢节奏、增加分步讲解。',
      paceLevel: 'slow',
      updatedAt: Date.now(),
    };
  }

  return {
    success: true,
    stage: 'evaluation',
    confidence: 0.7,
    warnings: weakTopics.length > 0 ? ['已根据学习反馈下调下一轮推荐节奏。'] : [],
    sources: [],
    nextAction: 'collect_feedback',
    data: {
      masteryEstimate: Math.max(0, Math.min(100, masteryEstimate)),
      weakTopics,
      recommendedActions: [...new Set(recommendedActions)],
      profileUpdates: updates,
    },
  };
}
