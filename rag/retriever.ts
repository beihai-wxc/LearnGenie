import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  KNOWLEDGE_CHUNK_OVERLAP,
  KNOWLEDGE_CHUNK_SIZE,
  KNOWLEDGE_COURSE_STRUCTURE_FILE,
  KNOWLEDGE_INDEX_DIR,
  KNOWLEDGE_INDEX_FILE,
  KNOWLEDGE_INDEX_VERSION,
  KNOWLEDGE_KNOWLEDGE_FILE,
  KNOWLEDGE_MARKDOWN_SOURCE_DIR,
  KNOWLEDGE_METADATA_FILE,
  KNOWLEDGE_PDF_DIR,
  KNOWLEDGE_RAG_ROOT,
  KNOWLEDGE_UPLOADS_FILE,
} from '@/lib/knowledge-base/constants';
import { getConceptTermsForDoc } from '@/lib/knowledge-base/concept-terms';
import { buildSimplePdf } from '@/lib/knowledge-base/pdf';
import { extractTopKeywords, normalizeText, tokenizeText } from '@/lib/knowledge-base/tokenize';
import type {
  KnowledgeChunk,
  KnowledgeCourseDocumentBinding,
  KnowledgeCourseStructure,
  KnowledgeDocument,
} from '@/lib/knowledge-base/types';

interface KnowledgeIndexMetadata {
  version: number;
  generatedAt: string;
  sourceSignature: string;
  documentCount: number;
  chunkCount: number;
  seedDocumentCount: number;
  uploadDocumentCount: number;
}

interface KnowledgeIndexPayload {
  version: number;
  generatedAt: string;
  sourceSignature: string;
  documents: KnowledgeDocument[];
  chunks: KnowledgeChunk[];
}

interface KnowledgeRetrieverState {
  documents: KnowledgeDocument[];
  chunks: KnowledgeChunk[];
  documentMap: Map<string, KnowledgeDocument>;
  chunksByDocId: Map<string, KnowledgeChunk[]>;
  metadata: KnowledgeIndexMetadata;
}

export type BuildKnowledgeIndexOptions = {
  ensurePdfFiles?: boolean;
  force?: boolean;
};

type SearchChunkMatch = {
  chunkId: string;
  section?: string;
  text: string;
  score: number;
};

export type SearchKnowledgeResult = {
  docId: string;
  title: string;
  module: string;
  chapterId?: string;
  chapterTitle?: string;
  learningStage?: KnowledgeDocument['learningStage'];
  summary: string;
  score: number;
  previewText: string;
  sourceType: KnowledgeDocument['sourceType'];
  sourceLabel: NonNullable<KnowledgeDocument['sourceLabel']>;
  difficulty?: KnowledgeDocument['difficulty'];
  resourceTypes?: NonNullable<KnowledgeDocument['resourceTypes']>;
  estimatedStudyTimeMinutes?: number;
  recommendedTeachingGoals?: string[];
  matchedBy: 'title' | 'concept' | 'keyword' | 'chunk';
  titleMatch: boolean;
  conceptMatches: string[];
  keywordMatches: string[];
  topChunks: SearchChunkMatch[];
};

const EMPTY_FILE_CONTENT = '[]\n';

let retrieverState: KnowledgeRetrieverState | null = null;
/** Promise-based lock to prevent concurrent index builds */
let retrieverStatePromise: Promise<KnowledgeRetrieverState> | null = null;

type MarkdownKnowledgeSource = {
  titleKey: string;
  title: string;
  content: string;
  summary: string;
  keywords: string[];
};

function createTitleKey(input: string) {
  return normalizeText(input).replace(/[^a-z0-9\u4e00-\u9fff]+/g, '');
}

