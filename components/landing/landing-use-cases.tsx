'use client';

import { motion } from 'motion/react';
import { GraduationCap, BookOpenText, FileSearch, Code2, Briefcase, Target, Trophy, Zap } from 'lucide-react';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';
import { FloatingOrb, FloatingIcon, FloatingDot, FloatingStar, FloatingPlus } from './floating-elements';

const SPRING_TRANSITION = { type: 'spring' as const, stiffness: 260, damping: 20 };

const useCases = [
  {
    icon: <GraduationCap className="size-6" />,
    title: '备考复习',
    description: '上传课程笔记或教材 PDF，AI 自动生成复习课件和测验，高效备考。',
    iconGradient: 'from-violet-500 to-fuchsia-500',
    cardAccent: 'hover:border-violet-200/60 hover:shadow-[0_12px_32px_rgba(124,58,237,0.08)]',
  },
  {
    icon: <BookOpenText className="size-6" />,
    title: '知识探索',
    description: '对某个话题感兴趣？输入关键词，AI 智能体以讨论式教学带你深入探索。',
    iconGradient: 'from-indigo-500 to-violet-500',
    cardAccent: 'hover:border-indigo-200/60 hover:shadow-[0_12px_32px_rgba(99,102,241,0.08)]',
  },
  {
    icon: <FileSearch className="size-6" />,
    title: '文献学习',
    description: '论文要点抓不住？让 AI 帮你拆解、提取、归纳总结。',
    iconGradient: 'from-emerald-500 to-teal-500',
    cardAccent: 'hover:border-emerald-200/60 hover:shadow-[0_12px_32px_rgba(16,185,129,0.08)]',
  },
  {
    icon: <Code2 className="size-6" />,
    title: '技能提升',
    description: '想学编程、设计或其他技能？AI 为你制定分步学习路径和实操练习。',
    iconGradient: 'from-orange-500 to-amber-500',
    cardAccent: 'hover:border-orange-200/60 hover:shadow-[0_12px_32px_rgba(249,115,22,0.08)]',
  },
];

