'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

const SPRING_TRANSITION = { type: 'spring' as const, stiffness: 260, damping: 20 };

export function LandingFooter() {
  const router = useRouter();

  return (
    <footer>
      <section className="relative bg-gradient-to-b from-white via-[#f8f5ff]/60 to-[#f2eeff] px-4 pt-28 pb-20 md:pt-32 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-[10%] top-[20%] w-64 h-64 rounded-full bg-gradient-to-br from-violet-200/20 to-fuchsia-200/15 blur-3xl" style={{ animation: 'float-orb 16s ease-in-out infinite' }} />
          <div className="absolute right-[15%] top-[10%] w-48 h-48 rounded-full bg-gradient-to-br from-amber-200/15 to-orange-200/10 blur-3xl" style={{ animation: 'float-orb 14s ease-in-out infinite 3s' }} />
        </div>

        <div className="relative mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={SPRING_TRANSITION}
          >
            <h2 className="text-[clamp(2.8rem,7vw,4.8rem)] font-bold leading-[1.08] -tracking-[0.03em] text-[#1a1a2e]">
              开启你的
              <br />
              <span className="gradient-text">AI 学习之旅</span>
            </h2>
            <p className="mt-5 text-[18px] leading-[1.7] text-[#6b6b80] md:text-[20px]">
              带上你的好奇心，我们一起生成智慧
            </p>
            <motion.button
              onClick={() => router.push('/register')}
              className="mt-12 inline-flex h-14 items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#6c3bff] via-[#8b5cf6] to-[#a855f7] px-10 text-[16px] font-bold tracking-wide text-white shadow-[0_8px_30px_rgba(108,59,255,0.35)]"
              whileHover={{ y: -2, boxShadow: '0 12px 40px rgba(108,59,255,0.45)', scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring' as const, stiffness: 300, damping: 20 }}
            >
              免费开始
              <ArrowRight className="size-5" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      <div className="bg-[#f2eeff]/50 px-4 py-6 border-t border-violet-100/30">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <img
              src="/logo-horizontal.png"
              alt="LearnGenie"
              className="h-5 w-auto opacity-40"
            />
            <span className="text-[12px] font-medium tracking-wide text-[#9090a8]">
              AI 沉浸式课堂
            </span>
          </div>
          <p className="text-[12px] text-[#9090a8]">
            &copy; {new Date().getFullYear()} LearnGenie. 保留所有权利。
          </p>
        </div>
      </div>
    </footer>
  );
}