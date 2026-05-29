'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { useUserProfileStore, AVATAR_OPTIONS } from '@/lib/store/user-profile';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const initialized = useRef(false);
  const prevUserEmail = useRef<string | null>(null);

  useEffect(() => {
    if (!initialized.current && token) {
      initialized.current = true;
      fetchUser();
    }
  }, [token, fetchUser]);

  // Reset user-profile store when switching accounts (different email)
  useEffect(() => {
    const currentEmail = user?.email ?? null;
    if (prevUserEmail.current !== null && prevUserEmail.current !== currentEmail) {
      // Account changed — reset profile to defaults for the new user
      useUserProfileStore.setState({
        avatar: AVATAR_OPTIONS[0],
        nickname: '',
        bio: '',
        identity: '',
        conversationCount: 0,
        conversationHistory: [],
        updatedAt: 0,
      });
    }
    prevUserEmail.current = currentEmail;
  }, [user]);

  return <>{children}</>;
}