function isKnowledgeDocument(value: unknown): value is KnowledgeDocument {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.docId === 'string' &&
    typeof record.title === 'string' &&
    typeof record.course === 'string' &&
    typeof record.module === 'string' &&
    typeof record.summary === 'string' &&
    Array.isArray(record.keywords) &&
    (record.chapterId == null || typeof record.chapterId === 'string') &&
    (record.chapterTitle == null || typeof record.chapterTitle === 'string') &&
    (record.learningStage == null ||
      record.learningStage === 'foundation' ||
      record.learningStage === 'core' ||
      record.learningStage === 'practice') &&
    (record.prerequisites == null || Array.isArray(record.prerequisites)) &&
    (record.resourceTypes == null || Array.isArray(record.resourceTypes)) &&
    (record.estimatedStudyTimeMinutes == null ||
      typeof record.estimatedStudyTimeMinutes === 'number') &&
    (record.conceptTerms == null || Array.isArray(record.conceptTerms)) &&
    typeof record.content === 'string' &&
    typeof record.pdfPath === 'string' &&
    (record.sourceType === 'seed' || record.sourceType === 'upload') &&
    (record.sourceLabel == null ||
      record.sourceLabel === '核心知识' ||
      record.sourceLabel === '重点能力' ||
      record.sourceLabel === '实战专题' ||
      record.sourceLabel === '用户上传') &&
    (record.difficulty == null ||
      record.difficulty === 'beginner' ||
      record.difficulty === 'intermediate' ||
      record.difficulty === 'advanced') &&
    (record.recommendedTeachingGoals == null || Array.isArray(record.recommendedTeachingGoals)) &&
    (record.references == null || Array.isArray(record.references)) &&
    typeof record.createdAt === 'string' &&
    typeof record.updatedAt === 'string'
  );
}

function deriveSourceLabel(doc: KnowledgeDocument): NonNullable<KnowledgeDocument['sourceLabel']> {
  if (doc.sourceType === 'upload') {
    return '用户上传';
  }
  if (doc.sourceLabel) {
    return doc.sourceLabel;
  }
  return doc.module.includes('实战') || doc.module.includes('工程') ? '实战专题' : '核心知识';
}

async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function ensureFile(filePath: string, defaultContent = EMPTY_FILE_CONTENT) {
  try {
    await fs.access(filePath);
  } catch {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, defaultContent, 'utf8');
  }
}

async function ensureGitkeep(dirPath: string) {
  await ensureDir(dirPath);
  await ensureFile(path.join(dirPath, '.gitkeep'), '');
}

