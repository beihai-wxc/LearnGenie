/**
 * Student Learning Profile Types
 *
 * Defines the 8 dimensions of the conversational student profile system.
 * Each dimension captures a specific aspect of the student's learning characteristics.
 */

export type CognitiveStyleType =
  | 'visual'
  | 'textual'
  | 'sequential'
  | 'global'
  | 'analytical'
  | 'intuitive'
  | 'unknown';

export type LearningPaceType = 'slow' | 'medium' | 'fast' | 'unknown';

export type MetaCognitiveStrategyType =
  | 'self-checking'
  | 'direct-answer'
  | 'independent-exploration'
  | 'mixed'
  | 'unknown';

export type EmotionalMotivationType =
  | 'intrinsic'
  | 'extrinsic'
  | 'social'
  | 'achievement'
  | 'mixed'
  | 'unknown';

export type InteractionPreferenceType =
  | 'brief'
  | 'detailed'
  | 'with-code'
  | 'with-analogy'
  | 'with-example'
  | 'mixed'
  | 'unknown';

export interface DimensionBase {
  score: number;
  description: string;
  updatedAt: number;
}

export interface KnowledgeFoundation extends DimensionBase {
  keywords: string[];
}

export interface CognitiveStyle extends DimensionBase {
  style: CognitiveStyleType;
  keywords: string[];
}

export interface ErrorPronePatterns extends DimensionBase {
  patterns: string[];
}

export interface LearningPace extends DimensionBase {
  paceLevel: LearningPaceType;
}

export interface InterestDirection extends DimensionBase {
  areas: string[];
}

export interface MetaCognitiveStrategy extends DimensionBase {
  strategy: MetaCognitiveStrategyType;
}

export interface EmotionalMotivation extends DimensionBase {
  motivation: EmotionalMotivationType;
}

export interface InteractionPreference extends DimensionBase {
  preference: InteractionPreferenceType;
}

export interface StudentProfileDimensions {
  knowledgeFoundation: KnowledgeFoundation;
  cognitiveStyle: CognitiveStyle;
  errorPronePatterns: ErrorPronePatterns;
  learningPace: LearningPace;
  interestDirection: InterestDirection;
  metaCognitiveStrategy: MetaCognitiveStrategy;
  emotionalMotivation: EmotionalMotivation;
  interactionPreference: InteractionPreference;
}

/**
 * Learning summary — tracks the user's learning journey.
 * Patterned after DeepTutor's SUMMARY.md sections.
 */
export interface LearningSummary {
  currentFocus: string;
  accomplishments: string;
  openQuestions: string;
  updatedAt: number;
}

export function createDefaultLearningSummary(): LearningSummary {
  return {
    currentFocus: '',
    accomplishments: '',
    openQuestions: '',
    updatedAt: Date.now(),
  };
}

export type DimensionKey = keyof StudentProfileDimensions;

export interface ProfileExtractionResult {
  profile: StudentProfileDimensions;
  updatedFields: DimensionKey[];
}

export interface ProfileConversationEntry {
  id: string;
  role: 'user' | 'system';
  content: string;
  timestamp: number;
}

export interface ProfileHistorySnapshot {
  dimensions: StudentProfileDimensions;
  conversationCount: number;
  updatedAt: number;
}

export function createDefaultProfileDimensions(): StudentProfileDimensions {
  const baseScore = 0;
  const baseDesc = '暂无数据，请通过对话构建画像';
  const now = Date.now();

  return {
    knowledgeFoundation: { score: baseScore, description: baseDesc, keywords: [], updatedAt: now },
    cognitiveStyle: { score: baseScore, description: baseDesc, style: 'unknown', keywords: [], updatedAt: now },
    errorPronePatterns: { score: baseScore, description: baseDesc, patterns: [], updatedAt: now },
    learningPace: { score: baseScore, description: baseDesc, paceLevel: 'unknown', updatedAt: now },
    interestDirection: { score: baseScore, description: baseDesc, areas: [], updatedAt: now },
    metaCognitiveStrategy: { score: baseScore, description: baseDesc, strategy: 'unknown', updatedAt: now },
    emotionalMotivation: { score: baseScore, description: baseDesc, motivation: 'unknown', updatedAt: now },
    interactionPreference: { score: baseScore, description: baseDesc, preference: 'unknown', updatedAt: now },
  };
}

export function mergeProfileDimensions(
  existing: StudentProfileDimensions,
  incoming: Partial<StudentProfileDimensions>,
): StudentProfileDimensions {
  const updated = { ...existing } as unknown as Record<string, Record<string, unknown>>;
  const now = Date.now();

  type DimKey = keyof StudentProfileDimensions;
  const keys = Object.keys(incoming) as DimKey[];

  for (const key of keys) {
    const incomingDim = incoming[key];
    if (!incomingDim) continue;

    const incomingRec = incomingDim as unknown as Record<string, unknown>;
    const existingDim = updated[key] || {};
    const merged: Record<string, unknown> = {
      ...existingDim,
      ...incomingRec,
      updatedAt: now,
    };

    if (key === 'knowledgeFoundation' || key === 'cognitiveStyle') {
      const existingKw = (existingDim.keywords as string[] | undefined) ?? [];
      const newKw = (incomingRec.keywords as string[] | undefined) ?? [];
      if (newKw.length > 0) {
        merged.keywords = [...new Set([...existingKw, ...newKw])];
      }
    }

    if (key === 'errorPronePatterns') {
      const existingP = (existingDim.patterns as string[] | undefined) ?? [];
      const newP = (incomingRec.patterns as string[] | undefined) ?? [];
      if (newP.length > 0) {
        merged.patterns = [...new Set([...existingP, ...newP])];
      }
    }

    if (key === 'interestDirection') {
      const existingA = (existingDim.areas as string[] | undefined) ?? [];
      const newA = (incomingRec.areas as string[] | undefined) ?? [];
      if (newA.length > 0) {
        merged.areas = [...new Set([...existingA, ...newA])];
      }
    }

    updated[key] = merged;
  }

  return updated as unknown as StudentProfileDimensions;
}
