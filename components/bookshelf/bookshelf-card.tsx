'use client';

import { useState, useRef, useEffect } from 'react';
import { Eye, FileText, Pencil, Trash2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// ==================== Classroom Card ====================

interface ClassroomCardProps {
  id: string;
  name: string;
  sceneCount: number;
  createdAt: number;
  updatedAt: number;
  thumbnailUrl?: string;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onOpen: (id: string) => void;
}

export function ClassroomCard({
  id,
  name,
  sceneCount,
  createdAt,
  updatedAt,
  thumbnailUrl,
  onDelete,
  onRename,
  onOpen,
}: ClassroomCardProps) {
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

        {/* Top badges */}
        <div className="absolute left-3 top-3 flex gap-2">
          <span className="rounded-full border border-white/60 bg-white/80 px-2.5 py-0.5 text-[10px] font-medium text-slate-600 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-300">
            {sceneCount} 页
          </span>
        </div>

        {/* Action buttons */}
        <div className="absolute right-3 top-3 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          <IconActionButton
            label="重命名"
            onClick={() => { setNameDraft(name); setEditing(true); }}
          >
            <Pencil className="size-3" />
          </IconActionButton>
          <IconActionButton
            label="删除"
            onClick={() => setConfirmingDelete(true)}
          >
            <Trash2 className="size-3" />
          </IconActionButton>
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

// ==================== Document Card ====================

interface DocumentCardProps {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: number;
  category: string;
  onDelete: (id: string) => void;
  onOpen: (id: string) => void;
}

export function DocumentCard({
  id,
  title,
  fileName,
  fileType,
  fileSize,
  uploadedAt,
  category,
  onDelete,
  onOpen,
}: DocumentCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700/60 dark:bg-slate-900/80">
      {/* File icon area */}
      <div className="relative aspect-[16/10] flex items-center justify-center bg-gradient-to-br from-slate-100 to-sky-50 dark:from-slate-800 dark:to-slate-700">
        <FileIcon type={fileType} />

        {/* Category badge */}
        {category && (
          <span className="absolute left-3 top-3 rounded-full border border-white/60 bg-white/80 px-2.5 py-0.5 text-[10px] font-medium text-slate-600 backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/80 dark:text-slate-300">
            {category}
          </span>
        )}

        {/* Delete button */}
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          className="absolute right-3 top-3 size-7 rounded-full border border-white/60 bg-white/80 text-slate-500 opacity-0 backdrop-blur-sm transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 dark:border-slate-700/60 dark:bg-slate-900/80 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
        >
          <Trash2 className="mx-auto size-3" />
        </button>
      </div>

      {/* Card body */}
      <div className="px-4 py-3.5">
        <h3 className="truncate text-sm font-medium text-slate-900 dark:text-white">{title}</h3>
        <p className="mt-0.5 truncate text-xs text-slate-400 dark:text-slate-500">{fileName}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {formatFileSize(fileSize)} · {fileType.toUpperCase()}
          </span>
          <button
            type="button"
            onClick={() => onOpen(id)}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-400"
          >
            查看
            <ArrowRight className="size-3" />
          </button>
        </div>
      </div>

      {/* Delete confirmation overlay */}
      <AnimatePresence>
        {confirmingDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-sm"
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
    </div>
  );
}

// ==================== Category Card ====================

interface CategoryCardProps {
  name: string;
  color: string;
  count: number;
  onDelete: (name: string) => void;
  onOpen: (name: string) => void;
}

export function CategoryCard({ name, color, count, onDelete, onOpen }: CategoryCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-700/60 dark:bg-slate-900/80">
      <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-slate-100 to-sky-50 dark:from-slate-800 dark:to-slate-700">
        <div
          className="size-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white"
          style={{ backgroundColor: color || '#0ea5e9' }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
      </div>
      <div className="px-4 py-3.5">
        <h3 className="text-sm font-medium text-slate-900 dark:text-white">{name}</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{count} 个项目</p>
        <button
          type="button"
          onClick={() => onOpen(name)}
          className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-600 transition-colors hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-400"
        >
          查看
          <ArrowRight className="size-3" />
        </button>
      </div>
      <button
        type="button"
        onClick={() => onDelete(name)}
        className="absolute right-3 top-3 size-7 rounded-full border border-white/60 bg-white/80 text-slate-500 opacity-0 backdrop-blur-sm transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100 dark:border-slate-700/60 dark:bg-slate-900/80 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
      >
        <Trash2 className="mx-auto size-3" />
      </button>
    </div>
  );
}

// ==================== Helpers ====================

function FileIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    pdf: '📄',
    zip: '📦',
    doc: '📝',
    docx: '📝',
    txt: '📝',
    ppt: '📊',
    pptx: '📊',
  };
  const emoji = icons[type] || '📄';
  return (
    <div className="text-center">
      <span className="text-5xl">{emoji}</span>
      <p className="mt-2 text-xs font-medium uppercase text-slate-400 dark:text-slate-500">{type}</p>
    </div>
  );
}

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

function formatDate(timestamp: number): string {
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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
