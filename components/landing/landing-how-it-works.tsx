'use client';

import { motion } from 'motion/react';
import { FileText, Sparkles, Users } from 'lucide-react';

const steps = [
  {
    step: '01',
    icon: <FileText className="size-6" />,
    title: '输入学习主题',
    description: '输入任何想学的内容，或上传 PDF、Word 等学习资料，AI 自动解析要点。',
    color: '#0069e0',
    bg: 'bg-[#e5f6ff]',
  },
  {
    step: '02',
    icon: <Sparkles className="size-6" />,
    title: 'AI 智能生成',
    description: '多个 AI 智能体协作，自动生成包含课件、测验、讨论的完整互动课堂。',
    color: '#0069e0',
    bg: 'bg-[#e5f6ff]',
  },
  {
    step: '03',
    icon: <Users className="size-6" />,
    title: '沉浸式互动学习',
    description: '进入课堂，与 AI 教师和同学实时互动，在看、听、练中掌握知识。',
    color: '#f26110',
    bg: 'bg-[#fff2eb]',
  },
];

const stats = [
  { value: '5', label: '智能体角色' },
  { value: '多门课程', label: '知识库容量' },
  { value: '免费', label: '使用' },
];

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="bg-gradient-to-b from-white to-[#f6fafd] px-4 py-24 md:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <h2 className="text-[32px] font-medium leading-[1.17] -tracking-[0.02em] text-[#0a0d12] md:text-[48px] md:leading-[1.11]">
            三步开启学习
          </h2>
          <p className="mt-3 text-[16px] leading-[1.5] text-[#535862]">
            从想法到互动课堂，只需要几分钟
          </p>
        </motion.div>

        <div className="relative mb-20">
          <div className="absolute left-0 right-0 top-16 hidden h-px bg-gradient-to-r from-transparent via-[#cce7ff] to-transparent lg:block" />
          <div className="grid gap-8 lg:grid-cols-3">
            {steps.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative flex flex-col items-center text-center"
              >
                <div
                  className={`relative z-10 mb-6 flex size-16 items-center justify-center rounded-[16px] ${item.bg}`}
                  style={{ color: item.color }}
                >
                  {item.icon}
                  <span
                    className="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: item.color }}
                  >
                    {index + 1}
                  </span>
                </div>
                <h3 className="mb-3 text-[18px] font-medium leading-[1.25] -tracking-[0.02em] text-[#0a0d12]">
                  {item.title}
                </h3>
                <p className="max-w-xs text-[14px] leading-[1.5] text-[#535862]">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-[32px] bg-white px-8 py-10"
          style={{ boxShadow: 'rgba(4, 69, 144, 0.06) 0px 8px 20px 2px' }}
        >
          <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-[32px] font-medium leading-[1.17] -tracking-[0.02em] text-blue-600">
                  {stat.value}
                </div>
                <div className="mt-1 text-[14px] text-[#535862]">
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
