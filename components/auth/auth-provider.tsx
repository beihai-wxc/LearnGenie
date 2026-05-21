'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current && token) {
      initialized.current = true;
      fetchUser();
    }
  }, [token, fetchUser]);

  return <>{children}</>;
}
