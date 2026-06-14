'use client';

import { BookOpen, Wand2 } from 'lucide-react';
import type { AgentWorkflowSnapshot } from '@/lib/agents/types';
import type { KnowledgeLearningPath, KnowledgeSearchResult } from '@/lib/knowledge-base/types';
import { AgentWorkflowPanel } from '@/components/agent/agent-workflow-panel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';

interface KnowledgeSearchResultsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  query: string;
  results: KnowledgeSearchResult[];
  matched?: boolean;
  autoContextSources?: string[];
  recommendedPath?: KnowledgeLearningPath | null;
  safetyNote?: string;
  agentWorkflow?: AgentWorkflowSnapshot | null;
  fallbackLabel?: string;
  fallbackHint?: string;
  onBack: () => void;
}

export function KnowledgeSearchResults({
  open,
  onOpenChange,
  title,
  query,
  results,
  matched = true,
  autoContextSources,
  recommendedPath,
  safetyNote,
  agentWorkflow,
  fallbackLabel = '继续直接生成课程',
  fallbackHint,
  onBack,
}: KnowledgeSearchResultsProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92vh] w-[min(1320px,96vw)] max-w-none overflow-hidden rounded-[32px] border border-slate-200/70 bg-white p-0 shadow-[0_24px_70px_rgba(15,23,42,0.14)] dark:border-slate-800 dark:bg-slate-950"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">
          展示知识库命中结果并支持基于知识或主题生成课堂
        </DialogDescription>
        <div className="flex max-h-[88vh] flex-col overflow-hidden">
          <div className="border-b border-slate-200/70 px-6 py-5 dark:border-slate-800">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300">
                  <BookOpen className="size-3.5" />
                  知识库命中
                </div>
                <h2 className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-50">
                  {title}
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  已分析你的主题，并检索到可用于辅助生成课堂的相关知识资料：{query}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onBack();
                }}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-sky-400 dark:text-slate-950"
              >
                <Wand2 className="size-4" />
                {fallbackLabel}
              </button>
            </div>
            {fallbackHint ? (
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{fallbackHint}</p>
            ) : null}
            <p className="mt-2 text-xs text-sky-700 dark:text-sky-300">
              系统将默认结合这些知识片段辅助生成课堂
            </p>
            {safetyNote ? (
              <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{safetyNote}</p>
            ) : null}
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {agentWorkflow ? <AgentWorkflowPanel workflow={agentWorkflow} /> : null}

            {recommendedPath ? (
              <div className="rounded-3xl border border-sky-200 bg-sky-50/70 p-4 dark:border-sky-900 dark:bg-sky-950/30">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-slate-950 dark:text-sky-300">
                    个性化学习路径
                  </span>
                  {recommendedPath.personalizedFor.slice(0, 3).map((hint) => (
                    <span
                      key={hint}
                      className="rounded-full border border-sky-200 px-2.5 py-1 text-[11px] text-sky-700 dark:border-sky-800 dark:text-sky-300"
                    >
                      {hint}
                    </span>
                  ))}
                </div>
                <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-50">
                  {recommendedPath.title}
                </h3>
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  {recommendedPath.steps.slice(0, 3).map((step, index) => (
                    <div
                      key={`${step.chapterId}-${index}`}
                      className="rounded-2xl border border-white/80 bg-white/80 p-3 dark:border-slate-800 dark:bg-slate-950/70"
                    >
                      <div className="text-[11px] font-medium text-sky-700 dark:text-sky-300">
                        Step {index + 1}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {step.chapterTitle}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
