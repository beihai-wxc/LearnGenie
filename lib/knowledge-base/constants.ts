import path from 'node:path';

export const KNOWLEDGE_RAG_ROOT = path.join(process.cwd(), 'rag');
export const KNOWLEDGE_KNOWLEDGE_FILE = path.join(KNOWLEDGE_RAG_ROOT, 'knowledge_base.json');
export const KNOWLEDGE_UPLOADS_FILE = path.join(KNOWLEDGE_RAG_ROOT, 'uploaded-docs.json');
export const KNOWLEDGE_MARKDOWN_SOURCE_DIR = path.join(KNOWLEDGE_RAG_ROOT, '知识库知识');
export const KNOWLEDGE_COURSE_STRUCTURE_FILE = path.join(
  KNOWLEDGE_RAG_ROOT,
  'course-structure.json',
);
export const KNOWLEDGE_INDEX_DIR = path.join(KNOWLEDGE_RAG_ROOT, 'index');
export const KNOWLEDGE_INDEX_FILE = path.join(KNOWLEDGE_INDEX_DIR, 'index.json');
export const KNOWLEDGE_METADATA_FILE = path.join(KNOWLEDGE_INDEX_DIR, 'metadata.json');
export const KNOWLEDGE_PDF_DIR = path.join(KNOWLEDGE_RAG_ROOT, 'pdfs');
export const KNOWLEDGE_INDEX_VERSION = 3;

export const KNOWLEDGE_SEARCH_MATCH_THRESHOLD = 0.1;
export const KNOWLEDGE_SEARCH_TOP_K = 5;
export const KNOWLEDGE_CHUNK_SIZE = 800;
export const KNOWLEDGE_CHUNK_OVERLAP = 120;

// Embedding defaults
export const DEFAULT_EMBEDDING_BINDING = 'openai';
export const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-large';
export const DEFAULT_EMBEDDING_DIMENSIONS = 3072;
export const DEFAULT_EMBEDDING_BATCH_SIZE = 10;
export const DEFAULT_EMBEDDING_BATCH_DELAY = 0.2;

// Profile paths
export const KNOWLEDGE_PROFILE_DIR = path.join(KNOWLEDGE_RAG_ROOT, 'profiles');
export const KNOWLEDGE_PROFILE_FILE = path.join(KNOWLEDGE_PROFILE_DIR, 'PROFILE.md');
export const KNOWLEDGE_SUMMARY_FILE = path.join(KNOWLEDGE_PROFILE_DIR, 'SUMMARY.md');
