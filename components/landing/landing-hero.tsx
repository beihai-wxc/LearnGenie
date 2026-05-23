'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export function LandingHero() {
  const router = useRouter();

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fafdff] px-4 max-md:min-h-screen">
      {/* Subtle radial glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[74%] w-[118%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(30.84%_45.06%_at_50%_50%,#ebf6ff,#fafdff)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <span className="inline-flex items-center gap-2 rounded-[90px] border border-[#cce7ff] bg-white/70 px-4 py-1.5 text-[14px] text-[#535862] backdrop-blur-sm">
            <span className="size-2 rounded-full bg-[#0069e0]" />
            AI 多智能体交互式课堂
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
          className="mt-8 text-[clamp(3rem,7vw,5rem)] font-medium leading-[1.1] -tracking-[0.02em] text-[#0a0d12]"
        >
          用 AI 开启
          <br />
          沉浸式学习之旅
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
          className="mx-auto mt-6 max-w-2xl text-[16px] leading-[1.5] text-[#535862]"
        >
          输入任意主题或上传学习资料，多个 AI 智能体将协作生成互动课堂——
          包含课件、测验、白板、讨论等完整的学习体验。
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35, ease: 'easeOut' }}
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <button
            onClick={() => router.push('/register')}
            className="inline-flex h-12 items-center gap-2 rounded-[32px] bg-[#181d27] px-8 text-[14px] font-semibold text-white shadow-[0_1px_2px_rgba(10,13,18,0.8),0_0_0_1px_#0a0d12] transition-all hover:bg-[#0a0d12]"
          >
            立即开始
            <ArrowRight className="size-4" />
          </button>
        </motion.div>
      </div>

      {/* Bottom gradient fade to next section */}
      <div className="pointer-events-none absolute bottom-0 left-0 h-[38rem] w-full bg-[linear-gradient(357deg,#fff_2.12%,#fafdff_27.98%)]" />
    </section>
  );
}
