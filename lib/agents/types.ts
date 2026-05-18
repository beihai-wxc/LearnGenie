import type {
  InjectedKnowledgeContext,
  KnowledgeLearningPath,
  KnowledgeSearchProfileContext,
  KnowledgeSearchResult,
} from '@/lib/knowledge-base/types';
import type { StudentProfileDimensions } from '@/lib/types/student-profile';

export type AgentWorkflowStage =
  | 'profile'
  | 'retrieval'
  | 'planning'
  | 'resource-generation'
  | 'review'
  | 'evaluation';

export type AgentNextAction =
  | 'show_recommendations'
  | 'generate_classroom'
  | 'review_sources'
  | 'continue_learning'
  | 'collect_feedback';

export interface AgentSourceReference {
  docId: string;
  title: string;
  chunkId?: string;
  excerpt?: string;
}

export interface AgentStageResultEnvelope<T> {
  success: boolean;
  stage: AgentWorkflowStage;
  confidence: number;
  warnings: string[];
  sources: AgentSourceReference[];
  nextAction?: AgentNextAction;
  data: T;
}

export interface LearnerProfileSnapshot {
  nickname?: string;
  bio?: string;
  dimensions: StudentProfileDimensions;
  inferredFromDialogue: Array<keyof StudentProfileDimensions>;
  summaryLines: string[];
}

export interface RetrievalAgentData {
  matched: boolean;
  query: string;
  profileContext: KnowledgeSearchProfileContext;
  results: KnowledgeSearchResult[];
  bestMatch: KnowledgeSearchResult | null;
  autoContext: InjectedKnowledgeContext | null;
  recommendedPath: KnowledgeLearningPath | null;
  safetyNote?: string;
}

export interface PathPlanningAgentData {
  title: string;
  summary: string;
  nextActionLabel: string;
  recommendedPath: KnowledgeLearningPath | null;
}

export type AgentResourceType =
  | 'lecture'
  | 'quiz'
  | 'mindmap'
  | 'reading'
  | 'code-lab'
  | 'project'
  | 'video-script';

export interface ResourceBundleItem {
  type: AgentResourceType;
  title: string;
  summary: string;
  promptSeed: string;
  basedOn: string[];
  status: 'ready' | 'partial';
}

export interface ResourceBundleData {
  items: ResourceBundleItem[];
  supportedTypes: AgentResourceType[];
}

export interface ReviewAgentData {
  approved: boolean;
  confidenceLabel: 'low' | 'medium' | 'high';
  supportedClaims: string[];
  unsupportedClaims: string[];
  summary: string;
}

export interface EvaluationAgentInput {
  viewedResourceTypes?: AgentResourceType[];
  completedQuiz?: boolean;
  selfReportedUnderstanding?: 'low' | 'medium' | 'high';
  freeformFeedback?: string;
}

export interface EvaluationAgentData {
  masteryEstimate: number;
  weakTopics: string[];
  recommendedActions: string[];
  profileUpdates: Partial<StudentProfileDimensions>;
}

export interface AgentWorkflowSnapshot {
  query: string;
  mode: 'topic' | 'upload';
  profile: AgentStageResultEnvelope<LearnerProfileSnapshot>;
  retrieval: AgentStageResultEnvelope<RetrievalAgentData>;
  planning: AgentStageResultEnvelope<PathPlanningAgentData>;
  resources: AgentStageResultEnvelope<ResourceBundleData>;
  review: AgentStageResultEnvelope<ReviewAgentData>;
}

