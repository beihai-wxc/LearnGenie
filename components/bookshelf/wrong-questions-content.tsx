'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { WrongQuestionCard } from '@/components/bookshelf/wrong-question-card';
import { getStagesByIds, type StageListItem } from '@/lib/utils/stage-storage';
import {
  listWrongQuestions,
  deleteWrongQuestion,
  type WrongQuestionRecord,
} from '@/lib/utils/wrong-questions-storage';

export default function WrongQuestionsContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestionRecord[]>([]);
  const [stageExistsMap, setStageExistsMap] = useState<Record<string, boolean>>({});
  const [stageNamesMap, setStageNamesMap] = useState<Record<string, string>>({});
  const [collapsedChapters, setCollapsedChapters] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const wqs = await listWrongQuestions();
      setWrongQuestions(wqs);
      if (wqs.length > 0) {
        const uniqueStageIds = [...new Set(wqs.map((wq) => wq.stageId))];
        const existingStages = await getStagesByIds(uniqueStageIds);
        const existsMap: Record<string, boolean> = {};
        const namesMap: Record<string, string> = {};
        for (const sid of uniqueStageIds) {
          const s = existingStages.find((es: StageListItem) => es.id === sid);
          existsMap[sid] = !!s;
          namesMap[sid] = s?.name ?? '';
        }
        setStageExistsMap(existsMap);
        setStageNamesMap(namesMap);
      }
    } catch {
      toast.error('加载数据失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string) => {
    try {
      await deleteWrongQuestion(id);
      setWrongQuestions((prev) => prev.filter((wq) => wq.id !== id));
      toast.success('题目已删除');
    } catch {
      toast.error('删除失败');
    }
  };

  const toggleChapterCollapse = (chapter: number) => {
    setCollapsedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapter)) {
        next.delete(chapter);
      } else {
        next.add(chapter);
      }
      return next;
    });
  };

  const filtered = wrongQuestions.filter(
    (wq) =>
      wq.questionSnapshot.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (wq.stageName && wq.stageName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (wq.sceneTitle && wq.sceneTitle.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const byChapter = new Map<number, WrongQuestionRecord[]>();
  for (const wq of filtered) {
    const list = byChapter.get(wq.chapterNumber);
    if (list) {
      list.push(wq);
    } else {
      byChapter.set(wq.chapterNumber, [wq]);
    }
  }
  const sortedChapters = [...byChapter.keys()].sort((a, b) => a - b);

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900 dark:text-slate-50">
          <svg className="size-8 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          题目收藏
        </h1>
        <p className="mt-1.5 text-slate-600 dark:text-slate-300">
          收藏的测验题目，按章节分类复习
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索题目..."
            className="w-full rounded-xl border border-slate-200/60 bg-white/70 pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-rose-300 focus:ring-2 focus:ring-rose-100 dark:border-slate-700/60 dark:bg-slate-900/70 dark:placeholder:text-slate-500 dark:focus:border-rose-600"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-16 text-center text-sm text-slate-400">加载中...</div>
      ) : wrongQuestions.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-slate-400 dark:text-slate-500">
            暂无题目收藏
          </p>
          <p className="mt-1 text-xs text-slate-300 dark:text-slate-600">
            课堂测验中做错的题目会自动出现在这里，也可以手动收藏
          </p>
        </div>
      ) : (
        <>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800 dark:text-slate-200">
            <span className="size-2 rounded-full bg-rose-500" />
            题目收藏 ({filtered.length})
          </h2>

          {sortedChapters.map((chapter) => {
            const chapterWqs = byChapter.get(chapter)!;
            const firstWq = chapterWqs[0];
            const chapterTitle = firstWq.chapterTitle;
            const label = chapterTitle
              ? `第 ${chapter} 章 · ${chapterTitle}`
              : `第 ${chapter} 章`;
            return (
              <div key={chapter} className="mb-6">
                <button
                  type="button"
                  onClick={() => toggleChapterCollapse(chapter)}
                  className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors w-full"
                >
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 transition-transform',
                      collapsedChapters.has(chapter) && '-rotate-90',
                    )}
                  />
                  {label}
                  <span className="text-xs text-slate-400">
                    ({chapterWqs.length} 题)
                  </span>
                </button>
                {!collapsedChapters.has(chapter) && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {chapterWqs.map((wq) => (
                      <WrongQuestionCard
                        key={wq.id}
                        record={wq}
                        stageExists={stageExistsMap[wq.stageId] ?? true}
                        stageName={stageNamesMap[wq.stageId] ?? wq.stageName}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}
    </>
  );
}
