import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/server/api-response';
import { buildLearnerProfileFromDialogue } from '@/lib/agents/profile-agent';
import { createLogger } from '@/lib/logger';

const log = createLogger('AgentProfile API');

const requestSchema = z.object({
  query: z.string().trim().min(1),
  nickname: z.string().optional(),
  bio: z.string().optional(),
  existingProfile: z.object({}).passthrough().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = requestSchema.parse(await req.json());
    const result = buildLearnerProfileFromDialogue({
      query: body.query,
      nickname: body.nickname,
      bio: body.bio,
      existingProfile: body.existingProfile as never,
    });
    return apiSuccess({ result });
  } catch (error) {
    log.error('Agent profile extraction failed:', error);
    if (error instanceof z.ZodError) {
      return apiError('INVALID_REQUEST', 400, 'Invalid agent profile request', error.message);
    }
    return apiError(
      'INTERNAL_ERROR',
      500,
      error instanceof Error ? error.message : 'Agent profile extraction failed',
    );
  }
}
