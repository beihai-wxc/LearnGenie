'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PptxParseResult } from '@/lib/document-preview/pptx-parser';

interface PptxPreviewProps {
  data: PptxParseResult;
}

export function PptxPreview({ data }: PptxPreviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = data.slides;

  if (!slides.length) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-slate-400">
        幻灯片内容为空
      </div>
    );
  }

  const slide = slides[currentSlide];
  const aspectRatio = data.width / data.height;

  const goPrev = () => setCurrentSlide((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentSlide((i) => Math.min(slides.length - 1, i + 1));

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Slide viewport */}
      <div
        className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"
        style={{ aspectRatio: `${aspectRatio}` }}
      >
        {slide.elements.map((el, idx) => (
          <div
            key={idx}
            className="absolute"
            style={{
              left: `${(el.x / data.width) * 100}%`,
              top: `${(el.y / data.height) * 100}%`,
              width: `${(el.width / data.width) * 100}%`,
              height: `${(el.height / data.height) * 100}%`,
            }}
          >
            {el.type === 'text' && (
              <div className="h-full w-full overflow-hidden text-sm text-slate-800 dark:text-slate-200">
                {el.content}
              </div>
            )}
            {el.type === 'image' && el.src && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={el.src} alt="" className="h-full w-full object-contain" />
            )}
            {el.type === 'shape' && (
              <div className="h-full w-full" style={(el.style as React.CSSProperties) || {}} />
            )}
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={goPrev}
          disabled={currentSlide === 0}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <ChevronLeft className="size-4" />
          上一页
        </button>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {currentSlide + 1} / {slides.length}
        </span>
        <button
          type="button"
          onClick={goNext}
          disabled={currentSlide === slides.length - 1}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          下一页
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