function markdownToPlainText(markdown: string) {
  return markdown
    .replace(/\r/g, '')
    .replace(/^```[^\n]*$/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^>\s?/gm, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/^\|?\s*[-:]+\s*(\|\s*[-:]+\s*)+\|?$/gm, '')
    .replace(/\|/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractMarkdownTitle(markdown: string, fallback: string) {
  const headingMatch = markdown.match(/^#\s+(.+)$/m);
  if (headingMatch?.[1]) {
    return headingMatch[1].trim();
  }
  return fallback;
}

function extractMarkdownSummary(title: string, content: string) {
  const paragraphs = content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const firstBodyParagraph =
    paragraphs.find((paragraph) => paragraph !== title && !paragraph.startsWith('目录')) ?? content;
  return firstBodyParagraph.replace(/\s+/g, ' ').slice(0, 180);
}

async function listMarkdownFiles(rootDir: string): Promise<string[]> {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listMarkdownFiles(fullPath)));
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

async function readMarkdownKnowledgeSources() {
  try {
    await fs.access(KNOWLEDGE_MARKDOWN_SOURCE_DIR);
  } catch {
    return new Map<string, MarkdownKnowledgeSource>();
  }

  const markdownFiles = await listMarkdownFiles(KNOWLEDGE_MARKDOWN_SOURCE_DIR);
  const sources = new Map<string, MarkdownKnowledgeSource>();

  for (const filePath of markdownFiles) {
    const rawMarkdown = await fs.readFile(filePath, 'utf8');
    const title = extractMarkdownTitle(rawMarkdown, path.basename(filePath, '.md'));
    const content = markdownToPlainText(rawMarkdown);
    if (!content) continue;
    const titleKey = createTitleKey(title);
    sources.set(titleKey, {
      titleKey,
      title,
      content,
      summary: extractMarkdownSummary(title, content),
      keywords: extractTopKeywords(content, 18),
    });
  }

  return sources;
}

async function readDocumentFile(
  filePath: string,
  sourceType: KnowledgeDocument['sourceType'],
): Promise<KnowledgeDocument[]> {
  await ensureFile(filePath);

  const raw = await fs.readFile(filePath, 'utf8');

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `Invalid knowledge store at ${filePath}: failed to parse JSON. ${
        error instanceof Error ? error.message : 'Unknown parse error.'
      }`,
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`Invalid knowledge store at ${filePath}: expected a JSON array of documents.`);
  }

  const invalidIndex = parsed.findIndex((value) => !isKnowledgeDocument(value));
  if (invalidIndex >= 0) {
    throw new Error(
      `Invalid knowledge store at ${filePath}: item ${invalidIndex} is not a valid knowledge document.`,
    );
  }

  return (parsed as KnowledgeDocument[]).map((doc) => ({
    ...doc,
    sourceType,
    sourceLabel:
      sourceType === 'upload'
        ? '用户上传'
        : doc.sourceLabel === '实战专题'
          ? '实战专题'
          : '核心知识',
    keywords: [...new Set(doc.keywords.map((keyword) => keyword.trim()).filter(Boolean))],
    conceptTerms: [
      ...new Set([
        ...((doc.conceptTerms ?? []).map((term) => `${term}`.trim()).filter(Boolean) as string[]),
        ...getConceptTermsForDoc(doc.docId),
      ]),
    ],
    chapterId: typeof doc.chapterId === 'string' ? doc.chapterId : undefined,
    chapterTitle: typeof doc.chapterTitle === 'string' ? doc.chapterTitle : undefined,
    learningStage:
      doc.learningStage === 'foundation' ||
      doc.learningStage === 'core' ||
      doc.learningStage === 'practice'
        ? doc.learningStage
        : undefined,
    prerequisites: (doc.prerequisites ?? []).map((value) => `${value}`.trim()).filter(Boolean),
    resourceTypes: (doc.resourceTypes ?? []).filter(Boolean),
    estimatedStudyTimeMinutes:
      typeof doc.estimatedStudyTimeMinutes === 'number' ? doc.estimatedStudyTimeMinutes : undefined,
    recommendedTeachingGoals: (doc.recommendedTeachingGoals ?? [])
      .map((goal) => `${goal}`.trim())
      .filter(Boolean),
    references: (doc.references ?? []).map((reference) => `${reference}`.trim()).filter(Boolean),
  }));
}

function inferSection(doc: KnowledgeDocument): string | undefined {
  const [firstLine] = doc.content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  if (firstLine && firstLine.length <= 80 && firstLine !== doc.title) {
    return firstLine;
  }
  return undefined;
}

/**
 * Split content into sections by markdown headings (##, ###, ####).
 * Each section starts with its heading line and includes all content until
 * the next heading of the same or higher level.
 */
function splitByMarkdownHeadings(content: string): { heading: string | undefined; text: string }[] {
  const lines = content.split('\n');
  const sections: { heading: string | undefined; text: string }[] = [];
  let currentHeading: string | undefined;
  let currentLines: string[] = [];

  const flush = () => {
    const text = currentLines.join('\n').trim();
    if (text) {
      sections.push({ heading: currentHeading, text });
    }
    currentLines = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      flush();
      currentHeading = headingMatch[2]!.trim();
      currentLines.push(line);
    } else {
      currentLines.push(line);
    }
  }
  flush();

  // If no headings found, return the whole content as one section
  if (sections.length === 0 && content.trim()) {
    return [{ heading: undefined, text: content.trim() }];
  }
  return sections;
}

/**
 * Estimate page number based on character offset (rough heuristic:
 * ~1800 characters per page for mixed Chinese/English content).
 */
const CHARS_PER_PAGE = 1800;

function estimatePage(charOffset: number): number {
  return Math.floor(charOffset / CHARS_PER_PAGE) + 1;
}

function chunkDocument(doc: KnowledgeDocument): KnowledgeChunk[] {
  const content = doc.content.replace(/\r/g, '').trim();
  if (!content) return [];

  const defaultSection = inferSection(doc);
  const chunks: KnowledgeChunk[] = [];
  let index = 0;
  let globalCharOffset = 0;

  // Split by markdown headings first, then by paragraph boundaries within
  // each section. This preserves semantic coherence within each chunk.
  const sections = splitByMarkdownHeadings(content);

  for (const section of sections) {
    const sectionHeading = section.heading || defaultSection;
    const sectionText = section.text;
    const sectionStartOffset = globalCharOffset;
    globalCharOffset += sectionText.length + 1; // +1 for the newline between sections

    // Split by paragraphs while tracking each paragraph's start offset within
    // sectionText. Using indexOf would be wrong for repeated paragraphs.
    const paragraphs: { text: string; startOffset: number }[] = [];
    {
      const remaining = sectionText;
      let match: RegExpExecArray | null;
      let lastIdx = 0;
      // Use a manual scan to record offsets precisely
      const regex = /\n\s*\n/g;
      while ((match = regex.exec(remaining)) !== null) {
        const piece = remaining.slice(lastIdx, match.index);
        const trimmed = piece.trim();
        if (trimmed) {
          paragraphs.push({
            text: trimmed,
            startOffset: lastIdx + (piece.length - piece.trimStart().length),
          });
        }
        lastIdx = regex.lastIndex;
      }
      const tail = remaining.slice(lastIdx);
      const trimmedTail = tail.trim();
      if (trimmedTail) {
        paragraphs.push({
          text: trimmedTail,
          startOffset: lastIdx + (tail.length - tail.trimStart().length),
        });
      }
    }

    // Greedily merge paragraphs into chunks up to KNOWLEDGE_CHUNK_SIZE
    let currentChunk = '';
    let currentChunkStart = 0;

    const flushChunk = () => {
      const text = currentChunk.trim();
      if (text) {
        const pageOffset = sectionStartOffset + currentChunkStart;
        chunks.push({
          chunkId: `${doc.docId}::chunk-${index + 1}`,
          docId: doc.docId,
          text,
          section: sectionHeading,
          page: estimatePage(pageOffset),
          keywords: doc.keywords,
          tokenSet: [
            ...new Set(
              tokenizeText(
                `${doc.title}\n${doc.summary}\n${doc.keywords.join(' ')}\n${(doc.conceptTerms ?? []).join(' ')}\n${text}`,
              ),
            ),
          ],
        });
        index += 1;
      }
      currentChunk = '';
    };

    for (const { text: para, startOffset: paraStartOffset } of paragraphs) {
      // If a single paragraph exceeds chunk size, split it by sentences
      if (para.length > KNOWLEDGE_CHUNK_SIZE) {
        flushChunk();
        // Sentence-level splitting for very long paragraphs.
        // sentenceChunkStart tracks the char offset of sentenceChunk within
        // the paragraph so page numbers stay accurate after overlap slicing.
        const sentenceSep = /(?<=[。！？.!?])\s*/;
        const sentences = para.split(sentenceSep).filter(Boolean);
        let sentenceChunk = '';
        let sentenceChunkStart = 0;
        for (const sentence of sentences) {
          if ((sentenceChunk + sentence).length > KNOWLEDGE_CHUNK_SIZE && sentenceChunk) {
            const text = sentenceChunk.trim();
            if (text) {
              const pageOffset = sectionStartOffset + paraStartOffset + sentenceChunkStart;
              chunks.push({
                chunkId: `${doc.docId}::chunk-${index + 1}`,
                docId: doc.docId,
                text,
                section: sectionHeading,
                page: estimatePage(pageOffset),
                keywords: doc.keywords,
                tokenSet: [
                  ...new Set(
                    tokenizeText(
                      `${doc.title}\n${doc.summary}\n${doc.keywords.join(' ')}\n${(doc.conceptTerms ?? []).join(' ')}\n${text}`,
                    ),
                  ),
                ],
              });
              index += 1;
            }
            // Add overlap: carry last KNOWLEDGE_CHUNK_OVERLAP chars.
            // Advance sentenceChunkStart by the number of dropped chars so the
            // page offset stays accurate (avoids indexOf which can return -1).
            const oldLen = sentenceChunk.length;
            sentenceChunk = sentenceChunk.slice(-KNOWLEDGE_CHUNK_OVERLAP);
            sentenceChunkStart += oldLen - sentenceChunk.length;
          }
          sentenceChunk += sentence;
        }
        if (sentenceChunk.trim()) {
          currentChunk = sentenceChunk;
          currentChunkStart = paraStartOffset + sentenceChunkStart;
        }
        continue;
      }

      // Normal case: merge paragraphs into chunk
      if ((currentChunk + '\n\n' + para).length > KNOWLEDGE_CHUNK_SIZE && currentChunk) {
        flushChunk();
        // Overlap: carry the last paragraph if it's within overlap size
        if (currentChunk.length <= KNOWLEDGE_CHUNK_OVERLAP) {
          // keep currentChunk as overlap seed
        } else {
          currentChunk = '';
        }
      }
      if (currentChunk) {
        currentChunk += '\n\n' + para;
      } else {
        currentChunk = para;
        currentChunkStart = paraStartOffset;
      }
    }
    flushChunk();
  }

  return chunks;
}

async function ensurePdfForDocument(doc: KnowledgeDocument, forceRewrite = false) {
  const pdfPath = path.join(KNOWLEDGE_PDF_DIR, doc.pdfPath);
  if (!forceRewrite) {
    try {
      await fs.access(pdfPath);
      return;
    } catch {
      // Fall through and generate the file.
    }
  }
  const pdfBuffer = buildSimplePdf(doc.title, `${doc.summary}\n\n${doc.content}`);
  await fs.mkdir(path.dirname(pdfPath), { recursive: true });
  await fs.writeFile(pdfPath, pdfBuffer);
}

async function ensureKnowledgeAssets() {
  await ensureDir(KNOWLEDGE_RAG_ROOT);
  await ensureGitkeep(KNOWLEDGE_INDEX_DIR);
  await ensureGitkeep(KNOWLEDGE_PDF_DIR);
  await ensureFile(KNOWLEDGE_KNOWLEDGE_FILE);
  await ensureFile(KNOWLEDGE_UPLOADS_FILE);
}

function isCourseBinding(value: unknown): value is KnowledgeCourseDocumentBinding {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.docId === 'string' &&
    typeof record.chapterId === 'string' &&
    typeof record.chapterTitle === 'string' &&
    (record.learningStage === 'foundation' ||
      record.learningStage === 'core' ||
      record.learningStage === 'practice') &&
    Array.isArray(record.resourceTypes) &&
    typeof record.estimatedStudyTimeMinutes === 'number'
  );
}

async function readCourseStructure(): Promise<KnowledgeCourseStructure | null> {
  try {
    const raw = await fs.readFile(KNOWLEDGE_COURSE_STRUCTURE_FILE, 'utf8');
    const parsed = JSON.parse(raw) as KnowledgeCourseStructure;
    if (
      typeof parsed.courseId !== 'string' ||
      typeof parsed.title !== 'string' ||
      !Array.isArray(parsed.chapters) ||
      !Array.isArray(parsed.documentBindings) ||
      parsed.documentBindings.some((binding) => !isCourseBinding(binding))
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function applyCourseBinding(doc: KnowledgeDocument, binding?: KnowledgeCourseDocumentBinding) {
  if (!binding || doc.sourceType !== 'seed') {
    return doc;
  }

  return {
    ...doc,
    chapterId: binding.chapterId,
    chapterTitle: binding.chapterTitle,
    learningStage: binding.learningStage,
    prerequisites: binding.prerequisites ?? [],
    resourceTypes: binding.resourceTypes,
    estimatedStudyTimeMinutes: binding.estimatedStudyTimeMinutes,
  };
}

async function loadDocumentsFromStore() {
  await ensureKnowledgeAssets();
  const seedDocuments = await readDocumentFile(KNOWLEDGE_KNOWLEDGE_FILE, 'seed');
  const uploadedDocuments = await readDocumentFile(KNOWLEDGE_UPLOADS_FILE, 'upload');
  const markdownSources = await readMarkdownKnowledgeSources();
  const courseStructure = await readCourseStructure();
  const bindingMap = new Map(
    (courseStructure?.documentBindings ?? []).map((binding) => [binding.docId, binding]),
  );

  const mergedSeedDocuments = seedDocuments.map((doc) => {
    const markdownSource = markdownSources.get(createTitleKey(doc.title));
    const docWithMarkdown = markdownSource
      ? {
          ...doc,
          content: markdownSource.content,
          summary: markdownSource.summary || doc.summary,
          keywords: [...new Set([...doc.keywords, ...markdownSource.keywords])],
          conceptTerms: [...new Set(doc.conceptTerms ?? [])],
        }
      : doc;

    return applyCourseBinding(
      docWithMarkdown,
      bindingMap.get(doc.docId),
    );
  });

  const normalizedUploads = uploadedDocuments.map((doc) => ({
    ...doc,
    resourceTypes: doc.resourceTypes ?? ['lecture', 'reading'],
  }));

  return [...mergedSeedDocuments, ...normalizedUploads];
}

function computeSourceSignature(documents: KnowledgeDocument[]) {
  // Use SHA-256 hash instead of raw JSON to keep metadata.json small.
  // Previously this returned the full JSON.stringify of all documents (821KB
  // for 27 docs), now it returns a 64-character hex digest.
  const payload = JSON.stringify(
    documents.map((doc) => ({
      docId: doc.docId,
      title: doc.title,
      course: doc.course,
      module: doc.module,
      summary: doc.summary,
      keywords: doc.keywords,
      conceptTerms: doc.conceptTerms,
      chapterId: doc.chapterId,
      chapterTitle: doc.chapterTitle,
      learningStage: doc.learningStage,
      prerequisites: doc.prerequisites,
      resourceTypes: doc.resourceTypes,
      estimatedStudyTimeMinutes: doc.estimatedStudyTimeMinutes,
      content: doc.content,
      pdfPath: doc.pdfPath,
      sourceType: doc.sourceType,
      sourceLabel: doc.sourceLabel,
      difficulty: doc.difficulty,
      recommendedTeachingGoals: doc.recommendedTeachingGoals,
      references: doc.references,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    })),
  );
  return crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
}

function buildChunkMap(chunks: KnowledgeChunk[]) {
  const chunksByDocId = new Map<string, KnowledgeChunk[]>();
  for (const chunk of chunks) {
    const list = chunksByDocId.get(chunk.docId) ?? [];
    list.push(chunk);
    chunksByDocId.set(chunk.docId, list);
  }
  return chunksByDocId;
}

function buildMetadata(
  documents: KnowledgeDocument[],
  chunks: KnowledgeChunk[],
  sourceSignature: string,
): KnowledgeIndexMetadata {
  return {
    version: KNOWLEDGE_INDEX_VERSION,
    generatedAt: new Date().toISOString(),
    sourceSignature,
    documentCount: documents.length,
    chunkCount: chunks.length,
    seedDocumentCount: documents.filter((doc) => doc.sourceType === 'seed').length,
    uploadDocumentCount: documents.filter((doc) => doc.sourceType === 'upload').length,
  };
}

async function writeIndexFiles(documents: KnowledgeDocument[], chunks: KnowledgeChunk[]) {
  const sourceSignature = computeSourceSignature(documents);
  const payload: KnowledgeIndexPayload = {
    version: KNOWLEDGE_INDEX_VERSION,
    generatedAt: new Date().toISOString(),
    sourceSignature,
    documents,
    chunks,
  };
  const metadata = buildMetadata(documents, chunks, sourceSignature);

  await ensureDir(KNOWLEDGE_INDEX_DIR);
  await fs.writeFile(KNOWLEDGE_INDEX_FILE, JSON.stringify(payload, null, 2), 'utf8');
  await fs.writeFile(KNOWLEDGE_METADATA_FILE, JSON.stringify(metadata, null, 2), 'utf8');

  return metadata;
}

async function readPersistedIndex() {
  try {
    const [indexRaw, metadataRaw] = await Promise.all([
      fs.readFile(KNOWLEDGE_INDEX_FILE, 'utf8'),
      fs.readFile(KNOWLEDGE_METADATA_FILE, 'utf8'),
    ]);
    const payload = JSON.parse(indexRaw) as KnowledgeIndexPayload;
    const metadata = JSON.parse(metadataRaw) as KnowledgeIndexMetadata;

    if (
      payload.version !== KNOWLEDGE_INDEX_VERSION ||
      metadata.version !== KNOWLEDGE_INDEX_VERSION ||
      !Array.isArray(payload.documents) ||
      !Array.isArray(payload.chunks) ||
      typeof payload.sourceSignature !== 'string' ||
      typeof metadata.sourceSignature !== 'string'
    ) {
      return null;
    }

    return { payload, metadata };
  } catch {
    return null;
  }
}

async function ensureRetrieverState(options: BuildKnowledgeIndexOptions = {}) {
  if (retrieverState && !options.force) {
    return retrieverState;
  }

  // Prevent concurrent index builds: if a build is already in-flight, await it
  if (retrieverStatePromise && !options.force) {
    return retrieverStatePromise;
  }

  retrieverStatePromise = (async () => {
    await ensureKnowledgeAssets();

  const documents = await loadDocumentsFromStore();
  const sourceSignature = computeSourceSignature(documents);

  if (!options.force) {
    const persisted = await readPersistedIndex();
    if (
      persisted &&
      persisted.payload.sourceSignature === sourceSignature &&
      persisted.metadata.sourceSignature === sourceSignature
    ) {
      retrieverState = {
        documents: persisted.payload.documents,
        chunks: persisted.payload.chunks,
        documentMap: new Map(persisted.payload.documents.map((doc) => [doc.docId, doc])),
        chunksByDocId: buildChunkMap(persisted.payload.chunks),
        metadata: persisted.metadata,
      };
      return retrieverState;
    }
  }

  if (options.ensurePdfFiles) {
    for (const document of documents) {
      await ensurePdfForDocument(document, options.force);
    }
  }

    const chunks = documents.flatMap((document) => chunkDocument(document));
    const metadata = await writeIndexFiles(documents, chunks);
    retrieverState = {
      documents,
      chunks,
      documentMap: new Map(documents.map((doc) => [doc.docId, doc])),
      chunksByDocId: buildChunkMap(chunks),
      metadata,
    };
    return retrieverState;
  })();

  return retrieverStatePromise;
}

function overlapScore(left: string[], right: string[]) {
  if (left.length === 0 || right.length === 0) return 0;
  const rightSet = new Set(right);
  let matches = 0;
  for (const token of left) {
    if (rightSet.has(token)) {
      matches += 1;
    }
  }
  return matches / Math.max(left.length, rightSet.size);
}

function collectConceptMatches(doc: KnowledgeDocument, normalizedQuery: string, queryTokens: string[]) {
  return (doc.conceptTerms ?? []).filter((term) => {
    const normalizedTerm = normalizeText(term);
    return (
      !!normalizedTerm &&
      (normalizedQuery.includes(normalizedTerm) ||
        normalizedTerm.includes(normalizedQuery) ||
        queryTokens.includes(normalizedTerm))
    );
  });
}

function simplifyQuery(query: string) {
  return normalizeText(query)
    .replace(/[?.!,，。！？；：]/g, ' ')
    .replace(/什么是|什么叫|请介绍|介绍一下|讲解一下|解释一下|请问|一下/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function ensureKnowledgeAssetsForTests() {
  await ensureKnowledgeAssets();
}

export function resetRetrieverCache() {
  retrieverState = null;
}

export async function getKnowledgeDocumentsFromStore() {
  const state = await ensureRetrieverState();
  return state.documents;
}

export async function getKnowledgeDocumentMap() {
  const state = await ensureRetrieverState();
  return state.documentMap;
}

export async function buildKnowledgeIndex(options: BuildKnowledgeIndexOptions = {}) {
  const state = await ensureRetrieverState(options);
  return {
    documents: state.documents,
    chunks: state.chunks,
    metadata: state.metadata,
  };
}

export async function searchKnowledgeIndex(query: string, topK = 5): Promise<SearchKnowledgeResult[]> {
  const state = await ensureRetrieverState();
  const normalizedQuery = normalizeText(query);
  const simplifiedQuery = simplifyQuery(query);
  const queryTokens = tokenizeText(query);

  if (!normalizedQuery || queryTokens.length === 0) {
    return [];
  }

  const results: (SearchKnowledgeResult | null)[] = state.documents
    .map((doc) => {
      const normalizedTitle = normalizeText(doc.title);
      const titleMatch =
        normalizedTitle.includes(normalizedQuery) ||
        (!!simplifiedQuery &&
          (normalizedTitle.includes(simplifiedQuery) || simplifiedQuery.includes(normalizedTitle)));
      const keywordMatches = doc.keywords.filter((keyword) => {
        const normalizedKeyword = normalizeText(keyword);
        return (
          normalizedKeyword.includes(normalizedQuery) ||
          queryTokens.includes(normalizedKeyword) ||
          (!!simplifiedQuery &&
            normalizedKeyword.length > 1 &&
            (simplifiedQuery.includes(normalizedKeyword) ||
            normalizedKeyword.includes(simplifiedQuery)))
        );
      });
      const conceptMatches = collectConceptMatches(doc, normalizedQuery, queryTokens);
      const topChunks = (state.chunksByDocId.get(doc.docId) ?? [])
        .map((chunk) => ({
          chunkId: chunk.chunkId,
          section: chunk.section,
          text: chunk.text,
          score:
            overlapScore(queryTokens, chunk.tokenSet) +
            (simplifiedQuery && normalizeText(chunk.text).includes(simplifiedQuery) ? 0.24 : 0),
        }))
        .filter((chunk) => chunk.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      const titleScore = titleMatch ? 1 : overlapScore(queryTokens, tokenizeText(doc.title));
      const conceptScore = conceptMatches.length
        ? Math.min(1, conceptMatches.length / Math.max((doc.conceptTerms ?? []).length / 3, 1))
        : 0;
      const keywordScore = keywordMatches.length
        ? keywordMatches.length / Math.max(doc.keywords.length, queryTokens.length, 1)
        : 0;
      const chunkScore = topChunks[0]?.score ?? 0;
      const score =
        titleScore * 0.36 + conceptScore * 0.28 + keywordScore * 0.12 + chunkScore * 0.24;

      if (score <= 0) {
        return null;
      }

      const matchedBy: SearchKnowledgeResult['matchedBy'] = titleMatch
        ? 'title'
        : conceptMatches.length > 0
          ? 'concept'
        : keywordMatches.length > 0
          ? 'keyword'
          : 'chunk';

      return {
        docId: doc.docId,
        title: doc.title,
        module: doc.module,
        chapterId: doc.chapterId,
        chapterTitle: doc.chapterTitle,
        learningStage: doc.learningStage,
        summary: doc.summary,
        score,
        previewText: topChunks[0]?.text ?? doc.summary,
        sourceType: doc.sourceType,
        sourceLabel: deriveSourceLabel(doc),
        difficulty: doc.difficulty,
        resourceTypes: doc.resourceTypes,
        estimatedStudyTimeMinutes: doc.estimatedStudyTimeMinutes,
        recommendedTeachingGoals: doc.recommendedTeachingGoals,
        matchedBy,
        titleMatch,
        conceptMatches,
        keywordMatches,
        topChunks,
      };
    })
  return results
    .filter((result): result is SearchKnowledgeResult => result !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
