'use client';

import { useState } from 'react';
import { BookOpen, Brain, Lightbulb, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter, usePathname } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/lib/store/auth';
import { UserMenu } from '@/components/sidebar/user-menu';
import { AvatarSelectDialog } from '@/components/sidebar/avatar-select-dialog';

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
    path: '/generate',
  },
  {
    id: 'profile',
    label: '学生肖像',
    icon: <Brain className="size-5" />,
    path: '/profile',
  },
  {
    id: 'bookshelf',
    label: '历史课堂',
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
  const user = useAuthStore((s) => s.user);
  const [avatarOpen, setAvatarOpen] = useState(false);

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

        <div className="mt-auto flex flex-col items-center w-full px-3 pb-4">
          <div className="mb-3 h-px w-full bg-slate-200 dark:bg-slate-700" />
          <Popover>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2 transition-all duration-200',
                  'hover:bg-sky-50 hover:shadow-sm dark:hover:bg-sky-500/10',
                )}
              >
                <Avatar className="size-8 shrink-0">
                  <AvatarImage
                    src={user?.avatar || '/avatars/user.png'}
                    alt={user?.nickname || 'User'}
                  />
                  <AvatarFallback>{(user?.nickname || 'U')[0]}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-slate-700 truncate dark:text-slate-300">
                  {user?.nickname || '未登录'}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" side="right" sideOffset={12} className="w-auto p-2">
              <UserMenu onAvatarChange={() => setAvatarOpen(true)} />
            </PopoverContent>
          </Popover>
        </div>

        <AvatarSelectDialog open={avatarOpen} onOpenChange={setAvatarOpen} />
      </aside>
    </TooltipProvider>
  );
}
