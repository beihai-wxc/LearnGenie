'use client';

import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { useAuthStore } from '@/lib/store/auth';
import { AVATAR_OPTIONS } from '@/lib/store/user-profile';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface AvatarSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AvatarSelectDialog({ open, onOpenChange }: AvatarSelectDialogProps) {
  const user = useAuthStore((s) => s.user);
  const updateAvatar = useAuthStore((s) => s.updateAvatar);
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || AVATAR_OPTIONS[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelect = async (avatar: string) => {
    setSelectedAvatar(avatar);
    await updateAvatar(avatar);
    onOpenChange(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      await handleSelect(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>更换头像</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-3">
          {AVATAR_OPTIONS.map((avatar) => (
            <button
              key={avatar}
              onClick={() => handleSelect(avatar)}
              className={cn(
                'relative rounded-xl p-1 transition-all',
                selectedAvatar === avatar
                  ? 'ring-2 ring-purple-500 ring-offset-2'
                  : 'hover:ring-2 hover:ring-slate-200',
              )}
            >
              <Avatar className="size-16">
                <AvatarImage src={avatar} alt="avatar" />
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
            </button>
          ))}
        </div>

        <div className="mt-1">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-3 text-sm text-slate-500 transition-colors hover:border-purple-400 hover:text-purple-600 dark:border-white/10 dark:text-slate-400 dark:hover:border-purple-500 dark:hover:text-purple-400"
          >
            <Upload className="size-4" />
            上传自定义头像
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
