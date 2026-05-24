'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export function LandingNavbar() {
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  let lastY = 0;

  const handleScroll = useCallback(() => {
    const y = window.scrollY;
    setHidden(y > 80 && y > lastY);
    setScrolledPastHero(y > window.innerHeight * 0.5);
    lastY = y;
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <>
      <nav
        className={`fixed left-1/2 top-6 z-50 w-[calc(100%-32px)] max-w-[1002px] -translate-x-1/2 transition-transform ${
          hidden ? '-translate-y-[calc(100%+24px)]' : ''
        }`}
        style={{
          transitionDuration: '400ms',
          transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          className={`flex h-16 items-center rounded-[32px] px-8 shadow-[0_1px_1px_#f4f5f6] ${
            scrolledPastHero ? 'bg-white/90' : 'bg-white'
          }`}
        >
          <a href="/" className="flex items-center shrink-0">
            <img
              src="/logo-horizontal.png"
              alt="LearnGenie"
              className="h-6 w-auto"
            />
          </a>
          <div className="flex-1 flex items-center justify-center gap-8">
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="text-[14px] font-medium text-[#93979f] transition-colors hover:text-[#535862]"
            >
              首页
            </a>
            <a href="#features" className="text-[14px] font-medium text-[#93979f] transition-colors hover:text-[#535862]">
              功能介绍
            </a>
            <a href="#how-it-works" className="text-[14px] font-medium text-[#93979f] transition-colors hover:text-[#535862]">
              使用流程
            </a>
            <a href="#faq" className="text-[14px] font-medium text-[#93979f] transition-colors hover:text-[#535862]">
              Q&A
            </a>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="shrink-0 rounded-[16px] bg-[#181d27] px-4 py-2 text-[14px] font-semibold text-white transition-all hover:bg-[#0a0d12]"
          >
            登录 / 注册
          </button>
        </div>
      </nav>
    </>
  );
}
