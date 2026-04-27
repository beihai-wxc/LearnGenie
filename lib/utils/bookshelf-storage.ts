/**
 * Bookshelf Storage Manager
 *
 * Manages user-uploaded documents and bookshelf categories in IndexedDB.
 * Works alongside stage-storage.ts which manages AI-generated classrooms.
 */

import { nanoid } from 'nanoid';
import { db, type BookshelfRecord as DBBookshelfRecord, type BookshelfCategoryRecord } from './database';
import { createLogger } from '@/lib/logger';

const log = createLogger('BookshelfStorage');

export type BookshelfRecord = DBBookshelfRecord;
export { BookshelfCategoryRecord };

// ==================== Document Operations ====================

export async function saveBookshelfItem(item: BookshelfRecord): Promise<void> {
  try {
    await db.bookshelf.put(item);
    log.info(`Saved bookshelf item: ${item.id}`);
  } catch (error) {
    log.error('Failed to save bookshelf item:', error);
    throw error;
  }
}

export async function deleteBookshelfItem(id: string): Promise<void> {
  try {
    const item = await db.bookshelf.get(id);
    if (!item) return;

    // Delete associated blob from imageFiles if it exists
    if (item.blobKey) {
      await db.imageFiles.where('id').equals(item.blobKey).delete();
    }

    await db.bookshelf.delete(id);
    log.info(`Deleted bookshelf item: ${id}`);
  } catch (error) {
    log.error('Failed to delete bookshelf item:', error);
    throw error;
  }
}

export async function updateBookshelfItem(id: string, updates: Partial<BookshelfRecord>): Promise<void> {
  try {
    await db.bookshelf.update(id, { ...updates, updatedAt: Date.now() });
    log.info(`Updated bookshelf item: ${id}`);
  } catch (error) {
    log.error('Failed to update bookshelf item:', error);
    throw error;
  }
}

export async function listBookshelfItems(type?: 'classroom' | 'document'): Promise<BookshelfRecord[]> {
  try {
    let query = db.bookshelf.orderBy('createdAt').reverse();
    if (type) {
      query = db.bookshelf.where('type').equals(type);
    }
    return query.toArray();
  } catch (error) {
    log.error('Failed to list bookshelf items:', error);
    return [];
  }
}

export async function getBookshelfItem(id: string): Promise<BookshelfRecord | undefined> {
  return db.bookshelf.get(id);
}

// ==================== Blob Operations ====================

export async function storeDocumentBlob(file: File): Promise<string> {
  const key = `doc:${nanoid()}`;
  try {
    await db.imageFiles.put({
      id: key,
      blob: file,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      createdAt: Date.now(),
    });
    log.info(`Stored document blob: ${key}`);
    return key;
  } catch (error) {
    log.error('Failed to store document blob:', error);
    throw error;
  }
}

export async function getDocumentBlob(key: string): Promise<Blob | undefined> {
  try {
    const record = await db.imageFiles.get(key);
    return record?.blob;
  } catch (error) {
    log.error('Failed to get document blob:', error);
    return undefined;
  }
}

export async function getDocumentUrl(key: string): Promise<string | undefined> {
  try {
    const blob = await getDocumentBlob(key);
    if (!blob) return undefined;
    return URL.createObjectURL(blob);
  } catch {
    return undefined;
  }
}

// ==================== Category Operations ====================

export async function listCategories(): Promise<BookshelfCategoryRecord[]> {
  try {
    return db.categories.orderBy('id').toArray();
  } catch (error) {
    log.error('Failed to list categories:', error);
    return [];
  }
}

export async function addCategory(name: string, color?: string): Promise<void> {
  try {
    await db.categories.put({
      id: name,
      name,
      color,
      createdAt: Date.now(),
    });
    log.info(`Added category: ${name}`);
  } catch (error) {
    log.error('Failed to add category:', error);
    throw error;
  }
}

export async function removeCategory(name: string): Promise<void> {
  try {
    await db.categories.delete(name);
    // Uncategorize all items that used this category
    await db.bookshelf.where('category').equals(name).modify({ category: '' });
    log.info(`Removed category: ${name}`);
  } catch (error) {
    log.error('Failed to remove category:', error);
    throw error;
  }
}

// ==================== Search ====================

export async function searchBookshelfItems(query: string): Promise<BookshelfRecord[]> {
  try {
    const allItems = await db.bookshelf.toArray();
    const lowerQuery = query.toLowerCase();
    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerQuery) ||
        (item.fileName && item.fileName.toLowerCase().includes(lowerQuery)) ||
        item.category.toLowerCase().includes(lowerQuery),
    );
  } catch (error) {
    log.error('Failed to search bookshelf items:', error);
    return [];
  }
}
