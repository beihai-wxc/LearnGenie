'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { FileText, Sparkles, Users, Lightbulb, Target, Rocket } from 'lucide-react';
import { useElementScrollProgress } from '@/lib/hooks/use-scroll-progress';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';
import { FloatingOrb, FloatingIcon, FloatingDot, FloatingStar, FloatingPlus } from './floating-elements';

const SPRING_TRANSITION = { type: 'spring' as const, stiffness: 260, damping: 20 };

const steps = [
  {
    step: '01',
    icon: <FileText className="size-6" />,
    title: '输入主题',
    description: '输入任意学习主题或上传 PDF/Word 资料，AI 自动解析并提取知识点。',
    color: '#7c3aed',
    bg: 'bg-gradient-to-br from-violet-50 to-fuchsia-50',
  },
  {
    step: '02',
    icon: <Sparkles className="size-6" />,
    title: 'AI 生成',
    description: '多个 AI 智能体协作，自动生成包含幻灯片、测验、讨论的完整互动课堂。',
    color: '#6366f1',
    bg: 'bg-gradient-to-br from-indigo-50 to-violet-50',
  },
  {
    step: '03',
    icon: <Users className="size-6" />,
    title: '沉浸式学习',
    description: '进入课堂与 AI 老师、同学实时互动，通过看、听、练全方位掌握知识。',
    color: '#f97316',
    bg: 'bg-gradient-to-br from-orange-50 to-amber-50',
  },
];

const stats = [
  { value: '5', label: '智能体角色' },
  { value: '多门课程', label: '课程容量' },
  { value: '免费', label: '永久免费' },
];

function AnimatedCounter({ target, duration = 1500 }: { target: string; duration?: number }) {
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasStarted) {
            setHasStarted(true);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted || reducedMotion) return;
    const numericTarget = parseInt(target);
    if (isNaN(numericTarget)) return;

    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      
      if (ref.current) {
        ref.current.textContent = Math.round(eased * numericTarget).toString();
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [hasStarted, target, duration, reducedMotion]);

  const numericTarget = parseInt(target);
  return (
    <div ref={ref}>
      {isNaN(numericTarget) ? target : '0'}
    </div>
  );
}

