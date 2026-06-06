'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { useReducedMotion } from '@/lib/hooks/use-reduced-motion';

const IMAGES = [
  '/carousel/屏幕截图 2026-05-30 215716.webp',
  '/carousel/屏幕截图 2026-05-30 220545.webp',
  '/carousel/屏幕截图 2026-05-30 220712.webp',
  '/carousel/屏幕截图 2026-05-30 221610.webp',
];

const INTERVAL = 2500;

function ImageCarousel() {
  const [current, setCurrent] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Record<number, boolean>>({});
  const [errorImages, setErrorImages] = useState<Record<number, boolean>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reducedMotion = useReducedMotion();

  const goTo = useCallback((index: number) => {
    setCurrent((index + IMAGES.length) % IMAGES.length);
  }, []);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  const togglePlay = () => setIsPlaying((p) => !p);

  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(next, INTERVAL);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, next]);

  const handleLoad = (index: number) => setLoadedImages((prev) => ({ ...prev, [index]: true }));
  const handleError = (index: number) => setErrorImages((prev) => ({ ...prev, [index]: true }));

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-[#f0eef5]" style={{ boxShadow: '0 8px 32px rgba(124, 58, 237, 0.06)' }}>
      {/* Window bar */}
      <div className="flex items-center justify-between border-b border-[#f0eef5] px-5 py-3 bg-white/50">
        <div className="flex items-center gap-2">
          <div className="size-3 rounded-full bg-red-400/80" />
          <div className="size-3 rounded-full bg-amber-400/80" />
          <div className="size-3 rounded-full bg-emerald-400/80" />
        </div>
        <span className="text-[12px] font-medium text-[#9090a8]">LearnGenie 课堂</span>
        <button
          onClick={togglePlay}
          className="flex items-center justify-center size-6.5 rounded-full bg-violet-50 hover:bg-violet-100 transition-colors"
          title={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? <Pause className="size-3 text-[#7c3aed]" /> : <Play className="size-3 text-[#7c3aed] ml-0.5" />}
        </button>
      </div>

      {/* Image area */}
      <div className="relative h-80 w-full bg-[#f8f5ff]/50">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: reducedMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: reducedMotion ? 0 : 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.4, ease: 'easeInOut' }}
            className="absolute inset-0 flex items-center justify-center p-4"
          >
            {errorImages[current] ? (
              <div className="flex flex-col items-center gap-3 text-[#a0a0b8]">
                <ImageOff className="size-12 opacity-40" />
                <p className="text-sm">图片加载失败</p>
              </div>
            ) : (
              <img
                src={IMAGES[current]}
                alt={`LearnGenie 课堂预览 ${current + 1}`}
                className="max-h-full max-w-full object-contain rounded-lg"
                onLoad={() => handleLoad(current)}
                onError={() => handleError(current)}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation arrows */}
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-md border border-[#f0eef5] text-[#6b6b80] hover:bg-white hover:text-[#1a1a2e] transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="上一张"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex size-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-md border border-[#f0eef5] text-[#6b6b80] hover:bg-white hover:text-[#1a1a2e] transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
          aria-label="下一张"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Indicators */}
      <div className="flex items-center justify-center gap-2 px-5 py-3 bg-white/50 border-t border-[#f0eef5]">
        {IMAGES.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === current
                ? 'w-6 bg-gradient-to-r from-[#7c3aed] to-[#a855f7]'
                : 'w-1.5 bg-[#d4d0dc] hover:bg-[#b8b4c4]'
            }`}
            aria-label={`切换到第 ${index + 1} 张`}
          />
        ))}
      </div>
    </div>
  );
}

export { ImageCarousel };
