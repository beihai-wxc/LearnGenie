'use client';

import { LogOut, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';

interface UserMenuProps {
  onAvatarChange: () => void;
}

export function UserMenu({ onAvatarChange }: UserMenuProps) {
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="w-48">
      <button
        onClick={onAvatarChange}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-slate-700 transition-colors hover:bg-sky-50 dark:text-slate-300 dark:hover:bg-sky-500/10"
      >
        <Camera className="size-4" />
        更换头像
      </button>
      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
      >
        <LogOut className="size-4" />
        退出登录
      </button>
    </div>
  );
}
