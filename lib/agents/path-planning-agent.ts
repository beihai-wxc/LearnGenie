import type { AgentStageResultEnvelope, PathPlanningAgentData } from './types';
import type { RetrievalAgentData } from './types';

export function runPathPlanningAgent(
  retrieval: RetrievalAgentData,
): AgentStageResultEnvelope<PathPlanningAgentData> {
  const bestMatch = retrieval.bestMatch;
  const hasPath = !!retrieval.recommendedPath;
  const summary = hasPath
    ? retrieval.recommendedPath!.summary
    : bestMatch
      ? `已根据《${bestMatch.title}》为当前主题选择最合适的切入点，建议先看讲解文档，再补练习和扩展阅读。`
      : '当前未命中足够强的课程知识，建议先按主题生成基础课堂，再继续补充需求细节。';

  return {
    success: true,
    stage: 'planning',
    confidence: hasPath ? 0.84 : bestMatch ? 0.62 : 0.38,
    warnings: hasPath ? [] : ['当前学习路径为轻量规划，后续可根据学习反馈继续细化。'],
    sources: bestMatch
      ? [
          {
            docId: bestMatch.docId,
            title: bestMatch.title,
            excerpt: bestMatch.summary,
          },
        ]
      : [],
    nextAction: bestMatch ? 'show_recommendations' : 'generate_classroom',
    data: {
      title: hasPath
        ? retrieval.recommendedPath!.title
        : bestMatch
          ? `推荐学习起点：${bestMatch.title}`
          : '建议先生成基础课堂',
      summary,
      nextActionLabel: bestMatch ? '先看命中资料，再生成课堂' : '直接生成基础课堂',
      recommendedPath: retrieval.recommendedPath,
    },
  };
}

