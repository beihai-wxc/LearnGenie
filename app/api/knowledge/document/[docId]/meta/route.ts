import { NextRequest } from 'next/server';
import { getKnowledgeDocumentById, buildRecommendedRequirement } from '@/lib/knowledge-base/service';
import { apiError, apiSuccess } from '@/lib/server/api-response';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ docId: string }> },
) {
  const { docId } = await context.params;
  const query = req.nextUrl.searchParams.get('query') || undefined;
  const document = await getKnowledgeDocumentById(docId);
  if (!document) {
    return apiError('INVALID_REQUEST', 404, 'Knowledge document not found');
  }

  const recommendedRequirement = buildRecommendedRequirement(
    document.content,
    query ? `${document.title} - ${query}` : document.title,
    document.title,
  );

  return apiSuccess({
    document: {
      docId: document.docId,
      title: document.title,
      module: document.module,
      summary: document.summary,
      keywords: document.keywords,
      fullText: document.content,
      pdfAvailable: true,
      sourceType: document.sourceType,
      pdfUrl: `/api/knowledge/document/${document.docId}`,
      recommendedRequirement,
    },
  });
}
