'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store/auth';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const state = useAuthStore.getState();
    
    // 如果未认证，直接跳转
    if (!state.isAuthenticated) {
      router.replace('/login');
      return;
    }

    // 已认证但需要验证 token 有效性
    if (state.token) {
      fetchUser();
    }
  }, [fetchUser, router]);

  // 等待首次检查完成
  useEffect(() => {
    if (!hasChecked.current) return;
    
    // 如果检查后发现未认证，跳转
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f5f0ff] via-[#f0f0ff] to-[#fff0f5]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-[#7c3aed] border-t-transparent" />
          <p className="text-sm font-medium text-[#6b6b80]">加载中...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
