'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export function LandingFooter() {
  const router = useRouter();

  return (
    <footer>
      {/* CTA Section */}
      <section className="bg-gradient-to-b from-[#f6fafd] via-[#d6ecff]/30 to-white px-4 pt-24 pb-16 md:pt-28">
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-[32px] font-medium leading-[1.17] -tracking-[0.02em] text-[#0a0d12] md:text-[48px] md:leading-[1.11]">
              开启你的 AI 学习之旅
            </h2>
            <p className="mt-3 text-[16px] leading-[1.5] text-[#535862]">
              带上学问，我们帮你生成智慧
            </p>
            <button
              onClick={() => router.push('/register')}
              className="mt-10 inline-flex h-12 items-center gap-2 rounded-[32px] bg-[#181d27] px-8 text-[14px] font-semibold text-white shadow-[0_1px_2px_rgba(10,13,18,0.8),0_0_0_1px_#0a0d12] transition-all hover:bg-[#0a0d12]"
            >
              注册 / 登录
              <ArrowRight className="size-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Bottom bar */}
      <div className="bg-white px-4 pb-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <img
              src="/logo-horizontal.png"
              alt="LearnGenie"
              className="h-5 w-auto opacity-50"
            />
            <span className="text-[13px] text-[#93979f]">
              immersive AI classroom
            </span>
          </div>
          <p className="text-[13px] text-[#93979f]">
            &copy; {new Date().getFullYear()} LearnGenie. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
