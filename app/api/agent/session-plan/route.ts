import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/server/api-response';
import { runAgentWorkflow } from '@/lib/agents/orchestrator';
import { createLogger } from '@/lib/logger';

const log = createLogger('AgentSessionPlan API');

const requestSchema = z.object({
  query: z.string().trim().min(1),
  mode: z.enum(['topic', 'upload']).default('topic'),
  nickname: z.string().optional(),
  bio: z.string().optional(),
  existingProfile: z.object({}).passthrough().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = requestSchema.parse(await req.json());
    const workflow = await runAgentWorkflow({
      query: body.query,
      mode: body.mode,
      nickname: body.nickname,
      bio: body.bio,
      existingProfile: body.existingProfile as never,
    });
    return apiSuccess({ workflow });
  } catch (error) {
    log.error('Agent session planning failed:', error);
    if (error instanceof z.ZodError) {
      return apiError('INVALID_REQUEST', 400, 'Invalid agent session-plan request', error.message);
    }
    return apiError(
      'INTERNAL_ERROR',
      500,
      error instanceof Error ? error.message : 'Agent session planning failed',
    );
  }
}

