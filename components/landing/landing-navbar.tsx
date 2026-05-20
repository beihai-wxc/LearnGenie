'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function LandingNavbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'border-b border-[#cce7ff] bg-white/80 backdrop-blur-xl'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:px-8">
        <a href="/" className="flex items-center gap-2">
          <img
            src="/logo-horizontal.png"
            alt="LearnGenie"
            className="h-7 w-auto"
          />
        </a>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/login')}
            className="rounded-[36px] bg-[#181d27] px-6 py-2 text-[14px] font-medium text-white transition-all hover:bg-[#0a0d12]"
            style={{ boxShadow: 'rgba(10, 13, 18, 0.08) 0px 1px 2px 0px, rgb(10, 13, 18) 0px 0px 0px 1px' }}
          >
            登录 / 注册
          </button>
        </div>
      </div>
    </nav>
  );
}
