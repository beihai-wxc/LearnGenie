'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/auth';
import { CharacterAnimation } from './character-animation';

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
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = '请输入有效的邮箱地址';
    if (!password || password.length < 6) next.password = '密码至少需要 6 个字符';
    if (password !== confirmPassword) next.confirmPassword = '两次输入的密码不一致';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await register(email.trim(), password, nickname.trim() || undefined);
      toast.success('注册成功');
      router.push('/login');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '注册失败');
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
          className="fixed left-6 top-6 z-10 flex items-center gap-1.5 rounded-xl bg-white/70 backdrop-blur-md px-4 py-2.5 text-sm font-semibold text-[#4a4a6a] border border-violet-100/40 shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-all duration-200 hover:bg-white/90 hover:border-violet-200/60"
        >
          <ArrowLeft className="size-4" />
          返回首页
        </button>

        {/* Mobile logo */}
        <div className="lg:hidden absolute top-6 left-1/2 -translate-x-1/2">
          <img src="/logo-horizontal.png" alt="LearnGenie" className="h-6 w-auto" />
        </div>

        <div className="w-full max-w-[420px]">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-[32px] font-bold leading-[1.15] -tracking-[0.025em] text-[#1a1a2e]">
              创建账号
            </h1>
            <p className="mt-2.5 text-[15px] leading-[1.6] text-[#6b6b80]">注册以解锁全部功能</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4.5">
            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[#3a3a50]">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-xl border border-violet-100/60 bg-white/80 backdrop-blur-sm px-4 py-3 text-[14px] text-[#1a1a2e] placeholder:text-[#a0a0b8] outline-none transition-all duration-200 focus:border-violet-300 focus:ring-3 focus:ring-violet-100/50 focus:bg-white"
              />
              {errors.email && <p className="mt-1.5 text-[12px] text-red-500 font-medium">{errors.email}</p>}
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[#3a3a50]">昵称</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="取一个昵称"
                className="w-full rounded-xl border border-violet-100/60 bg-white/80 backdrop-blur-sm px-4 py-3 text-[14px] text-[#1a1a2e] placeholder:text-[#a0a0b8] outline-none transition-all duration-200 focus:border-violet-300 focus:ring-3 focus:ring-violet-100/50 focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[#3a3a50]">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="至少 6 个字符"
                  className="w-full rounded-xl border border-violet-100/60 bg-white/80 backdrop-blur-sm px-4 py-3 pr-10 text-[14px] text-[#1a1a2e] placeholder:text-[#a0a0b8] outline-none transition-all duration-200 focus:border-violet-300 focus:ring-3 focus:ring-violet-100/50 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0a0b8] hover:text-[#6b6b80] transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-[12px] text-red-500 font-medium">{errors.password}</p>}
            </div>

            <div>
              <label className="mb-2 block text-[13px] font-semibold text-[#3a3a50]">确认密码</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入密码"
                  className="w-full rounded-xl border border-violet-100/60 bg-white/80 backdrop-blur-sm px-4 py-3 pr-10 text-[14px] text-[#1a1a2e] placeholder:text-[#a0a0b8] outline-none transition-all duration-200 focus:border-violet-300 focus:ring-3 focus:ring-violet-100/50 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0a0b8] hover:text-[#6b6b80] transition-colors p-1"
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1.5 text-[12px] text-red-500 font-medium">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-5 rounded-xl bg-gradient-to-r from-[#6c3bff] via-[#8b5cf6] to-[#a855f7] py-3.5 text-[14px] font-bold tracking-wide text-white shadow-[0_6px_20px_rgba(108,59,255,0.3)] transition-all duration-300 hover:shadow-[0_8px_24px_rgba(108,59,255,0.4)] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="inline size-4 animate-spin" /> : '注 册'}
            </button>
          </form>

          <p className="mt-7 text-center text-[14px] text-[#6b6b80]">
            已有账号？
            <a href="/login" className="ml-1.5 font-bold text-[#7c3aed] hover:text-[#6c3bff] transition-colors">
              立即登录
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}