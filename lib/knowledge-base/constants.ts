import path from 'node:path';

export const KNOWLEDGE_RAG_ROOT = path.join(process.cwd(), 'rag');
export const KNOWLEDGE_KNOWLEDGE_FILE = path.join(KNOWLEDGE_RAG_ROOT, 'knowledge_base.json');
export const KNOWLEDGE_UPLOADS_FILE = path.join(KNOWLEDGE_RAG_ROOT, 'uploaded-docs.json');
export const KNOWLEDGE_INDEX_DIR = path.join(KNOWLEDGE_RAG_ROOT, 'index');
export const KNOWLEDGE_INDEX_FILE = path.join(KNOWLEDGE_INDEX_DIR, 'index.json');
export const KNOWLEDGE_METADATA_FILE = path.join(KNOWLEDGE_INDEX_DIR, 'metadata.json');
export const KNOWLEDGE_PDF_DIR = path.join(KNOWLEDGE_RAG_ROOT, 'pdfs');
export const KNOWLEDGE_INDEX_VERSION = 1;

export const KNOWLEDGE_SEARCH_MATCH_THRESHOLD = 0.16;
export const KNOWLEDGE_SEARCH_TOP_K = 5;
export const KNOWLEDGE_CHUNK_SIZE = 560;
export const KNOWLEDGE_CHUNK_OVERLAP = 80;
