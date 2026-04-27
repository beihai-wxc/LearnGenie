'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, Clock3, Eye, Pencil, Trash2, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ThumbnailSlide } from '@/components/slide-renderer/components/ThumbnailSlide';
import { useI18n } from '@/lib/hooks/use-i18n';
import type { Slide } from '@/lib/types/slides';
import type { StageListItem } from '@/lib/utils/stage-storage';
import { cn } from '@/lib/utils';

interface HomeClassroomShowcaseProps {
  classrooms: StageListItem[];
  thumbnails: Record<string, Slide>;
  pendingDeleteId: string | null;
  importing: boolean;
  onImportClick: () => void;
  onDelete: (id: string, event: React.MouseEvent) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  onRename: (id: string, name: string) => void;
  onOpen: (id: string) => void;
  formatDate: (timestamp: number) => string;
}

export function HomeClassroomShowcase({
  classrooms,
  thumbnails,
  pendingDeleteId,
  importing,
  onImportClick,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  onRename,
  onOpen,
  formatDate,
}: HomeClassroomShowcaseProps) {
  const { t } = useI18n();

  return (
    <section id="home-showcase" className="relative mt-20 pb-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-sky-500/80">
              {t('home.showcaseEyebrow')}
            </p>
            <h2
              className="mt-3 text-[clamp(2rem,4vw,3.25rem)] font-medium text-slate-900 dark:text-slate-50"
              style={{
                fontFamily:
                  '"Iowan Old Style","Palatino Linotype","Noto Serif SC","Source Han Serif SC","Songti SC","STSong",serif',
              }}
            >
              {classrooms.length > 0 ? t('home.showcaseTitle') : t('home.emptyTitle')}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
              {classrooms.length > 0 ? t('home.showcaseDescription') : t('home.emptyDescription')}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm text-slate-500 shadow-[0_18px_44px_rgba(159,172,195,0.16)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/65 dark:text-slate-400">
              <Clock3 className="size-4" />
              {t('home.showcaseCount', { count: classrooms.length })}
            </span>
            <button
              type="button"
              onClick={onImportClick}
              disabled={importing}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <Upload className="size-4" />
              <span>{t('import.classroom')}</span>
            </button>
          </div>
        </div>

        {classrooms.length === 0 ? (
          <div className="mt-10 rounded-[36px] border border-white/80 bg-white/75 p-8 shadow-[0_32px_80px_rgba(160,174,200,0.2)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/68 dark:shadow-[0_35px_80px_rgba(5,12,24,0.45)]">
            <div className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
              <div className="rounded-[28px] border border-slate-200/70 bg-gradient-to-br from-sky-50 via-white to-white p-8 dark:border-white/10 dark:from-sky-500/10 dark:via-slate-950 dark:to-slate-950">
                <div className="max-w-md">
                  <p className="text-sm uppercase tracking-[0.22em] text-sky-500/70">
                    {t('home.emptyCardLabel')}
                  </p>
                  <h3 className="mt-4 text-3xl font-medium text-slate-900 dark:text-white">
                    {t('home.emptyCardTitle')}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-slate-500 dark:text-slate-400">
                    {t('home.emptyCardDescription')}
                  </p>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200/70 bg-slate-50/80 p-8 dark:border-white/10 dark:bg-white/[0.04]">
                <div className="flex h-full flex-col justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      {t('home.emptyChecklistTitle')}
                    </p>
                    <ul className="mt-4 space-y-3 text-sm text-slate-500 dark:text-slate-400">
                      <li>{t('home.emptyChecklistOne')}</li>
                      <li>{t('home.emptyChecklistTwo')}</li>
                      <li>{t('home.emptyChecklistThree')}</li>
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={onImportClick}
                    disabled={importing}
                    className="mt-8 inline-flex items-center gap-2 self-start rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white transition-transform hover:-translate-y-0.5 dark:bg-sky-400 dark:text-slate-950"
                  >
                    <Upload className="size-4" />
                    <span>{t('home.emptyAction')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {classrooms.map((classroom, index) => (
              <motion.div
                key={classroom.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}
              >
                <ClassroomFeatureCard
                  classroom={classroom}
                  slide={thumbnails[classroom.id]}
                  formatDate={formatDate}
                  confirmingDelete={pendingDeleteId === classroom.id}
                  onDelete={onDelete}
                  onConfirmDelete={() => onConfirmDelete(classroom.id)}
                  onCancelDelete={onCancelDelete}
                  onRename={onRename}
                  onOpen={() => onOpen(classroom.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ClassroomFeatureCard({
  classroom,
  slide,
  formatDate,
  confirmingDelete,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  onRename,
  onOpen,
}: {
  classroom: StageListItem;
  slide?: Slide;
  formatDate: (timestamp: number) => string;
  confirmingDelete: boolean;
  onDelete: (id: string, event: React.MouseEvent) => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onRename: (id: string, name: string) => void;
  onOpen: () => void;
}) {
  const { t } = useI18n();
  const thumbRef = useRef<HTMLDivElement>(null);
  const [thumbWidth, setThumbWidth] = useState(0);
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(classroom.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const element = thumbRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setThumbWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commitRename = () => {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== classroom.name) {
      onRename(classroom.id, trimmed);
    }
    setEditing(false);
  };

  return (
    <div className="group overflow-hidden rounded-[28px] border border-white/80 bg-white/80 shadow-[0_28px_60px_rgba(160,174,200,0.18)] backdrop-blur-xl transition-all hover:-translate-y-1 hover:shadow-[0_36px_90px_rgba(160,174,200,0.28)] dark:border-white/10 dark:bg-slate-950/72 dark:shadow-[0_30px_70px_rgba(5,12,24,0.42)] dark:hover:shadow-[0_36px_90px_rgba(5,12,24,0.5)]">
      <div
        ref={thumbRef}
        className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-slate-50 to-sky-50 dark:from-slate-900 dark:to-slate-800"
      >
        {slide && thumbWidth > 0 ? (
          <ThumbnailSlide
            slide={slide}
            size={thumbWidth}
            viewportSize={slide.viewportSize ?? 1000}
            viewportRatio={slide.viewportRatio ?? 0.5625}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-full border border-white/80 bg-white/80 px-4 py-2 text-sm text-slate-400 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-500">
              {t('home.cardPreviewPending')}
            </div>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/28 via-slate-950/0 to-white/15 opacity-80" />

        <div className="absolute left-4 top-4 flex gap-2">
          <span className="rounded-full border border-white/70 bg-white/85 px-3 py-1 text-[11px] font-medium text-slate-600 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-300">
            {classroom.sceneCount} {t('classroom.slides')}
          </span>
          <span className="rounded-full border border-white/70 bg-white/85 px-3 py-1 text-[11px] font-medium text-slate-500 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-400">
            {formatDate(classroom.updatedAt)}
          </span>
        </div>

        <div className="absolute right-4 top-4 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <IconActionButton
            label={t('classroom.rename')}
            onClick={(event) => {
              event.stopPropagation();
              setNameDraft(classroom.name);
              setEditing(true);
            }}
          >
            <Pencil className="size-3.5" />
          </IconActionButton>
          <IconActionButton
            label={t('classroom.delete')}
            onClick={(event) => onDelete(classroom.id, event)}
          >
            <Trash2 className="size-3.5" />
          </IconActionButton>
        </div>

        <div className="absolute inset-x-4 bottom-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/85 px-4 py-2 text-sm font-medium text-slate-800 shadow-lg backdrop-blur-md transition-transform hover:-translate-y-0.5 dark:border-white/10 dark:bg-slate-900/80 dark:text-white"
          >
            <Eye className="size-4" />
            <span>{t('home.openClassroom')}</span>
          </button>

          <div className="rounded-full border border-white/60 bg-white/75 px-3 py-2 text-xs text-slate-500 backdrop-blur-md dark:border-white/10 dark:bg-slate-900/75 dark:text-slate-400">
            {formatDate(classroom.createdAt)}
          </div>
        </div>

        <AnimatePresence>
          {confirmingDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950/65 px-6 text-center backdrop-blur-md"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="text-sm font-medium text-white">{t('home.deletePrompt')}</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onCancelDelete}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm text-white/85 transition-colors hover:bg-white/10"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={onConfirmDelete}
                  className="rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-400"
                >
                  {t('classroom.delete')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-4 px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {editing ? (
              <input
                ref={inputRef}
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
                onBlur={commitRename}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') commitRename();
                  if (event.key === 'Escape') setEditing(false);
                }}
                className="w-full border-b border-sky-300 bg-transparent pb-1 text-xl font-medium text-slate-900 outline-none dark:border-sky-500/40 dark:text-white"
              />
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <h3
                    className="truncate text-xl font-medium text-slate-900 dark:text-white"
                    style={{
                      fontFamily:
                        '"Iowan Old Style","Palatino Linotype","Noto Serif SC","Source Han Serif SC","Songti SC","STSong",serif',
                    }}
                  >
                    {classroom.name}
                  </h3>
                </TooltipTrigger>
                <TooltipContent>{classroom.name}</TooltipContent>
              </Tooltip>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(classroom.name);
              toast.success(t('classroom.nameCopied'));
            }}
            className="rounded-full border border-slate-200/80 px-3 py-1.5 text-xs text-slate-500 transition-colors hover:bg-slate-100 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/5"
          >
            {t('home.copyName')}
          </button>
        </div>

        <p className="text-sm leading-7 text-slate-500 dark:text-slate-400">
          {t('home.cardMeta', {
            date: formatDate(classroom.updatedAt),
            count: String(classroom.sceneCount),
          })}
        </p>

        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition-colors hover:text-sky-600 dark:text-slate-200 dark:hover:text-sky-300"
        >
          <span>{t('home.continueAction')}</span>
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

function IconActionButton({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      onClick={onClick}
      className={cn(
        'size-9 rounded-full border border-white/70 bg-white/85 text-slate-700 shadow-lg backdrop-blur-md hover:bg-white dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-900',
      )}
      aria-label={label}
    >
      {children}
    </Button>
  );
}
