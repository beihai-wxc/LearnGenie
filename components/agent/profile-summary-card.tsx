'use client';

import type { LearnerProfileSnapshot } from '@/lib/agents/types';

export function ProfileSummaryCard({ profile }: { profile: LearnerProfileSnapshot }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-950/70">
      <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
        学习画像 Agent
      </div>
      <div className="mt-2 text-base font-semibold text-slate-900 dark:text-slate-100">
        {profile.nickname ? `${profile.nickname} 的学习画像摘要` : '当前学习画像摘要'}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-300">
        {profile.summaryLines.length > 0 ? (
          profile.summaryLines.slice(0, 3).map((line) => (
            <span
              key={line}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
            >
              {line}
            </span>
          ))
        ) : (
          <div className="text-sm">画像信息较少，系统会继续自动补全。</div>
        )}
      </div>
      {profile.inferredFromDialogue.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {profile.inferredFromDialogue.slice(0, 3).map((field) => (
            <span
              key={field}
              className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] text-sky-700 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-300"
            >
              {field}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
