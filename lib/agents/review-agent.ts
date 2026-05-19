import type { AgentStageResultEnvelope, ResourceBundleData, RetrievalAgentData, ReviewAgentData } from './types';

export function runReviewAgent(input: {
  query: string;
  retrieval: RetrievalAgentData;
  resources: ResourceBundleData;
}): AgentStageResultEnvelope<ReviewAgentData> {
  const supportedClaims: string[] = [];
  const unsupportedClaims: string[] = [];

  if (input.retrieval.bestMatch) {
    supportedClaims.push(`已命中知识源《${input.retrieval.bestMatch.title}》`);
  }
  if (input.retrieval.autoContext?.chunkCount) {
    supportedClaims.push(`已提取 ${input.retrieval.autoContext.chunkCount} 个相关知识片段作为生成依据`);
  }
  if (input.resources.items.length >= 5) {
    supportedClaims.push(`当前可覆盖 ${input.resources.items.length} 种资源类型`);
  }
  if (!input.retrieval.matched) {
    unsupportedClaims.push('知识库未提供足够强的命中，结果会更依赖通用生成能力。');
  }
  if (input.retrieval.bestMatch?.confidenceLevel === 'low') {
    unsupportedClaims.push('当前命中可信度较低，建议先查看资料候选或补充更具体的问题。');
  }

  const approved = unsupportedClaims.length === 0;
  const confidenceLabel =
    !input.retrieval.matched || input.retrieval.bestMatch?.confidenceLevel === 'low'
      ? 'low'
      : input.retrieval.bestMatch?.confidenceLevel === 'medium'
        ? 'medium'
        : 'high';

  return {
    success: true,
    stage: 'review',
    confidence: confidenceLabel === 'high' ? 0.9 : confidenceLabel === 'medium' ? 0.7 : 0.45,
    warnings: unsupportedClaims,
    sources: input.retrieval.results.slice(0, 3).map((result) => ({
      docId: result.docId,
      title: result.title,
      excerpt: result.matchedChunks[0]?.text ?? result.summary,
    })),
    nextAction: approved ? 'show_recommendations' : 'review_sources',
    data: {
      approved,
      confidenceLabel,
      supportedClaims,
      unsupportedClaims,
      summary: approved
        ? '当前结果具备较清晰的知识依据，可以直接继续生成或挑选资料。'
        : '当前结果已保留回退路径，建议先查看资料来源或补充更具体的需求。',
    },
  };
}

