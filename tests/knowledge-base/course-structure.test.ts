import fs from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { KNOWLEDGE_COURSE_STRUCTURE_FILE } from '@/lib/knowledge-base/constants';
import type { KnowledgeCourseStructure } from '@/lib/knowledge-base/types';
import { buildKnowledgeIndex } from '@/rag/retriever';

describe.sequential('knowledge course structure', () => {
  it('maps every built-in knowledge document into a course chapter with teaching metadata', async () => {
    const [index, structureRaw] = await Promise.all([
      buildKnowledgeIndex({ ensurePdfFiles: false, force: true }),
      fs.readFile(KNOWLEDGE_COURSE_STRUCTURE_FILE, 'utf8'),
    ]);
    const structure = JSON.parse(structureRaw) as KnowledgeCourseStructure;
    const seedDocs = index.documents.filter((doc) => doc.sourceType === 'seed');

    expect(structure.chapters.length).toBeGreaterThanOrEqual(8);
    expect(structure.documentBindings).toHaveLength(seedDocs.length);

    for (const doc of seedDocs) {
      expect(doc.chapterId).toBeTruthy();
      expect(doc.chapterTitle).toBeTruthy();
      expect(doc.learningStage).toBeTruthy();
      expect(doc.resourceTypes?.length).toBeGreaterThanOrEqual(4);
      expect(doc.estimatedStudyTimeMinutes).toBeGreaterThan(0);
    }
  });
});
