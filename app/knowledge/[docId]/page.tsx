import { notFound } from 'next/navigation';
import { getKnowledgeDocumentById, buildRecommendedRequirement } from '@/lib/knowledge-base/service';
import { KnowledgeDocViewer } from '@/components/knowledge/knowledge-doc-viewer';

export default async function KnowledgeDocumentPage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const { docId } = await params;
  const document = await getKnowledgeDocumentById(docId);
  if (!document) {
    notFound();
  }

  return (
    <KnowledgeDocViewer
      docId={document.docId}
      title={document.title}
      module={document.module}
      summary={document.summary}
      keywords={document.keywords}
      fullText={document.content}
      pdfUrl={`/api/knowledge/document/${document.docId}`}
      recommendedRequirement={buildRecommendedRequirement(document.content, document.title)}
    />
  );
}
