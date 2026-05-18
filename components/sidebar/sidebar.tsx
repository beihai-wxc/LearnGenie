'use client';

import { BookOpen, Brain, Lightbulb, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'today',
    label: '今天学点什么',
    icon: <Lightbulb className="size-5" />,
    path: '/',
  },
  {
    id: 'profile',
    label: '学生肖像',
    icon: <Brain className="size-5" />,
    path: '/profile',
  },
  {
    id: 'bookshelf',
    label: '书架',
    icon: <BookOpen className="size-5" />,
    path: '/bookshelf',
  },
  {
    id: 'wrong-questions',
    label: '题目收藏',
    icon: <Bookmark className="size-5" />,
    path: '/wrong-questions',
  },
];

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = (item: SidebarItem) => {
    if (item.path.startsWith('#')) {
      document.getElementById(item.path.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push(item.path);
    }
  };

  const isActive = (item: SidebarItem) => {
    if (item.path.startsWith('#')) return false;
    return pathname === item.path;
  };

  return (
    <TooltipProvider delayDuration={200}>
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-52 flex-col items-center gap-4 border-r border-slate-200/50 bg-white/80 backdrop-blur-xl py-6 dark:border-white/10 dark:bg-slate-950/80">
        <div className="mb-2 flex w-full shrink-0 items-center justify-center">
          <img src="/logo-horizontal.png" alt="LearnGenie" className="h-8 w-auto" />
        </div>

        <nav className="flex flex-1 flex-col items-center gap-2 w-full px-3">
          {sidebarItems.map((item) => (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => handleClick(item)}
                  className={cn(
                    'flex h-12 w-full items-center gap-3 px-4 rounded-xl transition-all duration-200',
                    'hover:scale-[1.02] hover:bg-sky-50 hover:shadow-lg hover:shadow-sky-500/10',
                    'dark:hover:bg-sky-500/10 dark:hover:shadow-sky-500/20',
                    isActive(item) && 'bg-sky-100 text-sky-600 shadow-md dark:bg-sky-500/20 dark:text-sky-300',
                    !isActive(item) && 'text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-300',
                  )}
                >
                  {item.icon}
                  <span className="text-sm font-medium truncate">{item.label}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-2">
          <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700" />
        </div>
      </aside>
    </TooltipProvider>
  );
}
