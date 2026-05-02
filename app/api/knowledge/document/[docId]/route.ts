import { NextRequest } from 'next/server';
import { getKnowledgePdfBuffer } from '@/lib/knowledge-base/service';
import { apiError } from '@/lib/server/api-response';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ docId: string }> },
) {
  const { docId } = await context.params;
  const pdf = await getKnowledgePdfBuffer(docId);
  if (!pdf) {
    return apiError('INVALID_REQUEST', 404, 'Knowledge document not found');
  }

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${docId}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
