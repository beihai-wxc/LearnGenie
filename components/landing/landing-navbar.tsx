'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function LandingNavbar() {
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  let lastY = 0;

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(y > 80 && y > lastY);
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed left-1/2 top-6 z-50 w-[calc(100%-32px)] max-w-[1002px] -translate-x-1/2 transition-transform duration-400 ${
        hidden ? '-translate-y-[calc(100%+24px)]' : ''
      }`}
    >
      <div className="flex h-16 items-center justify-between rounded-[32px] bg-white px-8 shadow-[0_1px_1px_#f4f5f6]">
        <div className="flex items-center gap-14">
          <a href="/" className="flex items-center">
            <img
              src="/logo-horizontal.png"
              alt="LearnGenie"
              className="h-6 w-auto"
            />
          </a>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-[14px] font-medium text-[#93979f] transition-colors hover:text-[#535862]">
              功能介绍
            </a>
            <a href="#how-it-works" className="text-[14px] font-medium text-[#93979f] transition-colors hover:text-[#535862]">
              使用流程
            </a>
          </div>
        </div>
        <button
          onClick={() => router.push('/login')}
          className="rounded-[16px] bg-[#181d27] px-4 py-2 text-[14px] font-semibold text-white transition-all hover:bg-[#0a0d12]"
        >
          登录 / 注册
        </button>
      </div>
    </nav>
  );
}
