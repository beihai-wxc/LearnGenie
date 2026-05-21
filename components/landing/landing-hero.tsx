'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

export function LandingHero() {
  const router = useRouter();

  return (
    <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden bg-[#ebf5ff] px-4 pt-16">
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 size-[500px] rounded-full bg-[#f4ebff] opacity-50 blur-3xl" />
        <div className="absolute -right-32 top-1/4 size-[400px] rounded-full bg-[#e5f6ff] opacity-50 blur-3xl" />
        <div className="absolute left-1/3 -bottom-32 size-[350px] rounded-full bg-[#fff9e0] opacity-40 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <span className="inline-flex items-center gap-2 rounded-[90px] border border-[#cce7ff] bg-white/70 px-4 py-1.5 text-[14px] text-[#535862] backdrop-blur-sm">
            <Sparkles className="size-3.5 text-[#0069e0]" />
            AI 多智能体交互式课堂
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
          className="mt-8 text-[clamp(2.8rem,7vw,5rem)] font-medium leading-[1.08] -tracking-[0.02em] text-[#0a0d12]"
        >
          用 AI 开启
          <br />
          沉浸式学习之旅
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
          className="mx-auto mt-6 max-w-2xl text-[16px] leading-[1.5] text-[#535862]"
        >
          输入任意主题或上传学习资料，多个 AI 智能体将协作生成互动课堂——
          包含课件、测验、白板、讨论等完整的学习体验。
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: 'easeOut' }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <button
            onClick={() => router.push('/register')}
            className="inline-flex h-12 items-center gap-2 rounded-[32px] bg-[#181d27] px-8 text-[14px] font-medium text-white transition-all hover:bg-[#0a0d12]"
            style={{ boxShadow: 'rgba(10, 13, 18, 0.08) 0px 1px 2px 0px, rgb(10, 13, 18) 0px 0px 0px 1px' }}
          >
            立即开始
            <ArrowRight className="size-4" />
          </button>
          <button
            onClick={() => router.push('/login')}
            className="inline-flex h-12 items-center rounded-[32px] border border-[#cce7ff] bg-white px-8 text-[14px] font-medium text-[#535862] transition-all hover:border-[#0069e0] hover:text-[#0a0d12]"
          >
            已有账号？去登录
          </button>
        </motion.div>
      </div>
    </section>
  );
}
