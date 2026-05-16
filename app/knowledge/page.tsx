import fs from 'node:fs/promises';
import {
  KNOWLEDGE_COURSE_STRUCTURE_FILE,
  KNOWLEDGE_METADATA_FILE,
} from '@/lib/knowledge-base/constants';
import { getKnowledgeDocuments } from '@/lib/knowledge-base/service';
import type { KnowledgeCourseStructure } from '@/lib/knowledge-base/types';
import { KnowledgeManagementPanel } from '@/components/knowledge/knowledge-management-panel';

async function readCourseStructure() {
  try {
    const raw = await fs.readFile(KNOWLEDGE_COURSE_STRUCTURE_FILE, 'utf8');
    return JSON.parse(raw) as KnowledgeCourseStructure;
  } catch {
    return null;
  }
}

async function readLastIndexedAt() {
  try {
    const raw = await fs.readFile(KNOWLEDGE_METADATA_FILE, 'utf8');
    const metadata = JSON.parse(raw) as { generatedAt?: string };
    return metadata.generatedAt;
  } catch {
    return undefined;
  }
}

export default async function KnowledgeManagementPage() {
  const [documents, courseStructure, lastIndexedAt] = await Promise.all([
    getKnowledgeDocuments(),
    readCourseStructure(),
    readLastIndexedAt(),
  ]);

  return (
    <KnowledgeManagementPanel
      documents={documents.filter((doc) => doc.sourceType === 'seed')}
      chapterCount={courseStructure?.chapters.length ?? 0}
      lastIndexedAt={lastIndexedAt}
    />
  );
}
