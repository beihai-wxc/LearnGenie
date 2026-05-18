'use client';

import { useRouter } from 'next/navigation';
import { Trash2, RotateCcw, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WrongQuestionRecord } from '@/lib/utils/wrong-questions-storage';
import type { StageListItem } from '@/lib/utils/stage-storage';

interface WrongQuestionCardProps {
  record: WrongQuestionRecord;
  stageExists: boolean;
  stageName: string;
  onDelete: (id: string) => void;
}

export function WrongQuestionCard({
  record,
  stageExists,
  stageName,
  onDelete,
}: WrongQuestionCardProps) {
  const router = useRouter();
  const q = record.questionSnapshot;

  const typeLabel =
    q.type === 'single' ? '单选' : q.type === 'multiple' ? '多选' : '简答';

  const typeColor =
    q.type === 'single'
      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
      : q.type === 'multiple'
        ? 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
        : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';

  const handleRetry = () => {
    if (!stageExists) return;
    router.push(`/classroom/${record.stageId}?sceneId=${record.sceneId}&retry=1`);
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-white/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:bg-gray-900/80',
        stageExists
          ? 'border-gray-200/60 dark:border-gray-700/60'
          : 'border-rose-200/60 dark:border-rose-800/60 opacity-60',
      )}
    >
      {/* Top bar */}
      <div className="px-4 pt-4 pb-2 flex items-start justify-between gap-2">
        <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0', typeColor)}>
          {typeLabel}
        </span>
        {!stageExists && (
          <span className="text-[10px] text-rose-500 dark:text-rose-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            原课堂已删除
          </span>
        )}
      </div>

      {/* Question text */}
      <div className="px-4 pb-3">
        <p className="text-sm text-gray-800 dark:text-gray-200 line-clamp-2 leading-relaxed">
          {q.question}
        </p>
      </div>

      {/* Bottom bar */}
      <div className="px-4 pb-2 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
        <span className="truncate max-w-[60%]" title={stageName || record.stageName}>
          {stageName || record.stageName}
        </span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-0.5">
            <Clock className="w-3 h-3" />
            {formatDate(record.lastAnsweredAt)}
          </span>
          {record.wrongCount > 0 && (
            <span className="text-rose-500 dark:text-rose-400 font-medium">
              错误 {record.wrongCount} 次
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="absolute bottom-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {stageExists && (
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-1 rounded-lg bg-sky-500 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-sky-600 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            重做
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(record.id)}
          className="rounded-lg bg-rose-50 p-1.5 text-rose-500 hover:bg-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
