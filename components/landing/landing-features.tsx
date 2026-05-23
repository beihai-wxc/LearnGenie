'use client';

import { motion } from 'motion/react';
import { Users, Library, Presentation, TrendingUp, CalendarCheck } from 'lucide-react';

const FEATURES = [
  { icon: <Users className="size-6" />, title: 'AI 多智能体课堂', description: '多个 AI 智能体协同教学——教师讲解、助教答疑、同学讨论，让学习不再孤单。', iconBg: 'bg-[#e5f6ff] text-[#0069e0]', cardBg: 'bg-[#fafdff]' },
  { icon: <Library className="size-6" />, title: '知识库驱动学习', description: '上传文档或接入知识库，AI 自动提取要点，生成个性化的、有据可依的课程内容。', iconBg: 'bg-[#e5f6ff] text-[#0069e0]', cardBg: 'bg-[#f0f8ff]' },
  { icon: <Presentation className="size-6" />, title: '互动式课件生成', description: '从一段描述或一份 PDF 出发，一键生成包含幻灯片、测验和白板的完整课堂。', iconBg: 'bg-[#fff9e0] text-[#bb9915]', cardBg: 'bg-[#fefce8]' },
  { icon: <TrendingUp className="size-6" />, title: '学习画像与追踪', description: '每一次学习都会更新你的专属学习画像，让 AI 越来越懂你，课程越来越精准。', iconBg: 'bg-[#fff2eb] text-[#f26110]', cardBg: 'bg-[#fff7ed]' },
  { icon: <CalendarCheck className="size-6" />, title: '个性化学习规划', description: 'AI 根据你的学习画像和薄弱环节，自动生成专属学习路径和每日任务，循序渐进达成目标。', iconBg: 'bg-[#d3f6e3] text-[#0d9e6b]', cardBg: 'bg-[#f0fdf4]' },
];

export function LandingFeatures() {
  return (
    <section id="features" className="bg-white px-4 py-24 md:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <h2 className="text-[32px] font-medium leading-[1.17] -tracking-[0.02em] text-[#0a0d12] md:text-[48px] md:leading-[1.11]">
            为什么选择 LearnGenie
          </h2>
          <p className="mt-3 text-[16px] leading-[1.5] text-[#535862]">
            不只是内容生成，而是完整的互动学习体验
          </p>
        </motion.div>

        <div className="flex flex-col gap-6">
          {/* Row 1 - slide from left */}
          <motion.div
            initial={{ opacity: 0, x: -800 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="flex flex-wrap justify-center gap-6"
          >
            {FEATURES.slice(0, 3).map((f) => (
              <motion.div
                key={f.title}
                className={`group w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] rounded-[32px] p-10 transition-all duration-300 hover:-translate-y-1 ${f.cardBg}`}
                style={{ boxShadow: 'rgba(4, 69, 144, 0.06) 0px 8px 20px 2px' }}
              >
                <div className={`mb-6 inline-flex size-12 items-center justify-center rounded-[16px] ${f.iconBg}`}>{f.icon}</div>
                <h3 className="mb-3 text-[18px] font-medium leading-[1.25] -tracking-[0.02em] text-[#0a0d12]">{f.title}</h3>
                <p className="text-[14px] leading-[1.5] text-[#535862]">{f.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Row 2 - slide from right */}
          <motion.div
            initial={{ opacity: 0, x: 800 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.15 }}
            className="flex flex-wrap justify-center gap-6"
          >
            {FEATURES.slice(3).map((f) => (
              <motion.div
                key={f.title}
                className={`group w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] rounded-[32px] p-10 transition-all duration-300 hover:-translate-y-1 ${f.cardBg}`}
                style={{ boxShadow: 'rgba(4, 69, 144, 0.06) 0px 8px 20px 2px' }}
              >
                <div className={`mb-6 inline-flex size-12 items-center justify-center rounded-[16px] ${f.iconBg}`}>{f.icon}</div>
                <h3 className="mb-3 text-[18px] font-medium leading-[1.25] -tracking-[0.02em] text-[#0a0d12]">{f.title}</h3>
                <p className="text-[14px] leading-[1.5] text-[#535862]">{f.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
