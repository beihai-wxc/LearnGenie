export interface KnowledgeChunk {
  chunkId: string;
  docId: string;
  text: string;
  section?: string;
  page?: number;
  pageRange?: string;
  keywords: string[];
  tokenSet: string[];
}

export interface KnowledgeDocument {
  docId: string;
  title: string;
  course: string;
  module: string;
  summary: string;
  keywords: string[];
  content: string;
  pdfPath: string;
  sourceType: 'seed' | 'upload';
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeSearchResult {
  docId: string;
  title: string;
  module: string;
  summary: string;
  score: number;
  reasons: string[];
  pdfUrl: string;
  previewText: string;
  pdfAvailable: boolean;
  sourceType: 'seed' | 'upload';
  matchedBy: 'title' | 'keyword' | 'chunk';
  matchedChunks: Array<{
    chunkId: string;
    section?: string;
    text: string;
    score: number;
  }>;
}

export interface KnowledgeSearchResponse {
  matched: boolean;
  results: KnowledgeSearchResult[];
  bestMatch: KnowledgeSearchResult | null;
  fallbackAction: 'open_pdf' | 'generate_classroom';
}

export interface UploadKnowledgeMatchResponse extends KnowledgeSearchResponse {
  recommendedRequirement: string;
}

export interface UploadKnowledgeIngestInput {
  title: string;
  text: string;
  summary?: string;
  keywords?: string[];
  module?: string;
}
