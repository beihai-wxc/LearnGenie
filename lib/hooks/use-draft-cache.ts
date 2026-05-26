'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { getCurrentUserId } from '@/lib/utils/user-context';

interface UseDraftCacheOptions {
  key: string;
  debounceMs?: number;
}

interface UseDraftCacheReturn<T> {
  cachedValue: T | undefined;
  updateCache: (value: T) => void;
  clearCache: () => void;
}

function scopedKey(baseKey: string): string {
  const userId = getCurrentUserId();
  return userId ? `${baseKey}-${userId}` : baseKey;
}

export function useDraftCache<T>({
  key,
  debounceMs = 500,
}: UseDraftCacheOptions): UseDraftCacheReturn<T> {
  const [cachedValue] = useState<T | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    try {
      const raw = localStorage.getItem(scopedKey(key));
      if (raw !== null) {
        return JSON.parse(raw) as T;
      }
    } catch {
      /* ignore parse errors */
    }
    return undefined;
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingValueRef = useRef<T | undefined>(undefined);
  const keyRef = useRef(key);

  const resolveKey = useCallback(() => scopedKey(keyRef.current), []);

  useEffect(() => {
    keyRef.current = key;
  }, [key]);

  const flushPending = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pendingValueRef.current !== undefined) {
      try {
        localStorage.setItem(resolveKey(), JSON.stringify(pendingValueRef.current));
      } catch {
        /* ignore quota errors */
      }
      pendingValueRef.current = undefined;
    }
  }, [resolveKey]);

  const updateCache = useCallback(
    (value: T) => {
      pendingValueRef.current = value;
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        try {
          localStorage.setItem(resolveKey(), JSON.stringify(value));
        } catch {
          /* ignore quota errors */
        }
        pendingValueRef.current = undefined;
      }, debounceMs);
    },
    [debounceMs, resolveKey],
  );

  const clearCache = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pendingValueRef.current = undefined;
    try {
      localStorage.removeItem(resolveKey());
    } catch {
      /* ignore */
    }
  }, [resolveKey]);

  // Flush pending write on unmount
  useEffect(() => {
    return () => {
      flushPending();
    };
  }, [flushPending]);

  return { cachedValue, updateCache, clearCache };
}
