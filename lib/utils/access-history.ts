/**
 * Access History Manager
 *
 * Records all user visits to classrooms, knowledge docs, and uploaded documents.
 * Provides unified history tracking with access counts and timestamps.
 */

import { nanoid } from 'nanoid';
import { db } from './database';
import type { AccessHistoryRecord } from './database';
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

/**
 * Save a new access history record.
 * If a record with the same (type, targetId) already exists, it will be updated
 * instead of creating a duplicate.
 */
export async function saveAccessHistory(input: AccessHistoryInput): Promise<void> {
  try {
    const now = Date.now();

    // Check for existing record by type + targetId
    const existing = await db.accessHistory
      .where({ type: input.type, targetId: input.targetId })
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
  try {
    const existing = await db.accessHistory
      .where({ type, targetId })
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
  try {
    let query = db.accessHistory.orderBy('updatedAt').reverse();
    if (type) {
      query = db.accessHistory.where('type').equals(type).reverse();
    }
    return query.limit(limit).toArray();
  } catch (error) {
    log.error('Failed to list access history:', error);
    return [];
  }
}

/**
 * Get a single access history record by its own id.
 */
export async function getAccessHistory(id: string): Promise<AccessHistoryRecord | undefined> {
  return db.accessHistory.get(id);
}

/**
 * Get a single access history record by type + targetId.
 */
export async function getAccessHistoryByTarget(
  type: AccessHistoryType,
  targetId: string,
): Promise<AccessHistoryRecord | undefined> {
  return db.accessHistory.where({ type, targetId }).first();
}

/**
 * Delete a single access history record.
 */
export async function deleteAccessHistory(id: string): Promise<void> {
  try {
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
  try {
    if (type) {
      const ids = await db.accessHistory.where('type').equals(type).primaryKeys();
      await db.accessHistory.bulkDelete(ids);
      log.info(`Cleared access history for type: ${type}`);
    } else {
      await db.accessHistory.clear();
      log.info('Cleared all access history');
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
  try {
    const stages = await db.stages.toArray();
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
