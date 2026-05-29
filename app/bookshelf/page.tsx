'use client';

import dynamic from 'next/dynamic';
import { Sidebar } from '@/components/sidebar/sidebar';

const BookshelfContent = dynamic(
  () => import('@/components/bookshelf/bookshelf-content'),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse py-20 text-center text-sm text-slate-400">
        加载中...
      </div>
    ),
  },
);

export default function BookshelfPage() {
  return (
    <>
      <Sidebar />
      <div className="ml-52 min-h-screen bg-gradient-to-br from-slate-50 to-sky-50 p-6 dark:from-slate-950 dark:to-slate-900">
        <div className="mx-auto max-w-7xl">
          <BookshelfContent />
        </div>
      </div>
    </>
  );
}
