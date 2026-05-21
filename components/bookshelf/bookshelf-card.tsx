'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Eye, Pencil, Trash2, ArrowRight, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// ==================== Classroom Card ====================

interface ClassroomCardProps {
  id: string;
  name: string;
  sceneCount: number;
  createdAt: number;
  updatedAt: number;
  thumbnailUrl?: string;
  isFavorited: boolean;
  favoriteGroup?: string;
  groups: string[];
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onOpen: (id: string) => void;
  onFavorite: (id: string, group?: string) => void;
  onUnfavorite: (id: string) => void;
  onAddGroup: (name: string) => void;
}

export function ClassroomCard({
  id,
  name,
  sceneCount,
  createdAt,
  updatedAt,
  thumbnailUrl,
  isFavorited,
  favoriteGroup,
  groups,
  onDelete,
  onRename,
  onOpen,
  onFavorite,
  onUnfavorite,
  onAddGroup,
}: ClassroomCardProps) {
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [showFavoriteMenu, setShowFavoriteMenu] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => {
    setNameDraft(name);
  }, [name]);

  const commitRename = () => {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== name) {
      onRename(id, trimmed);
    }
    setEditing(false);
  };

  // Close menu on outside click
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setShowFavoriteMenu(false);
      setShowNewGroup(false);
    }
  }, []);

  useEffect(() => {
    if (showFavoriteMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFavoriteMenu, handleClickOutside]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorited) {
      // Already favorited: unfavorite directly if only default group, else show menu
      if (groups.length <= 1) {
        onUnfavorite(id);
      } else {
        setShowFavoriteMenu(!showFavoriteMenu);
      }
    } else {
      // Not favorited: favorite directly if only default group, else show picker
      if (groups.length <= 1) {
        onFavorite(id, '我的收藏');
      } else {
        setShowFavoriteMenu(!showFavoriteMenu);
      }
    }
  };

  const handleSelectGroup = (group: string) => {
    onFavorite(id, group);
    setShowFavoriteMenu(false);
  };

  const handleAddNewGroup = () => {
    const name = newGroupName.trim();
    if (!name) return;
    onAddGroup(name);
    onFavorite(id, name);
    setShowNewGroup(false);
    setNewGroupName('');
    setShowFavoriteMenu(false);
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700/60 dark:bg-slate-900/80">
      {/* Thumbnail */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-slate-100 to-sky-50 dark:from-slate-800 dark:to-slate-700">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="rounded-full border border-white/60 bg-white/80 px-4 py-2 text-sm text-slate-400 dark:border-slate-600/60 dark:bg-slate-800/80 dark:text-slate-500">
              暂无预览
            </div>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

        {/* Top badges */}
        <div className="absolute left-3 top-3 flex gap-2">
          <span className="rounded-full border border-white/60 bg-white/80 px-2.5 py-0.5 text-[10px] font-medium text-slate-600 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-300">
            {sceneCount} 页
          </span>
        </div>

        {/* Top-right action buttons */}
        <div className="absolute right-3 top-3 flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          {/* Favorite button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={handleFavoriteClick}
                className={`size-8 rounded-full border border-white/60 bg-white/80 shadow-sm backdrop-blur-sm hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/80 ${
                  isFavorited
                    ? 'text-amber-500 hover:text-amber-600'
                    : 'text-slate-600 hover:text-amber-500'
                }`}
                aria-label="收藏"
              >
                <Bookmark className={`size-3.5 ${isFavorited ? 'fill-amber-500' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isFavorited ? '取消收藏' : '收藏'}</TooltipContent>
          </Tooltip>
          {/* Rename */}
          <IconActionButton
            label="重命名"
            onClick={() => { setNameDraft(name); setEditing(true); }}
          >
            <Pencil className="size-3" />
          </IconActionButton>
          {/* Delete */}
          <IconActionButton
            label="删除"
            onClick={() => setConfirmingDelete(true)}
          >
            <Trash2 className="size-3" />
          </IconActionButton>
          {/* Favorite menu dropdown */}
          <AnimatePresence>
            {showFavoriteMenu && (
              <motion.div
                ref={menuRef}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-9 z-20 w-36 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg dark:border-white/10 dark:bg-slate-800"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="px-2 py-1 text-[11px] font-medium text-slate-400">收藏到</p>
                {groups
                  .filter((g) => !isFavorited || g !== favoriteGroup)
                  .map((g) => (
                    <button
                      key={g}
                      onClick={() => handleSelectGroup(g)}
                      className="w-full rounded-lg px-2 py-1.5 text-left text-xs text-slate-700 transition-colors hover:bg-sky-50 dark:text-slate-300 dark:hover:bg-sky-500/10"
                    >
                      {isFavorited ? `移到 ${g}` : g}
                    </button>
                  ))}
                <div className="my-1 h-px bg-slate-100 dark:bg-white/10" />
                {isFavorited && (
                  <button
                    onClick={() => { onUnfavorite(id); setShowFavoriteMenu(false); }}
                    className="w-full rounded-lg px-2 py-1.5 text-left text-xs text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    取消收藏
                  </button>
                )}
                {showNewGroup ? (
                  <div className="flex items-center gap-1 px-1">
                    <input
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddNewGroup();
                        if (e.key === 'Escape') { setShowNewGroup(false); setNewGroupName(''); }
                      }}
                      placeholder="新分组名"
                      className="flex-1 rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none dark:border-white/10 dark:bg-slate-700"
                      autoFocus
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNewGroup(true)}
                    className="w-full rounded-lg px-2 py-1.5 text-left text-xs text-slate-500 transition-colors hover:bg-sky-50 dark:text-slate-400 dark:hover:bg-sky-500/10"
                  >
                    + 新建分组
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Delete confirmation */}
        <AnimatePresence>
          {confirmingDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm font-medium text-white">确认删除？</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(false)}
                  className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/80 hover:bg-white/10"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => { onDelete(id); setConfirmingDelete(false); }}
                  className="rounded-full bg-rose-500 px-3 py-1 text-xs font-medium text-white hover:bg-rose-400"
                >
                  删除
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom actions */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onOpen(id)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-700 backdrop-blur-sm transition-all hover:-translate-y-0.5 dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-200"
          >
            <Eye className="size-3" />
            打开
          </button>
          <span className="rounded-full border border-white/60 bg-white/70 px-2 py-1 text-[10px] text-slate-500 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-400">
            {formatDate(createdAt)}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="px-4 py-3.5">
        {editing ? (
          <input
            ref={inputRef}
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') setEditing(false);
            }}
            className="w-full border-b border-sky-300 bg-transparent pb-1 text-sm font-medium text-slate-900 outline-none dark:border-sky-500/40 dark:text-white"
          />
        ) : (
          <h3
            className="truncate text-sm font-medium text-slate-900 dark:text-white"
            style={{
              fontFamily:
                '"Noto Serif SC","Source Han Serif SC","Songti SC","STSong",serif',
            }}
          >
            {name}
          </h3>
        )}
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          更新于: {formatDate(updatedAt)}
        </p>
        <button
          type="button"
          onClick={() => onOpen(id)}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-400"
        >
          <span>继续学习</span>
          <ArrowRight className="size-3" />
        </button>
      </div>
    </div>
  );
}

// ==================== Helpers ====================

function IconActionButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onClick}
          className="size-8 rounded-full border border-white/60 bg-white/80 text-slate-600 shadow-sm backdrop-blur-sm hover:bg-white dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-300"
          aria-label={label}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${Math.floor(days / 7)}周前`;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}
