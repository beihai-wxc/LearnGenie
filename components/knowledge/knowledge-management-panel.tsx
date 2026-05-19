'use client';

import { useMemo, useState } from 'react';
import type { KnowledgeDocument } from '@/lib/knowledge-base/types';

interface KnowledgeManagementPanelProps {
  documents: KnowledgeDocument[];
  chapterCount: number;
  lastIndexedAt?: string;
}

const stageLabels = {
  foundation: '基础阶段',
  core: '核心阶段',
  practice: '实践阶段',
} as const;

const resourceLabels: Record<string, string> = {
  lecture: '讲解文档',
  mindmap: '思维导图',
  quiz: '练习题',
  reading: '拓展阅读',
  'code-lab': '代码实操',
  project: '实践项目',
  'video-script': '视频脚本',
};

export function KnowledgeManagementPanel({
  documents,
  chapterCount,
  lastIndexedAt,
}: KnowledgeManagementPanelProps) {
  const [stageFilter, setStageFilter] = useState<'all' | 'foundation' | 'core' | 'practice'>('all');

  const stats = useMemo(() => {
    const resourceTypeSet = new Set<string>();
    const chapterSet = new Set<string>();
    const stageCount = { foundation: 0, core: 0, practice: 0 };
    for (const doc of documents) {
      if (doc.chapterId) chapterSet.add(doc.chapterId);
      if (doc.learningStage) stageCount[doc.learningStage] += 1;
      for (const type of doc.resourceTypes ?? []) {
        resourceTypeSet.add(type);
      }
    }
    return {
      resourceTypeCount: resourceTypeSet.size,
      chapterCoverage: chapterSet.size,
      stageCount,
    };
  }, [documents]);

  const filteredDocuments = useMemo(
    () =>
      documents.filter((doc) => stageFilter === 'all' || doc.learningStage === stageFilter),
    [documents, stageFilter],
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50 px-4 py-8 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 md:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/85">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-700 dark:text-sky-300">
            Knowledge Management
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-slate-50">
            人工智能课程知识库总览
          </h1>
          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
            这里展示当前参赛系统的课程知识底座，包括章节覆盖、资源类型覆盖和课程文档清单。
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>文档数：{documents.length}</span>
            <span>课程章节：{chapterCount}</span>
            <span>已覆盖章节：{stats.chapterCoverage}</span>
            <span>资源类型：{stats.resourceTypeCount}</span>
            {lastIndexedAt ? <span>最近重建：{new Date(lastIndexedAt).toLocaleString()}</span> : null}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: '基础阶段', value: stats.stageCount.foundation },
            { label: '核心阶段', value: stats.stageCount.core },
            { label: '实践阶段', value: stats.stageCount.practice },
            { label: '资源类型数', value: stats.resourceTypeCount },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80"
            >
              <div className="text-sm text-slate-500 dark:text-slate-400">{item.label}</div>
              <div className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-50">
                {item.value}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: '全部' },
              { key: 'foundation', label: '基础阶段' },
              { key: 'core', label: '核心阶段' },
              { key: 'practice', label: '实践阶段' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() =>
                  setStageFilter(item.key as 'all' | 'foundation' | 'core' | 'practice')
                }
                className={`rounded-full px-4 py-2 text-sm transition ${
                  stageFilter === item.key
                    ? 'bg-slate-900 text-white dark:bg-sky-400 dark:text-slate-950'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.docId}
                className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-950/50"
              >
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    {doc.sourceLabel || '核心知识'}
                  </span>
                  {doc.learningStage ? (
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300">
                      {stageLabels[doc.learningStage]}
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {doc.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {doc.chapterTitle || doc.module}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {doc.summary}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(doc.resourceTypes ?? []).map((type) => (
                    <span
                      key={type}
                      className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                    >
                      {resourceLabels[type] || type}
                    </span>
                  ))}
                  {doc.estimatedStudyTimeMinutes ? (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                      {doc.estimatedStudyTimeMinutes} 分钟
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
