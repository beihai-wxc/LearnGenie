'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import { Users, Library, Presentation, TrendingUp, CalendarCheck, BookOpen, Lightbulb, Sparkles, Brain, FileText } from 'lucide-react';
import { FloatingOrb, FloatingIcon, FloatingDot, FloatingStar, FloatingPlus } from './floating-elements';

const FEATURES = [
  { icon: <Users className="size-6" />, title: 'AI 多智能体课堂', description: '多个 AI 智能体协同教学 — 讲师授课、助教答疑、同学讨论，让学习不再孤单。', iconColor: 'text-[#7c3aed]', cardBg: 'bg-white/70' },
  { icon: <Library className="size-6" />, title: '知识驱动学习', description: '上传文档或连接知识库，AI 自动提取重点并生成个性化、有据可依的课程内容。', iconColor: 'text-[#6366f1]', cardBg: 'bg-white/70' },
  { icon: <Presentation className="size-6" />, title: '互动式课件', description: '从一段描述或一份 PDF 开始，一键生成包含幻灯片、测验和白板的完整课堂。', iconColor: 'text-[#f59e0b]', cardBg: 'bg-white/70' },
  { icon: <TrendingUp className="size-6" />, title: '学习档案与追踪', description: '每次学习都会更新你的专属学习画像，让 AI 更懂你，课程更精准。', iconColor: 'text-[#f97316]', cardBg: 'bg-white/70' },
  { icon: <CalendarCheck className="size-6" />, title: '个性化学习计划', description: 'AI根据你的画像和薄弱点生成专属的学习路径，逐步达成目标', iconColor: 'text-[#10b981]', cardBg: 'bg-white/70' },
];

