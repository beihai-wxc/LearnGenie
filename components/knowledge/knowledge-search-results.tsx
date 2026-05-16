'use client';

import Link from 'next/link';
import { useState } from 'react';
import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpen, RotateCcw, Sparkles } from 'lucide-react';
import type { AgentWorkflowSnapshot } from '@/lib/agents/types';
import type { KnowledgeLearningPath, KnowledgeSearchResult } from '@/lib/knowledge-base/types';
import type { UserRequirements } from '@/lib/types/generation';
import { AgentWorkflowPanel } from '@/components/agent/agent-workflow-panel';

const resourceTypeLabels: Record<string, string> = {
  lecture: '讲解文档',
  mindmap: '思维导图',
  quiz: '练习题',
  reading: '拓展阅读',
  'code-lab': '代码实操',
  project: '实践项目',
  'video-script': '视频脚本',
};

interface KnowledgeSearchResultsProps {
  title: string;
  query: string;
  results: KnowledgeSearchResult[];
  autoContextSources?: string[];
  recommendedPath?: KnowledgeLearningPath | null;
  safetyNote?: string;
  agentWorkflow?: AgentWorkflowSnapshot | null;
  fallbackLabel?: string;
  fallbackHint?: string;
  onBack: () => void;
}

export function KnowledgeSearchResults({
  title,
  query,
  results,
  autoContextSources,
  recommendedPath,
  safetyNote,
  agentWorkflow,
  fallbackLabel = '继续直接生成课程',
  fallbackHint,
  onBack,
}: KnowledgeSearchResultsProps) {
  const router = useRouter();
  const [generatingDocId, setGeneratingDocId] = useState<string | null>(null);

  const handleGenerate = async (docId: string, docTitle: string) => {
    setGeneratingDocId(docId);
    const response = await fetch(
      `/api/knowledge/document/${docId}/meta?query=${encodeURIComponent(query)}`,
    );
    const data = await response.json();
    if (!response.ok || !data.success || !data.document) {
      setGeneratingDocId(null);
      return;
    }

    const requirements: UserRequirements = {
      requirement:
        data.document.recommendedRequirement || `请基于知识库文档《${docTitle}》生成课程。`,
    };
    sessionStorage.setItem(
      'generationSession',
      JSON.stringify({
        sessionId: nanoid(),
        requirements,
        pdfText: data.document.fullText,
        knowledgeContextSources: [docTitle],
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
    <div className="mt-8 rounded-[32px] border border-slate-200/70 bg-white/92 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950/88">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300">
            <BookOpen className="size-3.5" />
            知识库命中
          </div>
          <h2 className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            已在人工智能课程知识库中找到与你问题相关的内容：{query}
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900"
        >
          <RotateCcw className="size-4" />
          {fallbackLabel}
        </button>
      </div>
      {fallbackHint ? (
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{fallbackHint}</p>
      ) : null}
      {autoContextSources?.length ? (
        <p className="mt-2 text-xs text-sky-700 dark:text-sky-300">
          自动参考资料：{autoContextSources.join('、')}
        </p>
      ) : null}
      {safetyNote ? (
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{safetyNote}</p>
      ) : null}
      {agentWorkflow ? <AgentWorkflowPanel workflow={agentWorkflow} /> : null}

      {recommendedPath ? (
        <div className="mt-5 rounded-3xl border border-sky-200 bg-sky-50/70 p-4 dark:border-sky-900 dark:bg-sky-950/30">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-slate-950 dark:text-sky-300">
              个性化学习路径
            </span>
            {recommendedPath.personalizedFor.map((hint) => (
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
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {recommendedPath.summary}
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {recommendedPath.steps.map((step, index) => (
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
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {step.learningStage === 'foundation'
                    ? '基础阶段'
                    : step.learningStage === 'core'
                      ? '核心阶段'
                      : '实践阶段'}
                </div>
                <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-300">
                  {step.reason}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {step.recommendedResources.map((resourceType) => (
                    <span
                      key={resourceType}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                    >
                      {resourceTypeLabels[resourceType] || resourceType}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {results.map((result) => (
          <div
            key={result.docId}
            className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/60"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mb-2 flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                    {result.sourceLabel}
                  </span>
                  {result.learningStage ? (
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300">
                      {result.learningStage === 'foundation'
                        ? '基础阶段'
                        : result.learningStage === 'core'
                          ? '核心阶段'
                          : '实践阶段'}
                    </span>
                  ) : null}
                  {result.difficulty ? (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                      {result.difficulty === 'beginner'
                        ? '入门'
                        : result.difficulty === 'intermediate'
                          ? '进阶'
                          : '高级'}
                    </span>
                  ) : null}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {result.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{result.module}</p>
                {result.chapterTitle ? (
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                    {result.chapterTitle}
                  </p>
                ) : null}
              </div>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white dark:bg-sky-400 dark:text-slate-950">
                {Math.round(result.score * 100)}%
              </span>
            </div>

            <p className="mt-4 text-sm leading-7 text-slate-700 dark:text-slate-300">
              {result.summary}
            </p>

                <div className="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                  {result.reasons.map((reason) => (
                    <div key={reason}>- {reason}</div>
                  ))}
                  {result.personalizationReasons?.map((reason) => (
                    <div key={reason} className="text-sky-700 dark:text-sky-300">
                      - {reason}
                    </div>
                  ))}
                </div>

            {result.recommendedTeachingGoals?.length ? (
              <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">适合课堂目标</p>
                <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  {result.recommendedTeachingGoals.slice(0, 3).map((goal) => (
                    <div key={goal}>- {goal}</div>
                  ))}
                </div>
              </div>
            ) : null}

            {result.resourceTypes?.length ? (
              <div className="mt-4 rounded-2xl border border-slate-200/80 bg-white/70 p-3 dark:border-slate-800 dark:bg-slate-950/50">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">可生成资源</p>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  {result.resourceTypes.slice(0, 5).map((resourceType) => (
                    <span
                      key={resourceType}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 dark:border-slate-700 dark:bg-slate-900"
                    >
                      {resourceTypeLabels[resourceType] || resourceType}
                    </span>
                  ))}
                  {result.estimatedStudyTimeMinutes ? (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
                      预计 {result.estimatedStudyTimeMinutes} 分钟
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={`/knowledge/${result.docId}`}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
              >
                查看 PDF
                <ArrowRight className="size-4" />
              </Link>
              <button
                type="button"
                onClick={() => handleGenerate(result.docId, result.title)}
                disabled={generatingDocId === result.docId}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-70 dark:bg-sky-400 dark:text-slate-950"
              >
                <Sparkles className="size-4" />
                {generatingDocId === result.docId ? '正在生成...' : '基于此文档生成课堂'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
