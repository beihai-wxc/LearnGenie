'use client';

import type { ResourceBundleData } from '@/lib/agents/types';

const labels: Record<string, string> = {
  lecture: '讲解文档',
  mindmap: '思维导图',
  quiz: '练习题',
  reading: '拓展阅读',
  'code-lab': '代码实操',
  project: '实践项目',
  'video-script': '视频脚本',
};

export function ResourceBundleView({ resources }: { resources: ResourceBundleData }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-950/70">
      <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
        资源生成 Agent 组
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        {resources.items.map((item) => (
          <div
            key={item.type}
            className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/70"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {labels[item.type] || item.type}
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                {item.status === 'ready' ? '已规划' : '部分可用'}
              </span>
            </div>
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.summary}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

