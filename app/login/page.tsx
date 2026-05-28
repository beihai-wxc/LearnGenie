'use client';

import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f5f0ff] via-[#f0f0ff] to-[#fff0f5]">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 animate-spin rounded-full border-2 border-[#7c3aed] border-t-transparent" />
            <p className="text-sm font-medium text-[#6b6b80]">加载中...</p>
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
