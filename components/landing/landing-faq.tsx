'use client';

import { useState } from 'react';
import { motion } from 'motion/react';

const FAQS = [
  {
    q: 'LearnGenie 是免费的吗？',
    a: '是的，完全免费。你可以自由使用，无需支付任何费用。',
  },
  {
    q: 'AI 生成的课堂内容准确吗？',
    a: 'LearnGenie 采用知识库驱动的方式确保内容质量。你可以上传教材、论文等参考资料，AI 会基于这些资料生成课堂内容，做到有据可依。同时多智能体协作机制会从不同角度交叉验证知识点，减少单点错误。',
  },
  {
    q: '数据安全吗？',
    a: '非常安全。所有学习数据（课堂内容、学习画像、上传资料）均存储在浏览器的本地数据库中，不上传到任何第三方服务器。AI 模型调用仅传输必要的生成指令，你的资料始终在你的控制之下。',
  },
  {
    q: '一次能生成多大的课堂？',
    a: '课堂规模根据你的学习主题和上传资料自动规划。从快速了解一个概念（几页课件 + 测验），到深入学习一个知识领域（几十页的完整课程），AI 会根据内容复杂度灵活调整，确保既不冗余也不遗漏重点。',
  },
];

export function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="bg-gradient-to-b from-[#f6fafd] to-white px-4 py-24 md:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-12 text-center">
          <h2 className="text-[32px] font-medium leading-[1.17] -tracking-[0.02em] text-[#0a0d12] md:text-[48px] md:leading-[1.11]">
            Q&A
          </h2>
        </div>

        <div className="flex flex-col gap-4">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="rounded-[32px] bg-[#fcfcfd]"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-[32px] py-8 text-left md:px-[40px]"
                >
                  <span className="text-[16px] font-medium text-[#0a0d12] md:text-[18px]">
                    {faq.q}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ duration: 0.25 }}
                    className="shrink-0 text-[#a4a7ae]"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                  <p className="px-[32px] pb-8 text-[14px] leading-[1.7] text-[#93979f] md:px-[40px] md:text-[16px]">
                    {faq.a}
                  </p>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