export function LandingFeatures() {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-40px' });
  const [animPhase, setAnimPhase] = useState<'idle' | 'row1' | 'row2'>('idle');

  useEffect(() => {
    if (isInView) {
      setAnimPhase('row1');
      const timer = setTimeout(() => setAnimPhase('row2'), 600);
      return () => clearTimeout(timer);
    }
  }, [isInView]);

  return (
    <section id="features" ref={sectionRef} className="relative bg-white px-4 py-28 md:px-8 overflow-hidden">
      <div className="absolute inset-0 opacity-40">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-violet-100/50 to-fuchsia-100/30 blur-3xl" />
      </div>

      {/* Floating decorations - Learning themed */}
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
        <FloatingOrb className="left-[5%] top-[15%] w-[180px] h-[180px] bg-gradient-to-br from-violet-300/35 to-fuchsia-300/25" animation={{ y: [0, -30, 0], x: [0, 15, 0] }} duration={8} />
        <FloatingOrb className="right-[5%] bottom-[20%] w-[160px] h-[160px] bg-gradient-to-br from-amber-300/30 to-orange-300/20" animation={{ y: [0, -25, 0], x: [0, -12, 0] }} duration={10} delay={2} />
        <FloatingOrb className="left-[25%] bottom-[10%] w-[140px] h-[140px] bg-gradient-to-br from-indigo-300/25 to-violet-300/15" animation={{ y: [0, -35, 0], scale: [1, 1.05, 1] }} duration={12} delay={1} />

        <FloatingIcon className="left-[10%] top-[20%] hidden md:block" delay={0} duration={6}>
          <div className="size-12 rounded-2xl bg-white/80 backdrop-blur-md p-2.5 text-violet-500 shadow-[0_12px_32px_rgba(124,58,237,0.15),0_0_0_1px_rgba(255,255,255,0.7)]">
            <BookOpen className="size-full" />
          </div>
        </FloatingIcon>

        <FloatingIcon className="right-[10%] top-[25%] hidden md:block" delay={0.6} duration={5.5}>
          <div className="size-11 rounded-2xl bg-white/80 backdrop-blur-md p-2.5 text-amber-500 shadow-[0_12px_32px_rgba(245,158,11,0.15),0_0_0_1px_rgba(255,255,255,0.7)]">
            <Lightbulb className="size-full" />
          </div>
        </FloatingIcon>

        <FloatingIcon className="left-[18%] bottom-[30%] hidden lg:block" delay={1} duration={6}>
          <div className="size-9 rounded-xl bg-white/75 backdrop-blur-md p-2 text-emerald-500 shadow-[0_10px_24px_rgba(16,185,129,0.12),0_0_0_1px_rgba(255,255,255,0.6)]">
            <Sparkles className="size-full" />
          </div>
        </FloatingIcon>

        <FloatingIcon className="right-[18%] bottom-[25%] hidden lg:block" delay={0.4} duration={5}>
          <div className="size-8 rounded-xl bg-white/75 backdrop-blur-md p-2 text-indigo-400 shadow-[0_10px_24px_rgba(99,102,241,0.12),0_0_0_1px_rgba(255,255,255,0.6)]">
            <Brain className="size-full" />
          </div>
        </FloatingIcon>

        <FloatingIcon className="left-[42%] top-[12%] hidden xl:block" delay={1.2} duration={6.5}>
          <div className="size-7 rounded-xl bg-white/70 backdrop-blur-md p-1.5 text-fuchsia-400 shadow-[0_8px_20px_rgba(168,85,247,0.1),0_0_0_1px_rgba(255,255,255,0.5)]">
            <FileText className="size-full" />
          </div>
        </FloatingIcon>

        <FloatingDot className="left-[28%] top-[35%] size-4 bg-gradient-to-br from-violet-400/60 to-fuchsia-400/50 shadow-lg" animation={{ y: [0, -20, 0], scale: [1, 1.15, 1] }} duration={5} />
        <FloatingDot className="right-[30%] top-[40%] size-3.5 bg-gradient-to-br from-amber-400/55 to-orange-400/45 shadow-lg" animation={{ y: [0, -18, 0], scale: [1, 1.2, 1] }} duration={6} delay={1} />
        <FloatingDot className="left-[62%] bottom-[35%] size-3 bg-gradient-to-br from-emerald-400/50 to-teal-400/40 shadow-lg" animation={{ y: [0, -22, 0] }} duration={7} delay={2} />
        <FloatingDot className="right-[48%] bottom-[30%] size-4 bg-gradient-to-br from-pink-400/55 to-rose-400/45 shadow-lg" animation={{ y: [0, -16, 0], scale: [1, 1.1, 1] }} duration={5.5} delay={0.5} />

        <FloatingStar className="left-[35%] top-[40%] hidden md:block" delay={0} duration={5} color="text-violet-400/60" size={16} />
        <FloatingStar className="right-[38%] bottom-[40%] hidden md:block" delay={0.9} duration={6} color="text-amber-400/55" size={14} />

        <FloatingPlus className="left-[52%] top-[18%] text-violet-300/50 text-2xl" duration={8} />
        <FloatingPlus className="right-[22%] bottom-[35%] text-amber-300/45 text-xl" duration={9} delay={1.5} />
      </div>

      <div className="relative mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-18 text-center"
        >
          <span className="inline-block rounded-full bg-violet-50 px-4 py-1.5 text-[12px] font-bold tracking-widest uppercase text-[#7c3aed] mb-4">为什么选择 LearnGenie</span>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] -tracking-[0.025em] text-[#1a1a2e]">
            重新定义你的学习方式
          </h2>
          <p className="mt-4 text-[16px] leading-[1.6] text-[#6b6b80] max-w-xl mx-auto">
            不只是内容生成，而是完整的沉浸式互动学习体验
          </p>
        </motion.div>

        {/* 第一行 - 从左侧滑入 */}
        <div className="overflow-hidden">
          <motion.div
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            animate={animPhase === 'row1' || animPhase === 'row2' ? { opacity: 1, x: 0 } : { opacity: 0, x: '-100%' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {FEATURES.slice(0, 3).map((f) => (
              <div
                key={f.title}
                className={`group relative rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1.5 ${f.cardBg} backdrop-blur-sm border border-[#f0eef5] hover:border-violet-200/60 hover:shadow-[0_12px_32px_rgba(124,58,237,0.08)]`}
              >
                <div className={`mb-5 inline-flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-50 to-fuchsia-50 ${f.iconColor} shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}>{f.icon}</div>
                <h3 className="mb-2.5 text-[16px] font-bold leading-[1.3] -tracking-[0.01em] text-[#1a1a2e]">{f.title}</h3>
                <p className="text-[13.5px] leading-[1.6] text-[#6b6b80]">{f.description}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* 第二行 - 从右侧滑入 */}
        <div className="mt-5 overflow-hidden">
          <motion.div
            className="flex flex-wrap justify-center gap-5"
            animate={animPhase === 'row2' ? { opacity: 1, x: 0 } : { opacity: 0, x: '100%' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {FEATURES.slice(3).map((f) => (
              <div
                key={f.title}
                className={`w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] group relative rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1.5 ${f.cardBg} backdrop-blur-sm border border-[#f0eef5] hover:border-violet-200/60 hover:shadow-[0_12px_32px_rgba(124,58,237,0.08)]`}
              >
                <div className={`mb-5 inline-flex size-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-50 to-fuchsia-50 ${f.iconColor} shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}>{f.icon}</div>
                <h3 className="mb-2.5 text-[16px] font-bold leading-[1.3] -tracking-[0.01em] text-[#1a1a2e]">{f.title}</h3>
                <p className="text-[13.5px] leading-[1.6] text-[#6b6b80]">{f.description}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
