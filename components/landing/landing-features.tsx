'use client';

import { motion } from 'motion/react';
import { Users, Library, Presentation, TrendingUp } from 'lucide-react';

const features = [
  {
    icon: <Users className="size-6" />,
    title: 'AI 多智能体课堂',
    description: '多个 AI 智能体协同教学——教师讲解、助教答疑、同学讨论，让学习不再孤单。',
    gradient: 'linear-gradient(rgb(244, 235, 255) 0%, rgb(228, 204, 255) 100%)',
    iconBg: 'bg-[#f4ebff] text-[#9552e0]',
  },
  {
    icon: <Library className="size-6" />,
    title: '知识库驱动学习',
    description: '上传文档或接入知识库，AI 自动提取要点，生成个性化的、有据可依的课程内容。',
    gradient: 'linear-gradient(rgb(229, 246, 255) 0%, rgb(194, 233, 255) 100%)',
    iconBg: 'bg-[#e5f6ff] text-[#0069e0]',
  },
  {
    icon: <Presentation className="size-6" />,
    title: '互动式课件生成',
    description: '从一段描述或一份 PDF 出发，一键生成包含幻灯片、测验和白板的完整课堂。',
    gradient: 'linear-gradient(rgb(255, 249, 224) 0%, rgb(255, 236, 163) 100%)',
    iconBg: 'bg-[#fff9e0] text-[#bb9915]',
  },
  {
    icon: <TrendingUp className="size-6" />,
    title: '学习画像与追踪',
    description: '每一次学习都会更新你的专属学习画像，让 AI 越来越懂你，课程越来越精准。',
    gradient: 'linear-gradient(rgb(255, 242, 235) 0%, rgb(255, 209, 184) 100%)',
    iconBg: 'bg-[#fff2eb] text-[#f26110]',
  },
];

function FeatureCard({
  icon,
  title,
  description,
  iconBg,
  index,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconBg: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
      className="group rounded-[32px] bg-[#fafdff] p-10 transition-all duration-300 hover:-translate-y-1"
      style={{ boxShadow: 'rgba(4, 69, 144, 0.08) 0px 14px 20px 4px' }}
    >
      <div className={`mb-6 inline-flex size-12 items-center justify-center rounded-[16px] ${iconBg}`}>
        {icon}
      </div>
      <h3 className="mb-3 text-[18px] font-medium leading-[1.25] -tracking-[0.02em] text-[#0a0d12]">
        {title}
      </h3>
      <p className="text-[14px] leading-[1.5] text-[#535862]">
        {description}
      </p>
    </motion.div>
  );
}

export function LandingFeatures() {
  return (
    <section className="bg-white px-4 py-24 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="text-[32px] font-medium leading-[1.17] -tracking-[0.02em] text-[#0a0d12] md:text-[48px] md:leading-[1.11]">
            为什么选择 LearnGenie
          </h2>
          <p className="mt-3 text-[16px] leading-[1.5] text-[#535862]">
            不只是内容生成，而是完整的互动学习体验
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
