import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/server/api-response';
import { matchUploadedKnowledge } from '@/lib/knowledge-base/service';
import { createLogger } from '@/lib/logger';

const log = createLogger('KnowledgeMatchUpload API');

const requestSchema = z.object({
  text: z.string().trim().min(1),
  title: z.string().trim().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = requestSchema.parse(await req.json());
    const result = await matchUploadedKnowledge(body.text, body.title);
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
