'use client';

import { motion } from 'motion/react';
import { GraduationCap, BookOpenText, FileSearch, Code2 } from 'lucide-react';

const useCases = [
  {
    icon: <GraduationCap className="size-6" />,
    title: '考试复习',
    description: '上传课程笔记或教材 PDF，AI 自动生成复习课件和测验题，帮助高效备考。',
    iconBg: 'bg-[#f4ebff] text-[#9552e0]',
  },
  {
    icon: <BookOpenText className="size-6" />,
    title: '知识探索',
    description: '对某个话题感兴趣？输入关键词，AI 智能体围绕主题展开讨论式教学，深入浅出。',
    iconBg: 'bg-[#e5f6ff] text-[#0069e0]',
  },
  {
    icon: <FileSearch className="size-6" />,
    title: '文档学习',
    description: '读完一篇论文或报告却抓不住重点？让 AI 帮你拆解结构、提炼要点、生成总结。',
    iconBg: 'bg-[#d3f6e3] text-[#0d9e6b]',
  },
  {
    icon: <Code2 className="size-6" />,
    title: '技能入门',
    description: '想学编程、设计或任何技能？AI 为你定制循序渐进的学习路径和动手练习。',
    iconBg: 'bg-[#fff2eb] text-[#f26110]',
  },
];

export function LandingUseCases() {
  return (
    <section className="bg-[#ebf5ff] px-4 py-24 md:px-8">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <h2 className="text-[32px] font-medium leading-[1.17] -tracking-[0.02em] text-[#0a0d12] md:text-[48px] md:leading-[1.11]">
            适用多种学习场景
          </h2>
          <p className="mt-3 text-[16px] leading-[1.5] text-[#535862]">
            无论你想学什么，LearnGenie 都能为你打造专属课堂
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {useCases.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group rounded-[32px] bg-[#fafdff] p-8 transition-all hover:-translate-y-1"
              style={{ boxShadow: 'rgba(4, 69, 144, 0.08) 0px 14px 20px 4px' }}
            >
              <div className={`mb-5 inline-flex size-12 items-center justify-center rounded-[16px] ${item.iconBg}`}>
                {item.icon}
              </div>
              <h3 className="mb-3 text-[18px] font-medium leading-[1.25] -tracking-[0.02em] text-[#0a0d12]">
                {item.title}
              </h3>
              <p className="text-[14px] leading-[1.5] text-[#535862]">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
