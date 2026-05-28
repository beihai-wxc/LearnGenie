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
    <nav
      className={`fixed left-1/2 top-5 z-50 w-[calc(100%-32px)] max-w-[980px] -translate-x-1/2 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        hidden ? '-translate-y-[calc(100%+24px)]' : 'translate-y-0'
      }`}
    >
      <div
        className={`flex h-14 items-center rounded-2xl px-6 transition-all duration-500 ${
          scrolledPastHero
            ? 'bg-white/70 shadow-[0_2px_20px_rgba(0,0,0,0.06),0_0_0_1px_rgba(255,255,255,0.5)] backdrop-blur-xl'
            : 'bg-white/90 shadow-[0_2px_20px_rgba(0,0,0,0.08),0_0_0_1px_rgba(255,255,255,0.6)] backdrop-blur-xl'
        }`}
      >
        <a href="/" className="flex items-center shrink-0">
          <img src="/logo-horizontal.png" alt="LearnGenie" className="h-5.5 w-auto" />
        </a>
        <div className="flex-1 flex items-center justify-center gap-7">
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="text-[13px] font-semibold tracking-wide text-[#6b6b80] transition-all duration-200 hover:text-[#3a3a50]"
          >
            首页
          </a>
          <a href="#features" className="text-[13px] font-semibold tracking-wide text-[#6b6b80] transition-all duration-200 hover:text-[#3a3a50]">
            功能
          </a>
          <a href="#how-it-works" className="text-[13px] font-semibold tracking-wide text-[#6b6b80] transition-all duration-200 hover:text-[#3a3a50]">
            工作流
          </a>
          <a href="#faq" className="text-[13px] font-semibold tracking-wide text-[#6b6b80] transition-all duration-200 hover:text-[#3a3a50]">
            常见问题
          </a>
        </div>
        <button
          onClick={() => router.push('/login')}
          className="shrink-0 rounded-xl bg-gradient-to-r from-[#6c3bff] to-[#a855f7] px-4 py-2 text-[13px] font-bold tracking-wide text-white shadow-[0_4px_14px_rgba(108,59,255,0.3)] transition-all duration-200 hover:shadow-[0_6px_20px_rgba(108,59,255,0.4)] hover:brightness-110"
        >
          登录
        </button>
      </div>
    </nav>
  );
}