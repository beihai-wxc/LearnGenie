'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';
import { HelpCircle, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { FloatingOrb, FloatingIcon, FloatingDot, FloatingStar, FloatingPlus } from './floating-elements';

const FAQS = [
  {
    q: 'LearnGenie 是免费的吗？',
    a: '是的，完全免费。你可以自由使用，不收取任何费用。',
  },
  {
    q: 'AI 生成的内容准确吗？',
    a: 'LearnGenie 采用知识驱动的方式来保障内容质量。你可以上传教材、论文或参考资料，AI 会基于这些材料有据可依地生成课程内容。同时，多智能体协作也会从不同角度交叉验证知识点，有效减少错误。',
  },
  {
    q: '我的数据安全吗？',
    a: '非常安全。所有学习数据（课堂内容、学习画像、上传的资料）都存储在你浏览器的本地数据库中，不会上传到任何第三方服务器。AI 模型调用仅传输必要的生成指令，你的数据始终在你自己的掌控之中。',
  },
  {
    q: '生成的课堂规模有多大？',
    a: '课堂规模会根据你的主题和材料自动扩展。从快速概念概览（几张幻灯片 + 小测验）到深度领域探索（数十张幻灯片组成的完整课程），AI 会灵活调整内容复杂度——既不冗余，也不遗漏重点。',
  },
];

export function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reducedMotion = useReducedMotion();

  return (
    <section id="faq" className="relative bg-gradient-to-b from-white via-[#f8f5ff]/30 to-white px-4 py-28 md:px-8 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-violet-100/20 to-fuchsia-100/10 blur-3xl" />
      </div>

      {/* Floating decorations - FAQ/Help themed */}
      <FloatingOrb className="left-[-5%] top-[20%] w-[160px] h-[160px] bg-gradient-to-br from-violet-300/30 to-fuchsia-300/20" animation={{ y: [0, -30, 0], x: [0, 15, 0] }} duration={8} />
      <FloatingOrb className="right-[-5%] bottom-[15%] w-[140px] h-[140px] bg-gradient-to-br from-indigo-300/25 to-violet-300/15" animation={{ y: [0, -25, 0], x: [0, -12, 0] }} duration={10} delay={2} />

      <FloatingIcon className="left-[6%] top-[15%] hidden lg:block" delay={0} duration={6}>
        <div className="size-11 rounded-xl bg-white/80 backdrop-blur-md p-2.5 text-violet-500 shadow-[0_12px_32px_rgba(124,58,237,0.15),0_0_0_1px_rgba(255,255,255,0.7)]">
          <HelpCircle className="size-full" />
        </div>
      </FloatingIcon>

      <FloatingIcon className="right-[6%] top-[18%] hidden lg:block" delay={0.6} duration={5.5}>
        <div className="size-10 rounded-xl bg-white/80 backdrop-blur-md p-2.5 text-indigo-500 shadow-[0_12px_32px_rgba(99,102,241,0.15),0_0_0_1px_rgba(255,255,255,0.7)]">
          <Info className="size-full" />
        </div>
      </FloatingIcon>

      <FloatingIcon className="left-[12%] bottom-[20%] hidden xl:block" delay={1} duration={6}>
        <div className="size-9 rounded-xl bg-white/75 backdrop-blur-md p-2 text-emerald-400 shadow-[0_10px_24px_rgba(16,185,129,0.12),0_0_0_1px_rgba(255,255,255,0.6)]">
          <CheckCircle className="size-full" />
        </div>
      </FloatingIcon>

      <FloatingIcon className="right-[12%] bottom-[25%] hidden xl:block" delay={0.4} duration={5}>
        <div className="size-8 rounded-xl bg-white/75 backdrop-blur-md p-2 text-amber-400 shadow-[0_10px_24px_rgba(245,158,11,0.12),0_0_0_1px_rgba(255,255,255,0.6)]">
          <AlertCircle className="size-full" />
        </div>
      </FloatingIcon>

      <FloatingDot className="left-[22%] top-[30%] size-4 bg-gradient-to-br from-violet-400/60 to-fuchsia-400/50 shadow-lg" animation={{ y: [0, -20, 0], scale: [1, 1.15, 1] }} duration={5} />
      <FloatingDot className="right-[25%] top-[35%] size-3.5 bg-gradient-to-br from-indigo-400/55 to-violet-400/45 shadow-lg" animation={{ y: [0, -18, 0], scale: [1, 1.2, 1] }} duration={6} delay={1} />
      <FloatingDot className="left-[55%] bottom-[28%] size-3 bg-gradient-to-br from-emerald-400/50 to-teal-400/40 shadow-lg" animation={{ y: [0, -22, 0] }} duration={7} delay={2} />
      <FloatingDot className="right-[45%] bottom-[32%] size-4 bg-gradient-to-br from-fuchsia-400/55 to-violet-400/45 shadow-lg" animation={{ y: [0, -16, 0], scale: [1, 1.1, 1] }} duration={5.5} delay={0.5} />

      <FloatingStar className="left-[35%] top-[38%] hidden lg:block" delay={0} duration={5} color="text-violet-400/60" size={16} />
      <FloatingStar className="right-[38%] bottom-[40%] hidden lg:block" delay={0.9} duration={6} color="text-indigo-400/55" size={14} />

      <FloatingPlus className="left-[45%] top-[12%] text-violet-300/50 text-2xl" duration={8} />
      <FloatingPlus className="right-[28%] bottom-[30%] text-fuchsia-300/45 text-xl" duration={9} delay={1.5} />

      <div className="relative mx-auto max-w-3xl">
        <div className="mb-14 text-center">
          <span className="inline-block rounded-full bg-violet-50 px-5 py-2 text-[13px] font-bold tracking-widest uppercase text-[#7c3aed] mb-4">常见问题</span>
          <h2 className="text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] -tracking-[0.025em] text-[#1a1a2e]">
            Q&A
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <motion.div
                key={i}
                className="rounded-2xl bg-white/70 backdrop-blur-sm border border-[#f0eef5] overflow-hidden"
                animate={
                  !reducedMotion
                    ? {
                        boxShadow: isOpen
                          ? '0 8px 24px rgba(124, 58, 237, 0.06)'
                          : '0 0 0 rgba(0,0,0,0)',
                      }
                    : {}
                }
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-7 py-6 text-left md:px-9 md:py-7"
                >
                  <span className="text-[16px] font-semibold leading-[1.5] text-[#1a1a2e] md:text-[17px]">
                    {faq.q}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="shrink-0 text-[#a0a0b8]"
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </motion.span>
                </button>
                <motion.div
                  initial={false}
                  animate={{
                    height: isOpen ? 'auto' : 0,
                    opacity: isOpen ? 1 : 0,
                  }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <motion.p
                    className="px-7 pb-7 text-[15px] leading-[1.85] text-[#5a5a70] md:px-9 md:text-[16px]"
                    animate={isOpen ? { y: 0 } : { y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    {faq.a}
                  </motion.p>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}