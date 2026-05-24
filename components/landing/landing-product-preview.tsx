'use client';

import { motion } from 'motion/react';
import { MessageCircle, Presentation, PenTool, Layout } from 'lucide-react';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

const SPRING_TRANSITION = { type: 'spring', stiffness: 260, damping: 20 };

const previews = [
  {
    icon: <Presentation className="size-5" />,
    title: '智能课件',
    description: 'AI 自动排版，图文并茂的知识讲解',
    color: '#0069e0',
    bg: 'bg-[#e5f6ff]',
  },
  {
    icon: <MessageCircle className="size-5" />,
    title: '互动讨论',
    description: '多智能体实时对话，围绕知识点深入探讨',
    color: '#0069e0',
    bg: 'bg-[#e5f6ff]',
  },
  {
    icon: <PenTool className="size-5" />,
    title: '互动白板',
    description: 'AI 辅助绘图、推导公式、标注重点',
    color: '#bb9915',
    bg: 'bg-[#fff9e0]',
  },
  {
    icon: <Layout className="size-5" />,
    title: '随堂测验',
    description: '智能生成题目，实时批改和解析',
    color: '#f26110',
    bg: 'bg-[#fff2eb]',
  },
];

function ClassroomMockup() {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      className="overflow-hidden rounded-[32px] bg-[#fafdff]"
      style={{ boxShadow: 'rgba(4, 69, 144, 0.08) 0px 14px 20px 4px' }}
      animate={
        reducedMotion
          ? {}
          : {
              y: [0, -4, 0],
            }
      }
      transition={
        reducedMotion
          ? {}
          : {
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }
      }
    >
      <div className="flex items-center gap-2 border-b border-[#cce7ff] px-5 py-3">
        <div className="size-3 rounded-full bg-red-400" />
        <div className="size-3 rounded-full bg-amber-400" />
        <div className="size-3 rounded-full bg-emerald-400" />
        <span className="ml-3 text-[13px] text-[#93979f]">LearnGenie 课堂</span>
      </div>
      <div className="flex h-80">
        <div className="flex w-16 flex-col items-center gap-4 border-r border-[#cce7ff] bg-[#fafdff] p-3">
          <div className="mt-1 size-6 rounded-[8px] bg-[#e5f6ff]" />
          <div className="size-5 rounded-[6px] bg-[#ebf5ff]" />
          <div className="size-5 rounded-[6px] bg-[#ebf5ff]" />
          <div className="mt-auto mb-2 size-7 rounded-full bg-[#f4ebff]" />
        </div>
        <div className="flex flex-1 flex-col bg-white p-5">
          <div className="mb-3 h-5 w-2/3 rounded-[8px] bg-[#ebf5ff]" />
          <div className="mb-6 h-4 w-full rounded-[6px] bg-[#fafdff]" />
          <div className="mb-3 h-4 w-5/6 rounded-[6px] bg-[#fafdff]" />
          <div className="mt-auto space-y-3">
            <div className="flex items-start gap-2">
              <div className="size-6 shrink-0 rounded-full bg-[#f4ebff]" />
              <div className="rounded-[16px] rounded-tl-[4px] bg-[#fafdff] px-3 py-2">
                <div className="h-3 w-28 rounded-[4px] bg-[#e5f6ff]" />
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="size-6 shrink-0 rounded-full bg-[#e5f6ff]" />
              <div className="rounded-[16px] rounded-tl-[4px] bg-[#fafdff] px-3 py-2">
                <div className="h-3 w-36 rounded-[4px] bg-[#e5f6ff]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function LandingProductPreview() {
  const reducedMotion = useReducedMotion();

  return (
    <section className="bg-white px-4 py-24 md:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={SPRING_TRANSITION}
          className="mb-16 text-center"
        >
          <h2 className="text-[32px] font-medium leading-[1.17] -tracking-[0.02em] text-[#0a0d12] md:text-[48px] md:leading-[1.11]">
            沉浸式课堂体验
          </h2>
          <p className="mt-3 text-[16px] leading-[1.5] text-[#535862]">
            不只是看视频，而是真正参与其中的互动学习
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={SPRING_TRANSITION}
          >
            <ClassroomMockup />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={SPRING_TRANSITION}
            className="flex flex-col justify-center space-y-6"
          >
            {previews.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ ...SPRING_TRANSITION, delay: 0.2 + index * 0.12 }}
                className="flex items-start gap-4"
                whileHover={
                  reducedMotion
                    ? {}
                    : { x: 4 }
                }
              >
                <motion.div
                  className={`flex size-10 shrink-0 items-center justify-center rounded-[16px] ${item.bg}`}
                  style={{ color: item.color }}
                  whileHover={
                    reducedMotion
                      ? {}
                      : { scale: 1.1 }
                  }
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  {item.icon}
                </motion.div>
                <div>
                  <h3 className="text-[16px] font-medium leading-[1.4] text-[#0a0d12]">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-[14px] leading-[1.5] text-[#535862]">
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
