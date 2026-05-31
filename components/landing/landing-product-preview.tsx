'use client';

import { motion } from 'motion/react';
import { MessageCircle, Presentation, PenTool, Layout, Monitor, MessageSquare, Pen, CheckCircle } from 'lucide-react';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';
import { FloatingOrb, FloatingIcon, FloatingDot, FloatingStar, FloatingPlus } from './floating-elements';
import { ImageCarousel } from './image-carousel';

const SPRING_TRANSITION = { type: 'spring' as const, stiffness: 260, damping: 20 };

const previews = [
  {
    icon: <Presentation className="size-5" />,
    title: '智能幻灯片',
    description: 'AI 自动排版、视觉丰富的知识展示',
    color: '#7c3aed',
    bg: 'bg-gradient-to-br from-violet-50 to-fuchsia-50',
  },
  {
    icon: <MessageCircle className="size-5" />,
    title: '互动讨论',
    description: '多智能体实时对话，深入探索知识点',
    color: '#6366f1',
    bg: 'bg-gradient-to-br from-indigo-50 to-violet-50',
  },
  {
    icon: <PenTool className="size-5" />,
    title: '白板推演',
    description: 'AI 辅助画图、公式推导与标注',
    color: '#f59e0b',
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
  },
  {
    icon: <Layout className="size-5" />,
    title: '随堂测验',
    description: '智能出题、实时评分与能力分析',
    color: '#f97316',
    bg: 'bg-gradient-to-br from-orange-50 to-amber-50',
  },
];

export function LandingProductPreview() {
  const reducedMotion = useReducedMotion();

  return (
    <section className="relative bg-white px-4 py-28 md:px-8 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute right-[5%] top-[15%] w-72 h-72 rounded-full bg-gradient-to-br from-fuchsia-100 to-violet-100 blur-3xl" style={{ animation: 'float-orb 14s ease-in-out infinite' }} />
      </div>

      {/* Floating decorations - Interactive Classroom themed */}
      <FloatingOrb className="left-[-5%] top-[15%] w-[170px] h-[170px] bg-gradient-to-br from-fuchsia-300/35 to-violet-300/25" animation={{ y: [0, -30, 0], x: [0, 15, 0] }} duration={8} />
      <FloatingOrb className="right-[-5%] bottom-[20%] w-[150px] h-[150px] bg-gradient-to-br from-indigo-300/30 to-violet-300/20" animation={{ y: [0, -25, 0], x: [0, -12, 0] }} duration={10} delay={2} />

      <FloatingIcon className="left-[6%] top-[12%] hidden lg:block" delay={0} duration={6}>
        <div className="size-12 rounded-2xl bg-white/80 backdrop-blur-md p-3 text-fuchsia-500 shadow-[0_12px_32px_rgba(168,85,247,0.15),0_0_0_1px_rgba(255,255,255,0.7)]">
          <Monitor className="size-full" />
        </div>
      </FloatingIcon>

      <FloatingIcon className="right-[6%] top-[16%] hidden lg:block" delay={0.6} duration={5.5}>
        <div className="size-11 rounded-2xl bg-white/80 backdrop-blur-md p-2.5 text-indigo-500 shadow-[0_12px_32px_rgba(99,102,241,0.15),0_0_0_1px_rgba(255,255,255,0.7)]">
          <MessageSquare className="size-full" />
        </div>
      </FloatingIcon>

      <FloatingIcon className="left-[12%] bottom-[22%] hidden xl:block" delay={1} duration={6}>
        <div className="size-9 rounded-xl bg-white/75 backdrop-blur-md p-2 text-violet-400 shadow-[0_10px_24px_rgba(124,58,237,0.12),0_0_0_1px_rgba(255,255,255,0.6)]">
          <Pen className="size-full" />
        </div>
      </FloatingIcon>

      <FloatingIcon className="right-[12%] bottom-[28%] hidden xl:block" delay={0.4} duration={5}>
        <div className="size-8 rounded-xl bg-white/75 backdrop-blur-md p-2 text-emerald-400 shadow-[0_10px_24px_rgba(16,185,129,0.12),0_0_0_1px_rgba(255,255,255,0.6)]">
          <CheckCircle className="size-full" />
        </div>
      </FloatingIcon>

      <FloatingDot className="left-[22%] top-[28%] size-4 bg-gradient-to-br from-fuchsia-400/60 to-violet-400/50 shadow-lg" animation={{ y: [0, -20, 0], scale: [1, 1.15, 1] }} duration={5} />
      <FloatingDot className="right-[25%] top-[32%] size-3.5 bg-gradient-to-br from-indigo-400/55 to-violet-400/45 shadow-lg" animation={{ y: [0, -18, 0], scale: [1, 1.2, 1] }} duration={6} delay={1} />
      <FloatingDot className="left-[55%] bottom-[30%] size-3 bg-gradient-to-br from-pink-400/50 to-rose-400/40 shadow-lg" animation={{ y: [0, -22, 0] }} duration={7} delay={2} />
      <FloatingDot className="right-[45%] bottom-[35%] size-4 bg-gradient-to-br from-violet-400/55 to-fuchsia-400/45 shadow-lg" animation={{ y: [0, -16, 0], scale: [1, 1.1, 1] }} duration={5.5} delay={0.5} />

      <FloatingStar className="left-[35%] top-[35%] hidden lg:block" delay={0} duration={5} color="text-fuchsia-400/60" size={16} />
      <FloatingStar className="right-[38%] bottom-[40%] hidden lg:block" delay={0.9} duration={6} color="text-indigo-400/55" size={14} />

      <FloatingPlus className="left-[45%] top-[10%] text-fuchsia-300/50 text-2xl" duration={8} />
      <FloatingPlus className="right-[28%] bottom-[32%] text-violet-300/45 text-xl" duration={9} delay={1.5} />

      <div className="relative mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={SPRING_TRANSITION}
          className="mb-16 text-center"
        >
          <span className="inline-block rounded-full bg-fuchsia-50 px-4 py-1.5 text-[12px] font-bold tracking-widest uppercase text-[#a855f7] mb-4">课堂预览</span>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] -tracking-[0.025em] text-[#1a1a2e]">
            沉浸式互动课堂
          </h2>
          <p className="mt-4 text-[16px] leading-[1.6] text-[#6b6b80] max-w-xl mx-auto">
            不再是看视频，而是真正参与互动式学习
          </p>
        </motion.div>

        <div className="grid gap-10 lg:grid-cols-2 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={SPRING_TRANSITION}
          >
            <ImageCarousel />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={SPRING_TRANSITION}
            className="flex flex-col justify-center space-y-5"
          >
            {previews.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ ...SPRING_TRANSITION, delay: 0.15 + index * 0.1 }}
                className="flex items-start gap-4 p-4 rounded-xl transition-all duration-200 hover:bg-[#f8f5ff]"
              >
                <div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${item.bg} shadow-sm`}
                  style={{ color: item.color }}
                >
                  {item.icon}
                </div>
                <div>
                  <h3 className="text-[15px] font-bold leading-[1.4] text-[#1a1a2e]">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-[13.5px] leading-[1.6] text-[#6b6b80]">
                    {item.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}