import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/server/api-response';
import { ingestUploadedKnowledge } from '@/lib/knowledge-base/service';
import { createLogger } from '@/lib/logger';

const log = createLogger('KnowledgeIngest API');

const requestSchema = z.object({
  title: z.string().trim().min(1),
  text: z.string().trim().min(1),
  summary: z.string().trim().optional(),
  keywords: z.array(z.string().trim()).optional(),
  module: z.string().trim().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = requestSchema.parse(await req.json());
    const document = await ingestUploadedKnowledge(body);
    return apiSuccess({ document });
  } catch (error) {
    log.error('Knowledge ingest failed:', error);
    if (error instanceof z.ZodError) {
      return apiError('INVALID_REQUEST', 400, 'Invalid ingest request', error.message);
    }
    return apiError(
      'INTERNAL_ERROR',
      500,
      error instanceof Error ? error.message : 'Knowledge ingest failed',
    );
  }
}

