'use client';

import type { AgentWorkflowSnapshot } from '@/lib/agents/types';
import { ProfileSummaryCard } from './profile-summary-card';
import { ResourceBundleView } from './resource-bundle-view';

export function AgentWorkflowPanel({ workflow }: { workflow: AgentWorkflowSnapshot }) {
  return (
    <div className="mt-5 space-y-4 rounded-[32px] border border-slate-200/70 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          系统 Agent 工作流
        </div>
        <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          已按“画像分析 → 知识检索 → 路径规划 → 资源规划 → 审校”完成一轮学习决策。
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <ProfileSummaryCard profile={workflow.profile.data} />
        <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-950/70">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            检索与审校 Agent
          </div>
          <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            {workflow.planning.data.summary}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {workflow.retrieval.sources.map((source) => (
              <span
                key={`${source.docId}-${source.chunkId ?? 'doc'}`}
                className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300"
              >
                {source.title}
              </span>
            ))}
          </div>
          <div className="mt-3 space-y-2 text-xs text-slate-500 dark:text-slate-400">
            {workflow.review.data.supportedClaims.map((claim) => (
              <div key={claim}>- {claim}</div>
            ))}
            {workflow.review.data.unsupportedClaims.map((claim) => (
              <div key={claim} className="text-amber-700 dark:text-amber-300">
                - {claim}
              </div>
            ))}
          </div>
        </div>
      </div>
      <ResourceBundleView resources={workflow.resources.data} />
    </div>
  );
}
