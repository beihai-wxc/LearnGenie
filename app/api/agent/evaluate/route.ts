import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/server/api-response';
import { runEvaluationAgent } from '@/lib/agents/evaluation-agent';
import { createLogger } from '@/lib/logger';

const log = createLogger('AgentEvaluate API');

const requestSchema = z.object({
  currentProfile: z.object({}).passthrough(),
  evaluation: z.object({
    viewedResourceTypes: z.array(z.string()).optional(),
    completedQuiz: z.boolean().optional(),
    selfReportedUnderstanding: z.enum(['low', 'medium', 'high']).optional(),
    freeformFeedback: z.string().optional(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = requestSchema.parse(await req.json());
    const result = runEvaluationAgent({
      currentProfile: body.currentProfile as never,
      evaluation: body.evaluation,
    });
    return apiSuccess({ result });
  } catch (error) {
    log.error('Agent evaluation failed:', error);
    if (error instanceof z.ZodError) {
      return apiError('INVALID_REQUEST', 400, 'Invalid agent evaluation request', error.message);
    }
    return apiError(
      'INTERNAL_ERROR',
      500,
      error instanceof Error ? error.message : 'Agent evaluation failed',
    );
  }
}

