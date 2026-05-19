import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/server/api-response';
import { runAgentWorkflow } from '@/lib/agents/orchestrator';
import { createLogger } from '@/lib/logger';

const log = createLogger('AgentResourceBundle API');

const requestSchema = z.object({
  query: z.string().trim().min(1),
  nickname: z.string().optional(),
  bio: z.string().optional(),
  existingProfile: z.object({}).passthrough().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = requestSchema.parse(await req.json());
    const workflow = await runAgentWorkflow({
      query: body.query,
      mode: 'topic',
      nickname: body.nickname,
      bio: body.bio,
      existingProfile: body.existingProfile as never,
    });
    return apiSuccess({
      profile: workflow.profile,
      retrieval: workflow.retrieval,
      planning: workflow.planning,
      resources: workflow.resources,
      review: workflow.review,
    });
  } catch (error) {
    log.error('Agent resource bundle failed:', error);
    if (error instanceof z.ZodError) {
      return apiError('INVALID_REQUEST', 400, 'Invalid agent resource-bundle request', error.message);
    }
    return apiError(
      'INTERNAL_ERROR',
      500,
      error instanceof Error ? error.message : 'Agent resource bundle failed',
    );
  }
}

