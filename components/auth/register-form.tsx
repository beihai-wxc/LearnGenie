'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/auth';
import { AuthDecoration } from './auth-decoration';

export function RegisterForm() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const next: Record<string, string> = {};
    if (!email.trim() || !email.includes('@')) next.email = '请输入有效的邮箱地址';
    if (!password || password.length < 6) next.password = '密码至少 6 位';
    if (password !== confirmPassword) next.confirmPassword = '两次密码输入不一致';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await register(email.trim(), password, nickname.trim() || undefined);
      toast.success('注册成功，请登录');
      router.push('/login');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '注册失败');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#ebf5ff]">
      {/* Left - decoration */}
      <div className="hidden lg:block w-1/2">
        <AuthDecoration />
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
          <div className="mb-10 text-center">
            <img src="/logo-horizontal.png" alt="LearnGenie" className="mx-auto h-7 w-auto" />
            <p className="mt-3 text-sm text-[#535862]">开启你的 AI 互动学习之旅</p>
          </div>

          <div
            className="rounded-[32px] bg-[#fafdff] p-10"
            style={{ boxShadow: 'rgba(4, 69, 144, 0.08) 0px 14px 20px 4px' }}
          >
            <h1 className="mb-2 text-[24px] font-medium leading-[1.2] -tracking-[0.02em] text-[#0a0d12]">
              创建账号
            </h1>
            <p className="mb-8 text-[14px] leading-[1.5] text-[#535862]">注册后即可使用全部功能</p>

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
                <label className="mb-2 block text-[14px] font-medium text-[#0a0d12]">昵称</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="给自己起个名字吧"
                  className="w-full rounded-[16px] border border-[#cce7ff] bg-white px-4 py-3 text-[14px] text-[#0a0d12] placeholder:text-[#93979f] outline-none transition-colors focus:border-[#0069e0] focus:ring-2 focus:ring-[#0069e0]/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-[14px] font-medium text-[#0a0d12]">密码</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="至少 6 位密码"
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

              <div>
                <label className="mb-2 block text-[14px] font-medium text-[#0a0d12]">确认密码</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="再次输入密码"
                    className="w-full rounded-[16px] border border-[#cce7ff] bg-white px-4 py-3 pr-10 text-[14px] text-[#0a0d12] placeholder:text-[#93979f] outline-none transition-colors focus:border-[#0069e0] focus:ring-2 focus:ring-[#0069e0]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#93979f] hover:text-[#535862]"
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1.5 text-[13px] text-red-500">{errors.confirmPassword}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-[32px] bg-[#181d27] py-3 text-[14px] font-medium text-white transition-all hover:bg-[#0a0d12] disabled:opacity-60"
                style={{ boxShadow: 'rgba(10, 13, 18, 0.08) 0px 1px 2px 0px, rgb(10, 13, 18) 0px 0px 0px 1px' }}
              >
                {isLoading ? <Loader2 className="mr-2 inline size-4 animate-spin" /> : null}
                注册
              </button>
            </form>

            <p className="mt-6 text-center text-[14px] text-[#535862]">
              已有账号？
              <a href="/login" className="ml-1 font-medium text-[#0099ff] hover:underline">
                立即登录
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
