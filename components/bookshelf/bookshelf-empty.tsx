'use client';

import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BookshelfEmptyProps {
  onUploadClick: () => void;
  className?: string;
}

export function BookshelfEmpty({ onUploadClick, className }: BookshelfEmptyProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-20', className)}>
      <button
        type="button"
        onClick={onUploadClick}
        className="flex size-48 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-sky-300 transition-all hover:border-sky-400 hover:bg-sky-50 dark:border-sky-700 dark:hover:border-sky-600 dark:hover:bg-sky-950/30"
      >
        <div className="flex size-16 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400">
          <Upload className="size-8" />
        </div>
        <p className="mt-4 text-base font-medium text-sky-600 dark:text-sky-400">
          添加文档到书架
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          支持 PDF、ZIP、DOC、PPT 等格式
        </p>
      </button>
    </div>
  );
}
