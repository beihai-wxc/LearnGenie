'use client';

import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/sidebar/sidebar';

const WrongQuestionsContent = dynamic(
  () => import('@/components/bookshelf/wrong-questions-content'),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse py-16 text-center text-sm text-slate-400">
        加载中...
      </div>
    ),
  },
);

export default function WrongQuestionsPage() {
  return (
    <>
      <Sidebar />
      <div className="ml-52 min-h-screen bg-gradient-to-br from-slate-50 to-sky-50 p-6 dark:from-slate-950 dark:to-slate-900">
        <div className="mx-auto max-w-7xl">
          <WrongQuestionsContent />
        </div>
      </div>
    </>
  );
}
