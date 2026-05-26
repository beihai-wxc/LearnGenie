'use client';

import type { AgentWorkflowSnapshot } from '@/lib/agents/types';
import { ProfileSummaryCard } from './profile-summary-card';

export function AgentWorkflowPanel({ workflow }: { workflow: AgentWorkflowSnapshot }) {
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
      <ProfileSummaryCard profile={workflow.profile.data} />
    </div>
  );
}
