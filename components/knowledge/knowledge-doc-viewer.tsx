'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, BookOpen, Sparkles } from 'lucide-react';
import { nanoid } from 'nanoid';
import type { UserRequirements } from '@/lib/types/generation';

interface KnowledgeDocViewerProps {
  docId: string;
  title: string;
  module: string;
  summary: string;
  keywords: string[];
  fullText: string;
  pdfUrl: string;
  recommendedRequirement: string;
  sourceLabel?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  recommendedTeachingGoals?: string[];
}

export function KnowledgeDocViewer({
  title,
  module,
  summary,
  keywords,
  fullText,
  pdfUrl,
  recommendedRequirement,
  sourceLabel,
  difficulty,
  recommendedTeachingGoals,
}: KnowledgeDocViewerProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    const requirements: UserRequirements = {
      requirement: recommendedRequirement,
    };
    sessionStorage.setItem(
      'generationSession',
      JSON.stringify({
        sessionId: nanoid(),
        requirements,
        pdfText: fullText,
        knowledgeContextSources: [title],
        knowledgeSafetyNote: '当前课堂将直接基于所选知识库文档生成，并以该文档内容为主要依据。',
        pdfImages: [],
        imageStorageIds: [],
        sceneOutlines: null,
        currentStep: 'generating',
      }),
    );
    router.push('/generation-preview');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <div className="mb-5 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <ArrowLeft className="size-4" />
            返回
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-sky-400 dark:text-slate-950"
          >
            <Sparkles className="size-4" />
            {isGenerating ? '正在生成课程...' : '基于此文档生成课堂'}
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300">
              <BookOpen className="size-3.5" />
              知识库文档
            </div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">{title}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{module}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {sourceLabel ? (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {sourceLabel}
                </span>
              ) : null}
              {difficulty ? (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                  {difficulty === 'beginner'
                    ? '入门难度'
                    : difficulty === 'intermediate'
                      ? '进阶难度'
                      : '高级难度'}
                </span>
              ) : null}
            </div>
            <p className="mt-5 text-sm leading-7 text-slate-700 dark:text-slate-300">{summary}</p>

            <div className="mt-6">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">关键词</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {keywords.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>

            {recommendedTeachingGoals?.length ? (
              <div className="mt-6">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">推荐课堂目标</h2>
                <div className="mt-3 space-y-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {recommendedTeachingGoals.map((goal) => (
                    <div key={goal}>- {goal}</div>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>

          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="border-b border-slate-200 px-5 py-3 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
              PDF 预览
            </div>
            <iframe src={pdfUrl} title={title} className="h-[78vh] w-full bg-white" />
          </section>
        </div>
      </div>
    </div>
  );
}
