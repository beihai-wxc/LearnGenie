'use client';

import { useState, useEffect, useRef } from 'react';
import { Pencil, Check, Send, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/hooks/use-i18n';
import { useUserProfileStore } from '@/lib/store/user-profile';
import { useAuthStore } from '@/lib/store/auth';
import type { StudentProfileDimensions } from '@/lib/types/student-profile';

export function UserProfileCard() {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const avatar = useUserProfileStore((s) => s.avatar);
  const nickname = useUserProfileStore((s) => s.nickname);
  const bio = useUserProfileStore((s) => s.bio);
  const setNickname = useUserProfileStore((s) => s.setNickname);
  const setBio = useUserProfileStore((s) => s.setBio);
  const learningProfile = useUserProfileStore((s) => s.learningProfile);
  const conversationCount = useUserProfileStore((s) => s.conversationCount);
  const conversationHistory = useUserProfileStore((s) => s.conversationHistory);
  const addConversationEntry = useUserProfileStore((s) => s.addConversationEntry);
  const incrementConversationCount = useUserProfileStore((s) => s.incrementConversationCount);
  const setLearningProfile = useUserProfileStore((s) => s.setLearningProfile);

  const displayAvatar = user?.avatar || avatar || '/avatars/user.png';
  const displayName = user?.nickname || nickname || t('profile.defaultNickname');

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Conversation-based profile building state
  const [chatInput, setChatInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

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

  const handleProfileChat = async () => {
    const message = chatInput.trim();
    if (!message || isExtracting) return;

    setIsExtracting(true);
    setFeedback(null);

    // Record the user's message into conversation history (store method was
    // previously dead code — now wired up).
    addConversationEntry({ role: 'user', content: message });

    // Build the messages array from full history (including the just-added
    // entry) so the LLM has conversational context.
    const updatedHistory = useUserProfileStore.getState().conversationHistory;
    const messages = updatedHistory.map((entry) => ({
      role: entry.role,
      content: entry.content,
    }));

    try {
      const response = await fetch('/api/profile/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          existingProfile: learningProfile,
        }),
      });
      const json = await response.json();
      if (response.ok && json.success && json.profile) {
        setLearningProfile(json.profile as Partial<StudentProfileDimensions>);
        incrementConversationCount();
        const updatedCount = json.updatedFields?.length ?? 0;
        setFeedback({
          type: 'success',
          text: updatedCount > 0 ? `画像已更新（${updatedCount} 个维度有变化）` : '已分析，暂无新变化',
        });
      } else {
        setFeedback({ type: 'error', text: json.error || '分析失败，请稍后重试' });
      }
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : '网络错误' });
    } finally {
      setIsExtracting(false);
      setChatInput('');
      chatInputRef.current?.focus();
    }
  };

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleProfileChat();
    }
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

      {/* Conversation-based profile building */}
      <div className="mt-4 border-t border-muted/40 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">画像对话</span>
          <span className="text-[10px] text-muted-foreground/60">已对话 {conversationCount} 轮</span>
        </div>
        <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground/70">
          描述你的学习背景、偏好或困惑，AI 会据此更新你的学习画像。
        </p>
        <div className="relative">
          <Textarea
            ref={chatInputRef}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleChatKeyDown}
            placeholder="例如：我是零基础，想学 React，偏好看图理解，希望节奏慢一点…"
            maxLength={500}
            rows={2}
            disabled={isExtracting}
            className="resize-none bg-background/50 min-h-[56px] pr-10 text-xs"
          />
          <button
            onClick={handleProfileChat}
            disabled={!chatInput.trim() || isExtracting}
            className="absolute bottom-2 right-2 size-7 rounded-md flex items-center justify-center bg-violet-500 text-white hover:bg-violet-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="发送"
          >
            {isExtracting ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
          </button>
        </div>
        {feedback && (
          <p
            className={cn(
              'mt-2 text-[11px]',
              feedback.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400',
            )}
          >
            {feedback.text}
          </p>
        )}
        {conversationCount > 0 && (
          <p className="mt-1.5 text-[10px] text-muted-foreground/50">
            提示：⌘/Ctrl + Enter 快速发送
          </p>
        )}
      </div>
    </Card>
  );
}
