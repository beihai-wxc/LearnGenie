'use client';

import { cn } from '@/lib/utils';

interface BookshelfTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'classroom', label: '课堂' },
  { key: 'document', label: '文档' },
  { key: 'category', label: '分组' },
  { key: 'history', label: '历史记录' },
];

export function BookshelfTabs({ activeTab, onTabChange, className }: BookshelfTabsProps) {
  return (
    <div className={cn('flex gap-1 border-b border-slate-200 dark:border-slate-700', className)}>
      {TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onTabChange(tab.key)}
          className={cn(
            'relative px-4 py-2.5 text-sm font-medium transition-colors',
            activeTab === tab.key
              ? 'text-sky-600 dark:text-sky-400'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300',
          )}
        >
          {tab.label}
          {activeTab === tab.key && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-sky-500" />
          )}
        </button>
      ))}
    </div>
  );
}
