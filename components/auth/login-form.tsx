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
    if (!password || password.length < 6) next.password = '密码至少 6 位';
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
    <div className="flex min-h-screen bg-[#ebf5ff]">
      {/* Left - decoration */}
      <div className="hidden lg:block w-1/2">
        <CharacterAnimation />
      </div>

      {/* Right - form */}
      <div className="relative flex w-full lg:w-1/2 items-center justify-center px-8 bg-white">
        <button
          onClick={() => router.push('/')}
          className="fixed left-6 top-6 z-10 flex items-center gap-1.5 rounded-full border border-[#cce7ff] bg-white/70 px-4 py-2 text-sm font-medium text-[#535862] backdrop-blur-sm transition-colors hover:border-[#0069e0] hover:text-[#0a0d12]"
        >
          <ArrowLeft className="size-4" />
          返回
        </button>

        <div className="w-full max-w-[380px]">
          <div
            className="rounded-[32px] bg-[#fafdff] p-10"
            style={{ boxShadow: 'rgba(4, 69, 144, 0.08) 0px 14px 20px 4px' }}
          >
            <h1 className="mb-2 text-[24px] font-medium leading-[1.2] -tracking-[0.02em] text-[#0a0d12]">
              欢迎回来
            </h1>
            <p className="mb-8 text-[14px] leading-[1.5] text-[#535862]">登录你的账号，继续学习</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-[14px] font-medium text-[#0a0d12]">邮箱</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="请输入邮箱"
                  className="w-full rounded-[16px] border border-[#cce7ff] bg-white px-4 py-3 text-[14px] text-[#0a0d12] placeholder:text-[#93979f] outline-none transition-colors focus:border-[#0069e0] focus:ring-2 focus:ring-[#0069e0]/10"
                />
                {errors.email && <p className="mt-1.5 text-[13px] text-red-500">{errors.email}</p>}
              </div>

              <div>
                <label className="mb-2 block text-[14px] font-medium text-[#0a0d12]">密码</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="w-full rounded-[16px] border border-[#cce7ff] bg-white px-4 py-3 pr-10 text-[14px] text-[#0a0d12] placeholder:text-[#93979f] outline-none transition-colors focus:border-[#0069e0] focus:ring-2 focus:ring-[#0069e0]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#93979f] hover:text-[#535862]"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 text-[13px] text-red-500">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-[32px] bg-[#181d27] py-3 text-[14px] font-medium text-white transition-all hover:bg-[#0a0d12] disabled:opacity-60"
                style={{ boxShadow: 'rgba(10, 13, 18, 0.08) 0px 1px 2px 0px, rgb(10, 13, 18) 0px 0px 0px 1px' }}
              >
                {isLoading ? <Loader2 className="mr-2 inline size-4 animate-spin" /> : null}
                登录
              </button>
            </form>

            <p className="mt-6 text-center text-[14px] text-[#535862]">
              还没有账号？
              <a href="/register" className="ml-1 font-medium text-[#0099ff] hover:underline">
                立即注册
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
