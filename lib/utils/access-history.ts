/**
 * Access History Manager
 *
 * Records all user visits to classrooms, knowledge docs, and uploaded documents.
 * Provides unified history tracking with access counts and timestamps.
 * All queries are scoped to the current authenticated user via userId.
 */

import { nanoid } from 'nanoid';
import { db } from './database';
import type { AccessHistoryRecord } from './database';
import { getCurrentUserId } from './user-context';
import { createLogger } from '@/lib/logger';

const log = createLogger('AccessHistory');

export type { AccessHistoryRecord };
export type AccessHistoryType = AccessHistoryRecord['type'];

export interface AccessHistoryInput {
  type: AccessHistoryType;
  targetId: string;
  title: string;
  subtitle?: string;
  url: string;
  thumbnailUrl?: string;
}

function requireUserId(): string {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('User not authenticated');
  return userId;
}

/**
 * Save a new access history record.
 * If a record with the same (type, targetId) already exists, it will be updated
 * instead of creating a duplicate.
 */
export async function saveAccessHistory(input: AccessHistoryInput): Promise<void> {
  const userId = requireUserId();
  try {
    const now = Date.now();

    // Check for existing record by userId + type + targetId
    const existing = await db.accessHistory
      .where({ userId, type: input.type, targetId: input.targetId })
      .first();

    if (existing) {
      await db.accessHistory.update(existing.id, {
        title: input.title,
        subtitle: input.subtitle,
        url: input.url,
        thumbnailUrl: input.thumbnailUrl,
        updatedAt: now,
        accessCount: (existing.accessCount || 0) + 1,
      });
      log.info(`Updated access history: ${input.type}/${input.targetId}`);
    } else {
      const record: AccessHistoryRecord = {
        id: nanoid(),
        userId,
        ...input,
        createdAt: now,
        updatedAt: now,
        accessCount: 1,
      };
      await db.accessHistory.put(record);
      log.info(`Created access history: ${input.type}/${input.targetId}`);
    }
  } catch (error) {
    log.error('Failed to save access history:', error);
    throw error;
  }
}

/**
 * Touch (update last access time) an existing history record.
 * Creates a new record if one does not exist (requires title and url).
 */
export async function touchAccessHistory(
  type: AccessHistoryType,
  targetId: string,
  title?: string,
  url?: string,
  subtitle?: string,
): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId) return;

  try {
    const existing = await db.accessHistory
      .where({ userId, type, targetId })
      .first();

    if (existing) {
      await db.accessHistory.update(existing.id, {
        updatedAt: Date.now(),
        accessCount: (existing.accessCount || 0) + 1,
      });
    } else if (title && url) {
      await saveAccessHistory({ type, targetId, title, url, subtitle });
    } else {
      log.warn(`Cannot touch non-existent history without title/url: ${type}/${targetId}`);
    }
  } catch (error) {
    log.error('Failed to touch access history:', error);
  }
}

/**
 * List access history records, ordered by most recent access.
 */
export async function listAccessHistory(
  type?: AccessHistoryType,
  limit = 100,
): Promise<AccessHistoryRecord[]> {
  const userId = getCurrentUserId();
  if (!userId) return [];

  try {
    let collection = db.accessHistory.where('userId').equals(userId);
    if (type) {
      collection = collection.and((r) => r.type === type);
    }
    return collection.reverse().sortBy('updatedAt').then((arr) => arr.slice(0, limit));
  } catch (error) {
    log.error('Failed to list access history:', error);
    return [];
  }
}

/**
 * Get a single access history record by its own id.
 */
export async function getAccessHistory(id: string): Promise<AccessHistoryRecord | undefined> {
  const userId = getCurrentUserId();
  const record = await db.accessHistory.get(id);
  if (record && userId && record.userId && record.userId !== userId) return undefined;
  return record;
}

/**
 * Get a single access history record by type + targetId.
 */
export async function getAccessHistoryByTarget(
  type: AccessHistoryType,
  targetId: string,
): Promise<AccessHistoryRecord | undefined> {
  const userId = getCurrentUserId();
  if (!userId) return undefined;

  return db.accessHistory.where({ userId, type, targetId }).first();
}

/**
 * Delete a single access history record.
 */
export async function deleteAccessHistory(id: string): Promise<void> {
  const userId = getCurrentUserId();
  try {
    if (userId) {
      const record = await db.accessHistory.get(id);
      if (record && record.userId && record.userId !== userId) return;
    }
    await db.accessHistory.delete(id);
    log.info(`Deleted access history: ${id}`);
  } catch (error) {
    log.error('Failed to delete access history:', error);
    throw error;
  }
}

/**
 * Clear all access history, optionally filtered by type.
 */
export async function clearAccessHistory(type?: AccessHistoryType): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId) return;

  try {
    const collection = db.accessHistory.where('userId').equals(userId);
    if (type) {
      const ids = await collection.and((r) => r.type === type).primaryKeys();
      await db.accessHistory.bulkDelete(ids);
      log.info(`Cleared access history for type: ${type}`);
    } else {
      const ids = await collection.primaryKeys();
      await db.accessHistory.bulkDelete(ids);
      log.info('Cleared all access history for current user');
    }
  } catch (error) {
    log.error('Failed to clear access history:', error);
    throw error;
  }
}

/**
 * Migrate existing stages into access history (backward compatibility).
 * Call once at app startup or when bookshelf is first loaded.
 */
export async function migrateStagesToAccessHistory(): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId) return;

  try {
    const stages = await db.stages.where('userId').equals(userId).toArray();
    for (const stage of stages) {
      const existing = await getAccessHistoryByTarget('classroom', stage.id);
      if (!existing) {
        await saveAccessHistory({
          type: 'classroom',
          targetId: stage.id,
          title: stage.name || '未命名课堂',
          url: `/classroom/${stage.id}`,
        });
      }
    }
    log.info(`Migrated ${stages.length} stages to access history`);
  } catch (error) {
    log.error('Failed to migrate stages to access history:', error);
  }
}
