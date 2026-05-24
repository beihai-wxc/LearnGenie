'use client';

import { useRef, useState, useEffect, useCallback } from 'react';

export function useElementScrollProgress() {
  const ref = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);

  const handleScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const elementHeight = rect.height;
    const elementTop = rect.top;
    const scrolled = -elementTop + windowHeight;
    const total = elementHeight + windowHeight;
    const p = Math.min(Math.max(scrolled / total, 0), 1);
    setProgress(p);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return { ref, progress };
}
