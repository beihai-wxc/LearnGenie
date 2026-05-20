'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/auth';

export function RegisterForm() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [phone, setPhone] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (!phone.trim() || phone.trim().length < 5) {
      next.phone = '请输入有效的手机号（至少 5 位）';
    }
    if (!password || password.length < 6) {
      next.password = '密码至少 6 位';
    }
    if (password !== confirmPassword) {
      next.confirmPassword = '两次密码输入不一致';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await register(phone.trim(), password, nickname.trim() || undefined);
      toast.success('注册成功，请登录');
      router.push('/login');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '注册失败');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#ebf5ff] px-4">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 size-96 rounded-full bg-[#d3f6e3] opacity-50 blur-3xl" />
        <div className="absolute -left-24 bottom-0 size-80 rounded-full bg-[#f1e6ff] opacity-50 blur-3xl" />
        <div className="absolute left-1/2 top-1/4 size-56 -translate-x-1/2 rounded-full bg-[#fff9e0] opacity-40 blur-3xl" />
      </div>

      {/* Back button */}
      <button
        onClick={() => {
          if (window.history.length > 1) router.back();
          else router.push('/');
        }}
        className="fixed left-6 top-6 z-10 flex items-center gap-1.5 rounded-full border border-[#cce7ff] bg-white/70 px-4 py-2 text-sm font-medium text-[#535862] backdrop-blur-sm transition-colors hover:border-[#0069e0] hover:text-[#0a0d12]"
      >
        <ArrowLeft className="size-4" />
        返回
      </button>

      <div className="relative z-10 w-full max-w-[420px]">
        {/* Logo + tagline */}
        <div className="mb-10 text-center">
          <img
            src="/logo-horizontal.png"
            alt="LearnGenie"
            className="mx-auto h-7 w-auto"
          />
          <p className="mt-3 text-sm text-[#535862]">
            开启你的 AI 互动学习之旅
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-[32px] bg-[#fafdff] p-10"
          style={{ boxShadow: 'rgba(4, 69, 144, 0.08) 0px 14px 20px 4px' }}
        >
          <h1 className="mb-2 text-[24px] font-medium leading-[1.2] -tracking-[0.02em] text-[#0a0d12]">
            创建账号
          </h1>
          <p className="mb-8 text-[14px] leading-[1.5] text-[#535862]">
            注册后即可使用全部功能
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Phone */}
            <div>
              <label className="mb-2 block text-[14px] font-medium text-[#0a0d12]">
                手机号
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入手机号"
                className="w-full rounded-[16px] border border-[#cce7ff] bg-white px-4 py-3 text-[14px] text-[#0a0d12] placeholder:text-[#93979f] outline-none transition-colors focus:border-[#0069e0] focus:ring-2 focus:ring-[#0069e0]/10"
              />
              {errors.phone && (
                <p className="mt-1.5 text-[13px] text-red-500">{errors.phone}</p>
              )}
            </div>

            {/* Nickname */}
            <div>
              <label className="mb-2 block text-[14px] font-medium text-[#0a0d12]">
                昵称
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="给自己起个名字吧"
                className="w-full rounded-[16px] border border-[#cce7ff] bg-white px-4 py-3 text-[14px] text-[#0a0d12] placeholder:text-[#93979f] outline-none transition-colors focus:border-[#0069e0] focus:ring-2 focus:ring-[#0069e0]/10"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-[14px] font-medium text-[#0a0d12]">
                密码
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="至少 6 位密码"
                className="w-full rounded-[16px] border border-[#cce7ff] bg-white px-4 py-3 text-[14px] text-[#0a0d12] placeholder:text-[#93979f] outline-none transition-colors focus:border-[#0069e0] focus:ring-2 focus:ring-[#0069e0]/10"
              />
              {errors.password && (
                <p className="mt-1.5 text-[13px] text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="mb-2 block text-[14px] font-medium text-[#0a0d12]">
                确认密码
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入密码"
                className="w-full rounded-[16px] border border-[#cce7ff] bg-white px-4 py-3 text-[14px] text-[#0a0d12] placeholder:text-[#93979f] outline-none transition-colors focus:border-[#0069e0] focus:ring-2 focus:ring-[#0069e0]/10"
              />
              {errors.confirmPassword && (
                <p className="mt-1.5 text-[13px] text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-[32px] bg-[#181d27] py-3 text-[14px] font-medium text-white transition-all hover:bg-[#0a0d12] disabled:opacity-60"
              style={{ boxShadow: 'rgba(10, 13, 18, 0.08) 0px 1px 2px 0px, rgb(10, 13, 18) 0px 0px 0px 1px' }}
            >
              {isLoading ? (
                <Loader2 className="mr-2 inline size-4 animate-spin" />
              ) : null}
              注册
            </button>
          </form>

          <p className="mt-6 text-center text-[14px] text-[#535862]">
            已有账号？
            <a
              href="/login"
              className="ml-1 font-medium text-[#0099ff] hover:underline"
            >
              立即登录
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
