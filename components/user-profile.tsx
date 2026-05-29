'use client';

import { useState, useEffect, useRef } from 'react';
import { Pencil, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/hooks/use-i18n';
import { useUserProfileStore } from '@/lib/store/user-profile';
import { useAuthStore } from '@/lib/store/auth';

export function UserProfileCard() {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const avatar = useUserProfileStore((s) => s.avatar);
  const nickname = useUserProfileStore((s) => s.nickname);
  const bio = useUserProfileStore((s) => s.bio);
  const setNickname = useUserProfileStore((s) => s.setNickname);
  const setBio = useUserProfileStore((s) => s.setBio);

  const displayAvatar = user?.avatar || avatar || '/avatars/user.png';
  const displayName = user?.nickname || nickname || t('profile.defaultNickname');

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHydrated(true); // eslint-disable-line react-hooks/set-state-in-effect -- Store hydration on mount
  }, []);

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus();
  }, [editingName]);

  const startEditName = () => {
    setNameDraft(nickname);
    setEditingName(true);
  };

  const commitName = () => {
    setNickname(nameDraft.trim());
    setEditingName(false);
  };

  if (!hydrated) {
    return (
      <Card className="p-5 !gap-0 shadow-xl border-muted/40 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-16 rounded bg-muted animate-pulse" />
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 !gap-0 shadow-xl border-muted/40 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80">
      {/* Row 1: Avatar + Name */}
      <div className="flex items-center gap-3.5">
        {/* Avatar — static display */}
        <div className="shrink-0">
          <div className="size-11 rounded-full bg-gray-50 dark:bg-gray-800 overflow-hidden ring-2 ring-violet-300/50 dark:ring-violet-600/40 transition-all">
            <img src={displayAvatar} alt="" className="size-full object-cover" />
          </div>
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-1.5">
              <input
                ref={nameInputRef}
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitName();
                  if (e.key === 'Escape') setEditingName(false);
                }}
                onBlur={commitName}
                maxLength={20}
                placeholder={t('profile.defaultNickname')}
                className="flex-1 min-w-0 h-7 bg-transparent border-b-2 border-violet-400 dark:border-violet-500 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground/40"
              />
              <button
                onClick={commitName}
                className="shrink-0 size-6 rounded-md flex items-center justify-center text-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors"
              >
                <Check className="size-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={startEditName}
              className="group/name flex items-center gap-1.5 cursor-pointer"
            >
              <span className="text-sm font-semibold text-foreground truncate">{displayName}</span>
              <Pencil className="size-3 text-muted-foreground/40 opacity-0 group-hover/name:opacity-100 transition-opacity" />
            </button>
          )}
        </div>
      </div>

      {/* Bio input */}
      <Textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder={t('profile.bioPlaceholder')}
        maxLength={200}
        rows={3}
        className="mt-3 resize-none bg-background/50 min-h-[80px]"
      />
    </Card>
  );
}
