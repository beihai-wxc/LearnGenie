'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpen, Lightbulb, MessageCircle, Brain, Sparkles, FileText, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';

function FloatingIcon({
  children,
  className,
  delay,
  duration,
  startX,
  startY,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  startX?: number;
  startY?: number;
}) {
  return (
    <motion.div
      className={`absolute pointer-events-none ${className}`}
      initial={{ x: startX || 0, y: startY || 0 }}
      animate={{
        y: [startY || 0, (startY || 0) - 22, startY || 0],
        x: [(startX || 0), (startX || 0) + 12, (startX || 0)],
        rotate: [0, 6, -6, 0],
      }}
      transition={{
        duration: duration || 4,
        delay: delay || 0,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
}

export function LandingHero() {
  const router = useRouter();

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8f5ff]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-60"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 35%, rgba(168, 85, 247, 0.12) 0%, transparent 70%), radial-gradient(ellipse 50% 50% at 20% 60%, rgba(251, 146, 60, 0.1) 0%, transparent 70%), radial-gradient(ellipse 60% 45% at 80% 50%, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
            animation: 'gradient-shift 12s ease-in-out infinite',
            backgroundSize: '200% 200%',
          }}
        />
      </div>

      {/* ====== MAIN HERO FLOATING ELEMENTS ====== */}
      <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
        <div className="absolute left-[-8%] top-[10%] w-[320px] h-[320px] rounded-full bg-gradient-to-br from-violet-200/30 to-fuchsia-200/20 blur-3xl" style={{ animation: 'float-orb 10s ease-in-out infinite' }} />
        <div className="absolute right-[-10%] top-[20%] w-[280px] h-[280px] rounded-full bg-gradient-to-br from-amber-200/20 to-orange-200/15 blur-3xl" style={{ animation: 'float-orb 13s ease-in-out infinite 2s' }} />
        <div className="absolute left-[15%] bottom-[5%] w-[200px] h-[200px] rounded-full bg-gradient-to-br from-indigo-200/20 to-purple-200/15 blur-3xl" style={{ animation: 'float-orb 11s ease-in-out infinite 4s' }} />
        <div className="absolute right-[20%] bottom-[10%] w-[180px] h-[180px] rounded-full bg-gradient-to-br from-pink-200/20 to-rose-200/15 blur-3xl" style={{ animation: 'float-orb 14s ease-in-out infinite 1s' }} />

        <FloatingIcon delay={0} duration={5} className="left-[8%] top-[22%] hidden md:block">
          <div className="relative">
            <div className="size-16 rounded-2xl bg-white/70 backdrop-blur-sm p-3.5 text-[#7c3aed] shadow-[0_8px_24px_rgba(124,58,237,0.1),0_0_0_1px_rgba(255,255,255,0.6)]">
              <BookOpen className="size-full" />
            </div>
          </div>
        </FloatingIcon>

        <FloatingIcon delay={0.6} duration={4} className="left-[14%] top-[62%] hidden md:block">
          <div className="relative">
            <div className="size-14 rounded-2xl bg-white/70 backdrop-blur-sm p-3 text-[#f59e0b] shadow-[0_8px_24px_rgba(245,158,11,0.1),0_0_0_1px_rgba(255,255,255,0.6)]">
              <Lightbulb className="size-full" />
            </div>
          </div>
        </FloatingIcon>

        <FloatingIcon delay={1} duration={5.5} className="left-[4%] top-[42%] hidden lg:block">
          <div className="size-10 rounded-full bg-gradient-to-br from-violet-100 to-fuchsia-100 opacity-60 shadow-inner" />
        </FloatingIcon>

        <FloatingIcon delay={1.5} duration={3.5} className="left-[22%] bottom-[22%] hidden lg:block">
          <div className="size-6 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 opacity-70 shadow-inner" />
        </FloatingIcon>

        <FloatingIcon delay={0.8} duration={4.2} className="left-[11%] top-[76%] hidden xl:block">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#c4b5fd] drop-shadow">
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" opacity="0.6" />
          </svg>
        </FloatingIcon>

        <FloatingIcon delay={0.3} duration={4.6} className="right-[8%] top-[26%] hidden md:block">
          <div className="relative">
            <div className="size-16 rounded-2xl bg-white/70 backdrop-blur-sm p-3.5 text-[#f97316] shadow-[0_8px_24px_rgba(249,115,22,0.1),0_0_0_1px_rgba(255,255,255,0.6)]">
              <Brain className="size-full" />
            </div>
          </div>
        </FloatingIcon>

        <FloatingIcon delay={0.7} duration={3.8} className="right-[14%] top-[66%] hidden md:block">
          <div className="relative">
            <div className="size-14 rounded-2xl bg-white/70 backdrop-blur-sm p-3 text-[#10b981] shadow-[0_8px_24px_rgba(16,185,129,0.1),0_0_0_1px_rgba(255,255,255,0.6)]">
              <MessageCircle className="size-full" />
            </div>
          </div>
        </FloatingIcon>

        <FloatingIcon delay={1.2} duration={4.4} className="right-[4%] top-[46%] hidden lg:block">
          <div className="size-10 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 opacity-60 shadow-inner" />
        </FloatingIcon>

        <FloatingIcon delay={0.4} duration={3.4} className="right-[22%] bottom-[18%] hidden lg:block">
          <div className="size-8 rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 opacity-70 shadow-inner" />
        </FloatingIcon>

        <FloatingIcon delay={1.8} duration={5} className="right-[11%] top-[82%] hidden xl:block">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[#c4b5fd] drop-shadow">
            <path d="M10 1L12 7.5L18.5 9.5L12 11.5L10 18L8 11.5L1.5 9.5L8 7.5L10 1Z" fill="currentColor" opacity="0.5" />
          </svg>
        </FloatingIcon>

        <FloatingIcon delay={0.5} duration={4.2} className="right-[26%] top-[16%] hidden xl:block">
          <div className="relative">
            <div className="size-12 rounded-2xl bg-white/70 backdrop-blur-sm p-2.5 text-[#8b5cf6] shadow-[0_8px_24px_rgba(139,92,246,0.1),0_0_0_1px_rgba(255,255,255,0.6)]">
              <Sparkles className="size-full" />
            </div>
          </div>
        </FloatingIcon>

        <FloatingIcon delay={1.4} duration={4.6} className="left-[26%] top-[16%] hidden xl:block">
          <div className="relative">
            <div className="size-12 rounded-2xl bg-white/70 backdrop-blur-sm p-2.5 text-[#6366f1] shadow-[0_8px_24px_rgba(99,102,241,0.1),0_0_0_1px_rgba(255,255,255,0.6)]">
              <FileText className="size-full" />
            </div>
          </div>
        </FloatingIcon>

        <FloatingIcon delay={0.9} duration={3.8} className="right-[7%] bottom-[14%] hidden xl:block">
          <div className="relative">
            <div className="size-12 rounded-2xl bg-white/70 backdrop-blur-sm p-2.5 text-[#f59e0b] shadow-[0_8px_24px_rgba(245,158,11,0.1),0_0_0_1px_rgba(255,255,255,0.6)]">
              <GraduationCap className="size-full" />
            </div>
          </div>
        </FloatingIcon>

        <FloatingIcon delay={2} duration={5.5} className="left-[36%] bottom-[8%] hidden lg:block">
          <div className="size-6 rounded-full bg-gradient-to-br from-fuchsia-100 to-pink-100 opacity-60 shadow-inner" />
        </FloatingIcon>

        <FloatingIcon delay={1.6} duration={4.4} className="right-[36%] bottom-[10%] hidden lg:block">
          <div className="size-8 rounded-full bg-gradient-to-br from-amber-100 to-yellow-100 opacity-50 shadow-inner" />
        </FloatingIcon>

        {/* Subtle stars */}
        <FloatingIcon delay={0.3} duration={5} className="left-[30%] top-[70%] hidden lg:block">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-violet-200/30">
            <path d="M8 1L9.5 5.5L14 7L9.5 8.5L8 13L6.5 8.5L2 7L6.5 5.5L8 1Z" fill="currentColor" />
          </svg>
        </FloatingIcon>

        <FloatingIcon delay={1.1} duration={5.5} className="right-[32%] top-[72%] hidden lg:block">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-amber-200/25">
            <path d="M7 0.5L8.5 4.5L12.5 6L8.5 7.5L7 11.5L5.5 7.5L1.5 6L5.5 4.5L7 0.5Z" fill="currentColor" />
          </svg>
        </FloatingIcon>

        <FloatingIcon delay={2} duration={6} className="left-[60%] top-[68%] hidden xl:block">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-fuchsia-200/20">
            <path d="M6 0.5L7 3.5L10 4.5L7 5.5L6 8.5L5 5.5L2 4.5L5 3.5L6 0.5Z" fill="currentColor" />
          </svg>
        </FloatingIcon>
      </div>

      <div className="relative z-10 mx-auto max-w-4xl text-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-200/60 bg-white/60 backdrop-blur-md px-5 py-2 text-[13px] font-semibold tracking-wide text-[#5b5b7a] shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
            <span className="size-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 animate-pulse" />
            AI 多智能体互动课堂
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
          className="mt-8 text-[clamp(2.8rem,7vw,5.2rem)] font-bold leading-[1.05] -tracking-[0.03em] text-[#1a1a2e]"
        >
          <span className="gradient-text">沉浸式学习</span>
          <br />
          <span className="text-[#1a1a2e]">AI 赋能未来</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
          className="mx-auto mt-6 max-w-2xl text-[17px] leading-[1.65] text-[#6b6b80]"
        >
          输入任意学习主题或上传学习资料，多个 AI 智能体将协作生成完整的互动课堂 — 包含课件、测验、白板与讨论。
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45, ease: 'easeOut' }}
          className="mt-10"
        >
          <button
            onClick={() => router.push('/register')}
            className="group inline-flex h-13 items-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#6c3bff] via-[#8b5cf6] to-[#a855f7] px-9 text-[15px] font-bold tracking-wide text-white shadow-[0_8px_30px_rgba(108,59,255,0.35)] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(108,59,255,0.45)] hover:brightness-110"
          >
            免费开始
            <ArrowRight className="size-4.5 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </motion.div>
      </div>

      {/* ====== BOTTOM GRADIENT TRANSITION ====== */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 z-5 h-[24rem] w-full"
        style={{
          background: 'linear-gradient(to bottom, rgba(248,245,255,0) 0%, rgba(248,245,255,0.6) 30%, rgba(255,255,255,0.95) 70%, rgba(255,255,255,1) 100%)',
        }}
      />
    </section>
  );
}
