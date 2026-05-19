import { buildLearnerProfileFromDialogue, toKnowledgeProfileContext } from './profile-agent';
import { runRetrievalAgent } from './retrieval-agent';
import { runPathPlanningAgent } from './path-planning-agent';
import { runResourceAgents } from './resource-agents';
import { runReviewAgent } from './review-agent';
import type { AgentWorkflowSnapshot } from './types';
import type { StudentProfileDimensions } from '@/lib/types/student-profile';

export async function runAgentWorkflow(input: {
  query: string;
  mode: 'topic' | 'upload';
  nickname?: string;
  bio?: string;
  existingProfile?: StudentProfileDimensions;
}) : Promise<AgentWorkflowSnapshot> {
  const profile = buildLearnerProfileFromDialogue({
    query: input.query,
    existingProfile: input.existingProfile,
    nickname: input.nickname,
    bio: input.bio,
  });

  const profileContext = toKnowledgeProfileContext(profile.data);
  const retrieval = await runRetrievalAgent({
    query: input.query,
    profileContext,
  });
  const planning = runPathPlanningAgent(retrieval.data);
  const resources = runResourceAgents({
    query: input.query,
    retrieval: retrieval.data,
  });
  const review = runReviewAgent({
    query: input.query,
    retrieval: retrieval.data,
    resources: resources.data,
  });

  return {
    query: input.query,
    mode: input.mode,
    profile,
    retrieval,
    planning,
    resources,
    review,
  };
}
