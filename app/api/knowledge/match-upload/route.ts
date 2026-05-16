import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/server/api-response';
import { matchUploadedKnowledge } from '@/lib/knowledge-base/service';
import { createLogger } from '@/lib/logger';

const log = createLogger('KnowledgeMatchUpload API');

const profileSchema = z
  .object({
    score: z.number().optional(),
    description: z.string().optional(),
  })
  .passthrough();

const requestSchema = z.object({
  text: z.string().trim().min(1),
  title: z.string().trim().optional(),
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
    const result = await matchUploadedKnowledge(body.text, body.title, body.profileContext);
    return apiSuccess({ ...result });
  } catch (error) {
    log.error('Upload match failed:', error);
    if (error instanceof z.ZodError) {
      return apiError('INVALID_REQUEST', 400, 'Invalid upload match request', error.message);
    }
    return apiError(
      'INTERNAL_ERROR',
      500,
      error instanceof Error ? error.message : 'Upload match failed',
    );
  }
}