export function LandingUseCases() {
  const reducedMotion = useReducedMotion();

  return (
    <section className="relative bg-gradient-to-b from-white via-[#f8f5ff]/40 to-white px-4 py-28 md:px-8 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-[5%] bottom-[10%] w-52 h-52 rounded-full bg-violet-200/15 blur-3xl" style={{ animation: 'float-orb 16s ease-in-out infinite 2s' }} />
        <div className="absolute right-[8%] top-[30%] w-44 h-44 rounded-full bg-amber-200/12 blur-3xl" style={{ animation: 'float-orb 14s ease-in-out infinite 5s' }} />
      </div>

      {/* Floating decorations - Learning Scenarios themed */}
      <FloatingOrb className="left-[-3%] top-[15%] w-[150px] h-[150px] bg-gradient-to-br from-violet-300/30 to-fuchsia-300/20" animation={{ y: [0, -30, 0], x: [0, 15, 0] }} duration={8} />
      <FloatingOrb className="right-[-3%] bottom-[15%] w-[130px] h-[130px] bg-gradient-to-br from-emerald-300/25 to-teal-300/15" animation={{ y: [0, -25, 0], x: [0, -12, 0] }} duration={10} delay={2} />

      <FloatingIcon className="left-[6%] top-[12%] hidden lg:block" delay={0} duration={6}>
        <div className="size-11 rounded-xl bg-white/80 backdrop-blur-md p-2.5 text-violet-500 shadow-[0_12px_32px_rgba(124,58,237,0.15),0_0_0_1px_rgba(255,255,255,0.7)]">
          <Briefcase className="size-full" />
        </div>
      </FloatingIcon>

      <FloatingIcon className="right-[6%] top-[16%] hidden lg:block" delay={0.6} duration={5.5}>
        <div className="size-10 rounded-xl bg-white/80 backdrop-blur-md p-2.5 text-amber-500 shadow-[0_12px_32px_rgba(245,158,11,0.15),0_0_0_1px_rgba(255,255,255,0.7)]">
          <Target className="size-full" />
        </div>
      </FloatingIcon>

      <FloatingIcon className="left-[12%] bottom-[22%] hidden xl:block" delay={1} duration={6}>
        <div className="size-9 rounded-xl bg-white/75 backdrop-blur-md p-2 text-emerald-400 shadow-[0_10px_24px_rgba(16,185,129,0.12),0_0_0_1px_rgba(255,255,255,0.6)]">
          <Trophy className="size-full" />
        </div>
      </FloatingIcon>

      <FloatingIcon className="right-[12%] bottom-[26%] hidden xl:block" delay={0.4} duration={5}>
        <div className="size-8 rounded-xl bg-white/75 backdrop-blur-md p-2 text-orange-400 shadow-[0_10px_24px_rgba(249,115,22,0.12),0_0_0_1px_rgba(255,255,255,0.6)]">
          <Zap className="size-full" />
        </div>
      </FloatingIcon>

      <FloatingDot className="left-[22%] top-[28%] size-4 bg-gradient-to-br from-violet-400/60 to-fuchsia-400/50 shadow-lg" animation={{ y: [0, -20, 0], scale: [1, 1.15, 1] }} duration={5} />
      <FloatingDot className="right-[25%] top-[32%] size-3.5 bg-gradient-to-br from-amber-400/55 to-orange-400/45 shadow-lg" animation={{ y: [0, -18, 0], scale: [1, 1.2, 1] }} duration={6} delay={1} />
      <FloatingDot className="left-[55%] bottom-[30%] size-3 bg-gradient-to-br from-emerald-400/50 to-teal-400/40 shadow-lg" animation={{ y: [0, -22, 0] }} duration={7} delay={2} />
      <FloatingDot className="right-[45%] bottom-[35%] size-4 bg-gradient-to-br from-orange-400/55 to-amber-400/45 shadow-lg" animation={{ y: [0, -16, 0], scale: [1, 1.1, 1] }} duration={5.5} delay={0.5} />

      <FloatingStar className="left-[35%] top-[35%] hidden lg:block" delay={0} duration={5} color="text-violet-400/60" size={16} />
      <FloatingStar className="right-[38%] bottom-[40%] hidden lg:block" delay={0.9} duration={6} color="text-amber-400/55" size={14} />

      <FloatingPlus className="left-[45%] top-[10%] text-violet-300/50 text-2xl" duration={8} />
      <FloatingPlus className="right-[28%] bottom-[32%] text-amber-300/45 text-xl" duration={9} delay={1.5} />

      <div className="relative mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={SPRING_TRANSITION}
          className="mb-16 text-center"
        >
          <span className="inline-block rounded-full bg-amber-50 px-4 py-1.5 text-[12px] font-bold tracking-widest uppercase text-[#f59e0b] mb-4">应用场景</span>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] -tracking-[0.025em] text-[#1a1a2e]">
            适用于每一种学习场景
          </h2>
          <p className="mt-4 text-[16px] leading-[1.6] text-[#6b6b80] max-w-xl mx-auto">
            无论你想学什么，LearnGenie 都为你打造专属课堂
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {useCases.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ ...SPRING_TRANSITION, delay: index * 0.1 }}
              className={`group rounded-2xl bg-white/70 backdrop-blur-sm p-7 border border-[#f0eef5] transition-all duration-300 hover:-translate-y-1.5 ${item.cardAccent}`}
            >
              <div className={`mb-5 inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.iconGradient} text-white shadow-md transition-transform duration-300 group-hover:scale-110`}>
                {item.icon}
              </div>
              <h3 className="mb-3 text-[16px] font-bold leading-[1.3] -tracking-[0.01em] text-[#1a1a2e]">
                {item.title}
              </h3>
              <p className="text-[13.5px] leading-[1.6] text-[#6b6b80]">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}