import { searchKnowledgeBase } from '@/lib/knowledge-base/service';
import type { AgentSourceReference, AgentStageResultEnvelope, RetrievalAgentData } from './types';
import type { KnowledgeSearchProfileContext } from '@/lib/knowledge-base/types';

function toSources(results: RetrievalAgentData['results']): AgentSourceReference[] {
  return results.slice(0, 3).flatMap((result) =>
    result.matchedChunks.slice(0, 1).map((chunk) => ({
      docId: result.docId,
      title: result.title,
      chunkId: chunk.chunkId,
      excerpt: chunk.text,
    })),
  );
}

export async function runRetrievalAgent(input: {
  query: string;
  profileContext: KnowledgeSearchProfileContext;
}): Promise<AgentStageResultEnvelope<RetrievalAgentData>> {
  const response = await searchKnowledgeBase(input.query, undefined, input.profileContext);
  const confidence = response.bestMatch?.score
    ? Math.max(0.25, Math.min(0.98, response.bestMatch.score + 0.25))
    : 0.3;

  return {
    success: true,
    stage: 'retrieval',
    confidence: Number(confidence.toFixed(2)),
    warnings: response.matched
      ? response.bestMatch?.confidenceLevel === 'low'
        ? ['当前知识命中较弱，建议补充更具体的问题或先查看候选资料。']
        : []
      : ['当前未找到足够强的知识命中，将保留直接生成课堂的回退路径。'],
    sources: toSources(response.results),
    nextAction: response.matched ? 'show_recommendations' : 'generate_classroom',
    data: {
      matched: response.matched,
      query: input.query,
      profileContext: input.profileContext,
      results: response.results,
      bestMatch: response.bestMatch,
      autoContext: response.autoContext,
      recommendedPath: response.recommendedPath,
      safetyNote: response.safetyNote,
    },
  };
}

