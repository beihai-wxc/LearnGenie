import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/server/api-response';
import { searchKnowledgeBase } from '@/lib/knowledge-base/service';
import { createLogger } from '@/lib/logger';

const log = createLogger('KnowledgeSearch API');

const profileSchema = z
  .object({
    score: z.number().optional(),
    description: z.string().optional(),
  })
  .passthrough();

const requestSchema = z.object({
  query: z.string().trim().min(1),
  intent: z.literal('learn').optional(),
  topK: z.number().int().min(1).max(10).optional(),
  profileContext: z
    .object({
      nickname: z.string().optional(),
      bio: z.string().optional(),
      learningProfile: z
        .object({
          knowledgeFoundation: profileSchema.optional(),
          cognitiveStyle: profileSchema.optional(),
          errorPronePatterns: profileSchema.optional(),
          learningPace: profileSchema.optional(),
          interestDirection: profileSchema.optional(),
          metaCognitiveStrategy: profileSchema.optional(),
          emotionalMotivation: profileSchema.optional(),
          interactionPreference: profileSchema.optional(),
        })
        .passthrough()
        .optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = requestSchema.parse(await req.json());
    const result = await searchKnowledgeBase(body.query, body.topK, body.profileContext as never);
    return apiSuccess({ ...result });
  } catch (error) {
    log.error('Knowledge search failed:', error);
    if (error instanceof z.ZodError) {
      return apiError('INVALID_REQUEST', 400, 'Invalid knowledge search request', error.message);
    }
    return apiError(
      'INTERNAL_ERROR',
      500,
      error instanceof Error ? error.message : 'Knowledge search failed',
    );
  }
}
