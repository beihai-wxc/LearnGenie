'use client';

import type { DocParseResult } from '@/lib/document-preview/doc-parser';

interface DocPreviewProps {
  data: DocParseResult;
}

export function DocPreview({ data }: DocPreviewProps) {
  if (!data.paragraphs.length) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-slate-400">
        文档内容为空
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      {data.paragraphs.map((p, idx) => {
        const Tag = p.heading || 'p';
        const headingClasses = {
          h1: 'text-2xl font-bold mt-6 mb-4',
          h2: 'text-xl font-semibold mt-5 mb-3',
          h3: 'text-lg font-medium mt-4 mb-2',
          p: 'text-sm leading-7 mb-3',
        };
        return (
          <Tag
            key={idx}
            className={`${headingClasses[Tag]} text-slate-800 dark:text-slate-200`}
            style={{
              fontWeight: p.bold ? 'bold' : undefined,
              fontStyle: p.italic ? 'italic' : undefined,
            }}
          >
            {p.text}
          </Tag>
        );
      })}
    </div>
  );
}
