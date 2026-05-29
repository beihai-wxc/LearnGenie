/**
 * User context helper — provides the current authenticated user's ID
 * for scoping IndexedDB queries to the active account.
 */

import { useAuthStore } from '@/lib/store/auth';

export function getCurrentUserId(): string | null {
  return useAuthStore.getState().user?.email ?? null;
}
