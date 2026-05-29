'use client';

import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/auth';
import { CharacterAnimation } from './character-animation';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const next: typeof errors = {};
    if (!email.trim() || !email.includes('@')) next.email = '请输入有效的邮箱地址';
    if (!password || password.length < 6) next.password = '密码至少需要 6 个字符';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await login(email.trim(), password);
      toast.success('登录成功');
      const redirect = searchParams.get('redirect') || '/generate';
      router.replace(redirect);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '登录失败');
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#f5f0ff] via-[#f0f0ff] to-[#fff0f5]">
      {/* Left - animated illustration */}
      <div className="hidden lg:block w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-[15%] top-[10%] w-80 h-80 rounded-full bg-gradient-to-br from-violet-200/30 to-fuchsia-200/20 blur-3xl" style={{ animation: 'float-orb 12s ease-in-out infinite' }} />
          <div className="absolute right-[20%] bottom-[15%] w-64 h-64 rounded-full bg-gradient-to-br from-amber-200/20 to-orange-200/15 blur-3xl" style={{ animation: 'float-orb 15s ease-in-out infinite 3s' }} />
          <div className="absolute left-[40%] top-[50%] w-48 h-48 rounded-full bg-gradient-to-br from-indigo-200/20 to-violet-200/15 blur-3xl" style={{ animation: 'float-orb 10s ease-in-out infinite 1s' }} />
        </div>
        <CharacterAnimation />
      </div>

      {/* Right - form */}
      <div className="relative flex w-full lg:w-1/2 items-center justify-center px-6">
        <button
          onClick={() => router.push('/')}
          className="fixed left-6 top-6 z-10 flex items-center gap-2 rounded-xl bg-white/70 backdrop-blur-md px-5 py-3 text-[14px] font-semibold text-[#4a4a6a] border border-violet-100/40 shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-all duration-200 hover:bg-white/90 hover:border-violet-200/60"
        >
          <ArrowLeft className="size-4.5" />
          返回首页
        </button>

        {/* Mobile logo */}
        <div className="lg:hidden absolute top-6 left-1/2 -translate-x-1/2">
          <img src="/logo-horizontal.png" alt="LearnGenie" className="h-8 w-auto" />
        </div>

        <div className="w-full max-w-[500px]">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-[40px] font-bold leading-[1.15] -tracking-[0.025em] text-[#1a1a2e]">
              欢迎回来
            </h1>
            <p className="mt-3.5 text-[18px] leading-[1.6] text-[#6b6b80]">登录以继续你的学习之旅</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-2.5 block text-[16px] font-semibold text-[#3a3a50]">邮箱 (测试邮箱:test@example.com)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入邮箱地址"
                className="w-full rounded-2xl border border-violet-100/60 bg-white/80 backdrop-blur-sm px-5 py-4 text-[16px] text-[#1a1a2e] placeholder:text-[#a0a0b8] outline-none transition-all duration-200 focus:border-violet-300 focus:ring-3 focus:ring-violet-100/50 focus:bg-white"
              />
              {errors.email && <p className="mt-2 text-[14px] text-red-500 font-medium">{errors.email}</p>}
            </div>

            <div>
              <label className="mb-2.5 block text-[16px] font-semibold text-[#3a3a50]">密码 (测试密码:123456)</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full rounded-2xl border border-violet-100/60 bg-white/80 backdrop-blur-sm px-5 py-4 pr-12 text-[16px] text-[#1a1a2e] placeholder:text-[#a0a0b8] outline-none transition-all duration-200 focus:border-violet-300 focus:ring-3 focus:ring-violet-100/50 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#a0a0b8] hover:text-[#6b6b80] transition-colors p-1.5"
                >
                  {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-2 text-[14px] text-red-500 font-medium">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-2xl bg-gradient-to-r from-[#6c3bff] via-[#8b5cf6] to-[#a855f7] py-4.5 text-[16px] font-bold tracking-wide text-white shadow-[0_6px_20px_rgba(108,59,255,0.3)] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(108,59,255,0.4)] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="inline size-5 animate-spin" /> : '登 录'}
            </button>
          </form>

          <p className="mt-8 text-center text-[16px] text-[#6b6b80]">
            还没有账号？
            <a href="/register" className="ml-1.5 font-bold text-[#7c3aed] hover:text-[#6c3bff] transition-colors">
              立即注册
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
