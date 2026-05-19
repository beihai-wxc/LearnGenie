'use client';

import type { AgentWorkflowSnapshot } from '@/lib/agents/types';
import { ProfileSummaryCard } from './profile-summary-card';

export function AgentWorkflowPanel({ workflow }: { workflow: AgentWorkflowSnapshot }) {
  const path = workflow.planning.data.recommendedPath;
  return (
    <div className="space-y-4 rounded-[28px] border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          系统 Agent 工作流
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {['画像分析', '知识检索', '路径规划', '资源规划', '审校'].map((step) => (
            <span
              key={step}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
            >
              {step}
            </span>
          ))}
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <ProfileSummaryCard profile={workflow.profile.data} />
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-950/70">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            个性化学习路径
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {path?.title || workflow.planning.data.title}
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {(path?.steps ?? []).slice(0, 3).map((step, index) => (
              <div
                key={`${step.chapterId}-${index}`}
                className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-900/60"
              >
                <div className="text-[11px] font-medium text-sky-700 dark:text-sky-300">
                  Step {index + 1}
                </div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {step.chapterTitle}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {step.recommendedResources.slice(0, 2).map((resource) => (
                    <span
                      key={resource}
                      className="rounded-full border border-slate-200 px-2 py-1 text-[10px] text-slate-500 dark:border-slate-700 dark:text-slate-400"
                    >
                      {resource}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {!(path?.steps?.length) ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-3 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                已根据当前主题完成轻量学习路径规划。
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
