/**
 * Wrong Questions Storage Manager
 *
 * Manages wrong-question collection records in IndexedDB.
 * Deduplicates by stageId + sceneId + questionId.
 */

import { nanoid } from 'nanoid';
import { db, type WrongQuestionRecord } from './database';
import { createLogger } from '@/lib/logger';

const log = createLogger('WrongQuestionsStorage');

export type { WrongQuestionRecord };

export interface SaveWrongQuestionInput {
  stageId: string;
  stageName: string;
  sceneId: string;
  sceneTitle: string;
  chapterNumber: number;
  chapterTitle?: string;
  questionId: string;
  questionSnapshot: WrongQuestionRecord['questionSnapshot'];
  lastUserAnswer: string | string[];
  lastResultStatus: 'correct' | 'incorrect';
  lastEarnedPoints: number;
  collectedReason: 'auto' | 'manual';
  originUrl: string;
}

/**
 * Save or update a wrong-question record.
 * If a record with the same stageId + sceneId + questionId already exists,
 * updates wrongCount and metadata instead of creating a duplicate.
 */
export async function saveWrongQuestion(input: SaveWrongQuestionInput): Promise<void> {
  try {
    const now = Date.now();

    const existing = await db.wrongQuestions
      .where({ stageId: input.stageId, sceneId: input.sceneId })
      .and((record) => record.questionId === input.questionId)
      .first();

    if (existing) {
      const updates: Partial<WrongQuestionRecord> = {
        lastUserAnswer: input.lastUserAnswer,
        lastResultStatus: input.lastResultStatus,
        lastEarnedPoints: input.lastEarnedPoints,
        wrongCount: (existing.wrongCount || 0) + 1,
        lastAnsweredAt: now,
        updatedAt: now,
      };
      // Preserve manual collection reason; auto does not override manual
      if (existing.collectedReason !== 'manual') {
        updates.collectedReason = input.collectedReason;
      }
      await db.wrongQuestions.update(existing.id, updates);
      log.info(`Updated wrong question: ${existing.id} (wrongCount: ${updates.wrongCount})`);
    } else {
      const record: WrongQuestionRecord = {
        id: nanoid(),
        ...input,
        wrongCount: 1,
        lastAnsweredAt: now,
        createdAt: now,
        updatedAt: now,
      };
      await db.wrongQuestions.put(record);
      log.info(`Created wrong question: ${record.id}`);
    }
  } catch (error) {
    log.error('Failed to save wrong question:', error);
    throw error;
  }
}

/**
 * Delete a wrong-question record by id.
 */
export async function deleteWrongQuestion(id: string): Promise<void> {
  try {
    await db.wrongQuestions.delete(id);
    log.info(`Deleted wrong question: ${id}`);
  } catch (error) {
    log.error('Failed to delete wrong question:', error);
    throw error;
  }
}

/**
 * List all wrong-question records, ordered by most recent first.
 */
export async function listWrongQuestions(): Promise<WrongQuestionRecord[]> {
  try {
    return db.wrongQuestions.orderBy('createdAt').reverse().toArray();
  } catch (error) {
    log.error('Failed to list wrong questions:', error);
    return [];
  }
}

/**
 * Get wrong questions grouped by chapterNumber.
 */
export async function getWrongQuestionsByChapter(): Promise<
  Map<number, WrongQuestionRecord[]>
> {
  const records = await listWrongQuestions();
  const map = new Map<number, WrongQuestionRecord[]>();
  for (const record of records) {
    const list = map.get(record.chapterNumber);
    if (list) {
      list.push(record);
    } else {
      map.set(record.chapterNumber, [record]);
    }
  }
  return map;
}

/**
 * Check if a question is already collected.
 */
export async function isQuestionCollected(
  stageId: string,
  sceneId: string,
  questionId: string,
): Promise<boolean> {
  try {
    const record = await db.wrongQuestions
      .where({ stageId, sceneId })
      .and((r) => r.questionId === questionId)
      .first();
    return !!record;
  } catch {
    return false;
  }
}

/**
 * Get the collection record for a specific question, if it exists.
 */
export async function getWrongQuestionByKey(
  stageId: string,
  sceneId: string,
  questionId: string,
): Promise<WrongQuestionRecord | undefined> {
  try {
    return db.wrongQuestions
      .where({ stageId, sceneId })
      .and((r) => r.questionId === questionId)
      .first();
  } catch {
    return undefined;
  }
}

/**
 * Remove a collection by its unique key (stageId + sceneId + questionId).
 */
export async function deleteWrongQuestionByKey(
  stageId: string,
  sceneId: string,
  questionId: string,
): Promise<void> {
  try {
    const record = await db.wrongQuestions
      .where({ stageId, sceneId })
      .and((r) => r.questionId === questionId)
      .first();
    if (record) {
      await db.wrongQuestions.delete(record.id);
      log.info(`Deleted wrong question by key: ${record.id}`);
    }
  } catch (error) {
    log.error('Failed to delete wrong question by key:', error);
  }
}
