/**
 * 课堂收藏存储 — 使用 IndexedDB bookshelf 表
 * All queries are scoped to the current authenticated user via userId.
 */

import { nanoid } from 'nanoid';
import { db, type BookshelfRecord } from '@/lib/utils/database';
import { getCurrentUserId } from '@/lib/utils/user-context';
import { createLogger } from '@/lib/logger';

const log = createLogger('BookshelfFavorites');
const DEFAULT_GROUP = '我的收藏';

export interface FavoriteItem {
  id: string;
  stageId: string;
  stageName: string;
  group: string;
  createdAt: number;
}

function requireUserId(): string {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('User not authenticated');
  return userId;
}

export async function getFavorites(): Promise<FavoriteItem[]> {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const records = await db.bookshelf
    .where({ userId, type: 'classroom' as const })
    .toArray();
  return records.map((r) => ({
    id: r.id,
    stageId: r.stageId || '',
    stageName: r.title,
    group: r.category || DEFAULT_GROUP,
    createdAt: r.createdAt,
  }));
}

export async function getFavoriteByStageId(stageId: string): Promise<FavoriteItem | undefined> {
  const userId = getCurrentUserId();
  if (!userId) return undefined;

  const records = await db.bookshelf
    .where({ userId, type: 'classroom' as const })
    .toArray();
  return records
    .filter((r) => r.stageId === stageId)
    .map((r) => ({
      id: r.id,
      stageId: r.stageId || '',
      stageName: r.title,
      group: r.category || DEFAULT_GROUP,
      createdAt: r.createdAt,
    }))[0];
}

export async function addFavorite(stageId: string, stageName: string, group?: string): Promise<void> {
  const userId = requireUserId();
  const existing = await getFavoriteByStageId(stageId);
  if (existing) return;
  const now = Date.now();
  const record: BookshelfRecord = {
    id: nanoid(),
    userId,
    title: stageName,
    type: 'classroom',
    stageId,
    category: group || DEFAULT_GROUP,
    createdAt: now,
    updatedAt: now,
  };
  await db.bookshelf.put(record);
}

export async function removeFavorite(stageId: string): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId) return;

  const records = await db.bookshelf
    .where({ userId, type: 'classroom' as const })
    .toArray();
  const found = records.find((r) => r.stageId === stageId);
  if (found) {
    await db.bookshelf.delete(found.id);
  }
}

export async function isFavorited(stageId: string): Promise<boolean> {
  const fav = await getFavoriteByStageId(stageId);
  return !!fav;
}

export async function changeFavoriteGroup(stageId: string, newGroup: string): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId) return;

  const records = await db.bookshelf
    .where({ userId, type: 'classroom' as const })
    .toArray();
  const found = records.find((r) => r.stageId === stageId);
  if (found) {
    found.category = newGroup;
    found.updatedAt = Date.now();
    await db.bookshelf.put(found);
  }
}

export async function getGroups(): Promise<string[]> {
  const userId = getCurrentUserId();
  if (!userId) return [];

  const cats = await db.categories.where('userId').equals(userId).sortBy('id');
  const names = cats.map((c) => c.name);
  if (!names.includes(DEFAULT_GROUP)) {
    names.unshift(DEFAULT_GROUP);
  }
  return names;
}

export async function ensureDefaultGroup(): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId) return;

  const existing = await db.categories.get(DEFAULT_GROUP);
  if (!existing) {
    await db.categories.put({
      id: DEFAULT_GROUP,
      userId,
      name: DEFAULT_GROUP,
      createdAt: Date.now(),
    });
  }
}

export async function addGroup(name: string): Promise<void> {
  const userId = requireUserId();
  const exists = await db.categories.get(name);
  if (!exists) {
    await db.categories.put({
      id: name,
      userId,
      name,
      createdAt: Date.now(),
    });
  }
}

export async function deleteGroup(name: string): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId) return;

  // Delete the category record
  await db.categories.delete(name);

  // Delete all favorites that belong to this group
  const records = await db.bookshelf
    .where({ userId, type: 'classroom' as const })
    .toArray();
  const toDelete = records.filter((r) => r.category === name);
  if (toDelete.length > 0) {
    await db.bookshelf.bulkDelete(toDelete.map((r) => r.id));
  }
}
