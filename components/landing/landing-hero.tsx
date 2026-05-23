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
        y: [startY || 0, (startY || 0) - 20, startY || 0],
        x: [(startX || 0), (startX || 0) + 10, (startX || 0)],
        rotate: [0, 5, -5, 0],
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
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#fafdff] px-4 max-md:min-h-screen">
      {/* Subtle radial glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[74%] w-[118%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(30.84%_45.06%_at_50%_50%,#ebf6ff,#fafdff)]" />
      </div>

      {/* Decorative floating elements */}
      <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
        {/* Left side elements */}
        <FloatingIcon delay={0} duration={4} startX={0} startY={0} className="left-[8%] top-[20%] hidden md:block">
          <div className="relative">
            <div className="size-16 rounded-2xl bg-[#e5f6ff] p-3.5 text-[#0069e0] shadow-[0_8px_24px_rgba(0,105,224,0.08)]">
              <BookOpen className="size-full" />
            </div>
          </div>
        </FloatingIcon>

        <FloatingIcon delay={0.5} duration={3.5} startX={0} startY={0} className="left-[15%] top-[60%] hidden md:block">
          <div className="relative">
            <div className="size-14 rounded-2xl bg-[#fff9e0] p-3 text-[#bb9915] shadow-[0_8px_24px_rgba(187,153,21,0.08)]">
              <Lightbulb className="size-full" />
            </div>
          </div>
        </FloatingIcon>

        <FloatingIcon delay={1} duration={4.5} startX={0} startY={0} className="left-[5%] top-[40%] hidden lg:block">
          <div className="size-10 rounded-full bg-[#e5f6ff] opacity-60" />
        </FloatingIcon>

        <FloatingIcon delay={1.5} duration={3} startX={0} startY={0} className="left-[20%] bottom-[25%] hidden lg:block">
          <div className="size-6 rounded-full bg-[#d3f6e3] opacity-70" />
        </FloatingIcon>

        <FloatingIcon delay={0.8} duration={3.8} startX={0} startY={0} className="left-[12%] top-[75%] hidden xl:block">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#cce7ff]">
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" opacity="0.6" />
          </svg>
        </FloatingIcon>

        {/* Right side elements */}
        <FloatingIcon delay={0.3} duration={4.2} startX={0} startY={0} className="right-[8%] top-[25%] hidden md:block">
          <div className="relative">
            <div className="size-16 rounded-2xl bg-[#fff2eb] p-3.5 text-[#f26110] shadow-[0_8px_24px_rgba(242,97,16,0.08)]">
              <Brain className="size-full" />
            </div>
          </div>
        </FloatingIcon>

        <FloatingIcon delay={0.7} duration={3.6} startX={0} startY={0} className="right-[15%] top-[65%] hidden md:block">
          <div className="relative">
            <div className="size-14 rounded-2xl bg-[#d3f6e3] p-3 text-[#0d9e6b] shadow-[0_8px_24px_rgba(13,158,107,0.08)]">
              <MessageCircle className="size-full" />
            </div>
          </div>
        </FloatingIcon>

        <FloatingIcon delay={1.2} duration={4} startX={0} startY={0} className="right-[5%] top-[45%] hidden lg:block">
          <div className="size-10 rounded-full bg-[#fff2eb] opacity-60" />
        </FloatingIcon>

        <FloatingIcon delay={0.4} duration={3.2} startX={0} startY={0} className="right-[20%] bottom-[20%] hidden lg:block">
          <div className="size-8 rounded-full bg-[#e5f6ff] opacity-70" />
        </FloatingIcon>

        <FloatingIcon delay={1.8} duration={4.5} startX={0} startY={0} className="right-[12%] top-[80%] hidden xl:block">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-[#cce7ff]">
            <path d="M10 1L12 7.5L18.5 9.5L12 11.5L10 18L8 11.5L1.5 9.5L8 7.5L10 1Z" fill="currentColor" opacity="0.5" />
          </svg>
        </FloatingIcon>

        <FloatingIcon delay={0.6} duration={3.8} startX={0} startY={0} className="right-[25%] top-[15%] hidden xl:block">
          <div className="relative">
            <div className="size-12 rounded-2xl bg-[#f4ebff] p-2.5 text-[#8b5cf6] shadow-[0_8px_24px_rgba(139,92,246,0.08)]">
              <Sparkles className="size-full" />
            </div>
          </div>
        </FloatingIcon>

        <FloatingIcon delay={1.4} duration={4.2} startX={0} startY={0} className="left-[25%] top-[15%] hidden xl:block">
          <div className="relative">
            <div className="size-12 rounded-2xl bg-[#e5f6ff] p-2.5 text-[#0069e0] shadow-[0_8px_24px_rgba(0,105,224,0.08)]">
              <FileText className="size-full" />
            </div>
          </div>
        </FloatingIcon>

        <FloatingIcon delay={0.9} duration={3.5} startX={0} startY={0} className="right-[8%] bottom-[15%] hidden xl:block">
          <div className="relative">
            <div className="size-12 rounded-2xl bg-[#fff9e0] p-2.5 text-[#bb9915] shadow-[0_8px_24px_rgba(187,153,21,0.08)]">
              <GraduationCap className="size-full" />
            </div>
          </div>
        </FloatingIcon>

        <FloatingIcon delay={2} duration={5} startX={0} startY={0} className="left-[35%] bottom-[10%] hidden lg:block">
          <div className="size-6 rounded-full bg-[#f4ebff] opacity-60" />
        </FloatingIcon>

        <FloatingIcon delay={1.6} duration={4} startX={0} startY={0} className="right-[35%] bottom-[12%] hidden lg:block">
          <div className="size-8 rounded-full bg-[#fff9e0] opacity-50" />
        </FloatingIcon>

        {/* Cloud-like shapes */}
        <FloatingIcon delay={0} duration={6} startX={0} startY={0} className="left-[-5%] top-[-5%] hidden lg:block">
          <div className="size-32 rounded-full bg-white opacity-30 blur-xl" />
        </FloatingIcon>

        <FloatingIcon delay={0.5} duration={5} startX={0} startY={0} className="right-[-3%] top-[10%] hidden lg:block">
          <div className="size-24 rounded-full bg-white opacity-40 blur-xl" />
        </FloatingIcon>

        <FloatingIcon delay={1} duration={7} startX={0} startY={0} className="left-[-2%] bottom-[-2%] hidden lg:block">
          <div className="size-28 rounded-full bg-white opacity-35 blur-xl" />
        </FloatingIcon>

        <FloatingIcon delay={1.5} duration={5.5} startX={0} startY={0} className="right-[-2%] bottom-[-5%] hidden lg:block">
          <div className="size-20 rounded-full bg-white opacity-30 blur-xl" />
        </FloatingIcon>
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
