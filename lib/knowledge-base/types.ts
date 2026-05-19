import type { StudentProfileDimensions } from '@/lib/types/student-profile';

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
  conceptTerms?: string[];
  chapterId?: string;
  chapterTitle?: string;
  learningStage?: 'foundation' | 'core' | 'practice';
  prerequisites?: string[];
  resourceTypes?: Array<
    'lecture' | 'mindmap' | 'quiz' | 'reading' | 'code-lab' | 'project' | 'video-script'
  >;
  estimatedStudyTimeMinutes?: number;
  content: string;
  pdfPath: string;
  sourceType: 'seed' | 'upload';
  sourceLabel?: '核心知识' | '实战专题' | '用户上传';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  recommendedTeachingGoals?: string[];
  references?: string[];
  createdAt: string;
  updatedAt: string;
  // 新增字段：用于存储原始网页PDF
  sourceUrl?: string;           // 原始网页URL
  hasOriginalPdf?: boolean;     // 是否已保存原始PDF
  originalPdfPath?: string;     // 原始PDF文件路径
}

export interface KnowledgeSearchResult {
  docId: string;
  title: string;
  module: string;
  chapterId?: string;
  chapterTitle?: string;
  learningStage?: 'foundation' | 'core' | 'practice';
  summary: string;
  score: number;
  reasons: string[];
  pdfUrl: string;
  previewText: string;
  pdfAvailable: boolean;
  sourceType: 'seed' | 'upload';
  sourceLabel: '核心知识' | '实战专题' | '用户上传';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  resourceTypes?: Array<
    'lecture' | 'mindmap' | 'quiz' | 'reading' | 'code-lab' | 'project' | 'video-script'
  >;
  estimatedStudyTimeMinutes?: number;
  recommendedTeachingGoals?: string[];
  matchedBy: 'title' | 'concept' | 'keyword' | 'chunk';
  conceptMatches?: string[];
  personalizationReasons?: string[];
  confidenceLevel?: 'low' | 'medium' | 'high';
  matchedChunks: Array<{
    chunkId: string;
    section?: string;
    text: string;
    score: number;
  }>;
}

export interface InjectedKnowledgeContext {
  contextText: string;
  docIds: string[];
  sourceTitles: string[];
  chunkCount: number;
}

export interface KnowledgeSearchResponse {
  matched: boolean;
  results: KnowledgeSearchResult[];
  bestMatch: KnowledgeSearchResult | null;
  fallbackAction: 'open_pdf' | 'generate_classroom';
  autoContext: InjectedKnowledgeContext | null;
  recommendedPath: KnowledgeLearningPath | null;
  safetyNote?: string;
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

export interface KnowledgeSearchProfileContext {
  nickname?: string;
  bio?: string;
  learningProfile?: StudentProfileDimensions;
}

export interface KnowledgeCourseStructure {
  courseId: string;
  title: string;
  description: string;
  chapters: KnowledgeCourseChapter[];
  documentBindings: KnowledgeCourseDocumentBinding[];
}

export interface KnowledgeCourseChapter {
  chapterId: string;
  title: string;
  summary: string;
  order: number;
  learningStage: 'foundation' | 'core' | 'practice';
  prerequisiteChapterIds?: string[];
  docIds: string[];
}

export interface KnowledgeCourseDocumentBinding {
  docId: string;
  chapterId: string;
  chapterTitle: string;
  learningStage: 'foundation' | 'core' | 'practice';
  prerequisites?: string[];
  resourceTypes: Array<
    'lecture' | 'mindmap' | 'quiz' | 'reading' | 'code-lab' | 'project' | 'video-script'
  >;
  estimatedStudyTimeMinutes: number;
}

export interface KnowledgeLearningPath {
  title: string;
  summary: string;
  personalizedFor: string[];
  steps: KnowledgeLearningPathStep[];
}

export interface KnowledgeLearningPathStep {
  chapterId: string;
  chapterTitle: string;
  learningStage: 'foundation' | 'core' | 'practice';
  reason: string;
  recommendedResources: Array<
    'lecture' | 'mindmap' | 'quiz' | 'reading' | 'code-lab' | 'project' | 'video-script'
  >;
}