export function LandingHowItWorks() {
  const { ref: sectionRef, progress: sectionProgress } = useElementScrollProgress();
  const reducedMotion = useReducedMotion();

  return (
    <section id="how-it-works" ref={sectionRef} className="relative bg-gradient-to-b from-white via-[#f8f5ff]/50 to-white px-4 py-28 md:px-8 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-[10%] top-[20%] w-48 h-48 rounded-full bg-violet-200/20 blur-3xl" style={{ animation: 'float-orb 15s ease-in-out infinite' }} />
        <div className="absolute right-[15%] bottom-[20%] w-56 h-56 rounded-full bg-amber-200/15 blur-3xl" style={{ animation: 'float-orb 18s ease-in-out infinite 3s' }} />
      </div>

      {/* Floating decorations - Process/Steps themed */}
      <FloatingOrb className="left-[-5%] top-[20%] w-[160px] h-[160px] bg-gradient-to-br from-indigo-300/30 to-violet-300/20" animation={{ y: [0, -30, 0], x: [0, 15, 0] }} duration={8} />
      <FloatingOrb className="right-[-3%] bottom-[25%] w-[140px] h-[140px] bg-gradient-to-br from-orange-300/25 to-amber-300/15" animation={{ y: [0, -25, 0], x: [0, -12, 0] }} duration={10} delay={2} />

      <FloatingIcon className="left-[6%] top-[15%] hidden lg:block" delay={0} duration={6}>
        <div className="size-11 rounded-xl bg-white/80 backdrop-blur-md p-2.5 text-indigo-500 shadow-[0_12px_32px_rgba(99,102,241,0.15),0_0_0_1px_rgba(255,255,255,0.7)]">
          <Lightbulb className="size-full" />
        </div>
      </FloatingIcon>

      <FloatingIcon className="right-[6%] top-[18%] hidden lg:block" delay={0.6} duration={5.5}>
        <div className="size-10 rounded-xl bg-white/80 backdrop-blur-md p-2.5 text-emerald-500 shadow-[0_12px_32px_rgba(16,185,129,0.15),0_0_0_1px_rgba(255,255,255,0.7)]">
          <Target className="size-full" />
        </div>
      </FloatingIcon>

      <FloatingIcon className="left-[12%] bottom-[20%] hidden xl:block" delay={1} duration={6}>
        <div className="size-9 rounded-xl bg-white/75 backdrop-blur-md p-2 text-orange-400 shadow-[0_10px_24px_rgba(249,115,22,0.12),0_0_0_1px_rgba(255,255,255,0.6)]">
          <Rocket className="size-full" />
        </div>
      </FloatingIcon>

      <FloatingIcon className="right-[12%] bottom-[25%] hidden xl:block" delay={0.4} duration={5}>
        <div className="size-8 rounded-xl bg-white/75 backdrop-blur-md p-2 text-violet-400 shadow-[0_10px_24px_rgba(124,58,237,0.12),0_0_0_1px_rgba(255,255,255,0.6)]">
          <Sparkles className="size-full" />
        </div>
      </FloatingIcon>

      <FloatingDot className="left-[25%] top-[30%] size-4 bg-gradient-to-br from-indigo-400/60 to-violet-400/50 shadow-lg" animation={{ y: [0, -20, 0], scale: [1, 1.15, 1] }} duration={5} />
      <FloatingDot className="right-[28%] top-[35%] size-3.5 bg-gradient-to-br from-orange-400/55 to-amber-400/45 shadow-lg" animation={{ y: [0, -18, 0], scale: [1, 1.2, 1] }} duration={6} delay={1} />
      <FloatingDot className="left-[45%] bottom-[28%] size-3 bg-gradient-to-br from-emerald-400/50 to-teal-400/40 shadow-lg" animation={{ y: [0, -22, 0] }} duration={7} delay={2} />
      <FloatingDot className="right-[40%] bottom-[32%] size-4 bg-gradient-to-br from-pink-400/55 to-rose-400/45 shadow-lg" animation={{ y: [0, -16, 0], scale: [1, 1.1, 1] }} duration={5.5} delay={0.5} />

      <FloatingStar className="left-[35%] top-[35%] hidden lg:block" delay={0} duration={5} color="text-indigo-400/60" size={16} />
      <FloatingStar className="right-[32%] bottom-[38%] hidden lg:block" delay={0.9} duration={6} color="text-orange-400/55" size={14} />

      <FloatingPlus className="left-[55%] top-[12%] text-indigo-300/50 text-2xl" duration={8} />
      <FloatingPlus className="right-[25%] bottom-[28%] text-orange-300/45 text-xl" duration={9} delay={1.5} />

      <div className="relative mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={SPRING_TRANSITION}
          className="mb-20 text-center"
        >
          <span className="inline-block rounded-full bg-indigo-50 px-4 py-1.5 text-[12px] font-bold tracking-widest uppercase text-[#6366f1] mb-4">工作流程</span>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] -tracking-[0.025em] text-[#1a1a2e]">
            三步开启学习之旅
          </h2>
          <p className="mt-4 text-[16px] leading-[1.6] text-[#6b6b80]">
            从灵想到互动课堂，只需几分钟
          </p>
        </motion.div>

        <div className="relative mb-24">
          <motion.div
            className="absolute left-1/2 top-8 -translate-x-1/2 hidden h-[2px] lg:block"
            style={{
              background: 'linear-gradient(to right, transparent, rgba(124, 58, 237, 0.2), transparent)',
              width: `${Math.min(sectionProgress * 3, 1) * 80}%`,
            }}
          />
          <div className="grid gap-12 lg:grid-cols-3">
            {steps.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ ...SPRING_TRANSITION, delay: index * 0.15 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className={`relative z-10 mb-6 flex size-16 items-center justify-center rounded-2xl ${item.bg} shadow-[0_4px_16px_rgba(0,0,0,0.04)]`}>
                  <motion.div
                    style={{ color: item.color }}
                    animate={!reducedMotion ? { rotate: [0, 360] } : {}}
                    transition={!reducedMotion ? { duration: 1, ease: 'easeOut' } : {}}
                  >
                    {item.icon}
                  </motion.div>
                  <motion.span
                    className="absolute -right-1.5 -top-1.5 flex size-7 items-center justify-center rounded-full text-xs font-bold text-white shadow-md"
                    style={{ background: `linear-gradient(135deg, ${item.color}, ${item.color}dd)` }}
                    initial={!reducedMotion ? { scale: 0 } : {}}
                    animate={!reducedMotion ? { scale: [0, 1.2, 1] } : {}}
                    transition={!reducedMotion ? { duration: 0.6, delay: 0.3 + index * 0.15, ease: 'easeOut' } : {}}
                  >
                    {index + 1}
                  </motion.span>
                </div>
                <h3 className="mb-3 text-[17px] font-bold leading-[1.3] -tracking-[0.01em] text-[#1a1a2e]">
                  {item.title}
                </h3>
                <p className="max-w-xs text-[13.5px] leading-[1.6] text-[#6b6b80]">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={SPRING_TRANSITION}
          className="rounded-2xl bg-white/80 backdrop-blur-sm border border-[#f0eef5] px-8 py-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
        >
          <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-[28px] font-bold leading-[1.17] -tracking-[0.025em] gradient-text">
                  <AnimatedCounter target={stat.value} />
                </div>
                <div className="mt-1.5 text-[13px] font-medium text-[#6b6b80]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}