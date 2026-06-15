'use client';

import { useEffect, useRef, type KeyboardEvent } from 'react';
import { ArrowRight, Atom, Paperclip, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GenerationToolbar } from '@/components/generation/generation-toolbar';
import { AgentBar } from '@/components/agent/agent-bar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/hooks/use-i18n';
import type { SettingsSection } from '@/lib/types/settings';

// ─── Constants ───────────────────────────────────────────────
const MAX_PDF_SIZE_MB = 50;
const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024;

interface HomePromptBarProps {
  requirement: string;
  onRequirementChange: (value: string) => void;
  onSubmit: () => void;
  onSettingsOpen: (section?: SettingsSection) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  pdfFile: File | null;
  onPdfFileChange: (file: File | null) => void;
  onPdfError: (error: string | null) => void;
  interactiveMode: boolean;
  onInteractiveModeChange: (value: boolean) => void;
  canSubmit: boolean;
  error: string | null;
}

export function HomePromptBar({
  requirement,
  onRequirementChange,
  onSubmit,
  onSettingsOpen,
  onKeyDown,
  pdfFile,
  onPdfFileChange,
  onPdfError,
  interactiveMode,
  onInteractiveModeChange,
  canSubmit,
  error,
}: HomePromptBarProps) {
  const { t } = useI18n();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF handler
  const handleFileSelect = (file: File) => {
    if (file.type !== 'application/pdf') return;
    if (file.size > MAX_PDF_SIZE_BYTES) {
      onPdfError(t('upload.fileTooLarge'));
      return;
    }
    onPdfError(null);
    onPdfFileChange(file);
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = '40px';
    textarea.style.height = `${Math.max(40, Math.min(textarea.scrollHeight, 220))}px`;
  }, [requirement]);

  return (
    <div className="w-full">
      <div className="rounded-[32px] border border-white/80 bg-white/82 p-3 shadow-[0_32px_80px_rgba(160,174,200,0.28)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/72 dark:shadow-[0_35px_80px_rgba(5,12,24,0.5)]">
        <div className="flex items-center gap-3 rounded-[24px] border border-slate-200/70 bg-white/72 px-5 py-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:border-white/8 dark:bg-slate-900/70">
          <textarea
            ref={textareaRef}
            value={requirement}
            onChange={(event) => onRequirementChange(event.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder={t('home.promptPlaceholder')}
            className="h-[40px] max-h-[220px] flex-1 resize-none bg-transparent text-[15px] leading-[40px] text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
          />

          <div className="flex items-center gap-2 py-0">
            {/* PDF Upload */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
                e.target.value = '';
              }}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                {pdfFile ? (
                  <button className="flex items-center gap-1.5 rounded-full border border-violet-200/60 bg-violet-100 px-2.5 py-1.5 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-200 dark:border-violet-700/50 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-800">
                    <Paperclip className="size-3.5" />
                    <span className="max-w-[80px] truncate">{pdfFile.name}</span>
                    <span
                      className="size-3.5 rounded-full inline-flex items-center justify-center hover:bg-violet-200 dark:hover:bg-violet-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPdfFileChange(null);
                      }}
                    >
                      <X className="size-2.5" />
                    </span>
                  </button>
                ) : (
                  <button
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 bg-white/70 text-slate-600 transition-colors hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="size-4" />
                  </button>
                )}
              </TooltipTrigger>
              <TooltipContent>{t('toolbar.uploadPdf')}</TooltipContent>
            </Tooltip>

            {/* Generate Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  disabled={!canSubmit}
                  onClick={onSubmit}
                  className={cn(
                    'flex h-10 min-w-10 items-center justify-center rounded-full px-4 transition-all',
                    canSubmit
                      ? 'bg-slate-900 text-white shadow-[0_16px_40px_rgba(15,23,42,0.3)] hover:-translate-y-0.5 dark:bg-sky-400 dark:text-slate-950'
                      : 'bg-slate-200 text-slate-400 dark:bg-white/10 dark:text-slate-600',
                  )}
                  aria-label={t('home.generateAction')}
                >
                  <ArrowRight className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{t('toolbar.generateClassroom')}</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <GenerationToolbar onSettingsOpen={onSettingsOpen} />

            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onInteractiveModeChange(!interactiveMode)}
                  className={cn(
                    'relative inline-flex h-9 items-center gap-2 rounded-full border px-4 text-xs font-medium transition-all',
                    interactiveMode
                      ? 'border-cyan-300 bg-cyan-50 text-cyan-700 shadow-[0_0_20px_rgba(34,211,238,0.18)] dark:border-cyan-500/40 dark:bg-cyan-500/10 dark:text-cyan-200'
                      : 'border-slate-200/80 bg-white/70 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10',
                  )}
                >
                  {interactiveMode && (
                    <span className="absolute inset-[-4px] rounded-full border border-blue-300/50 animate-pulse" />
                  )}
                  <Atom className="relative z-10 size-3.5" />
                  <span className="relative z-10">{t('toolbar.interactiveModeLabel')}</span>
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>{t('toolbar.interactiveModeHint')}</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex items-center justify-between gap-3 lg:justify-end">
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('home.promptHint')}</p>
            <div className="max-w-full lg:max-w-[390px]">
              <AgentBar />
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-4 rounded-2xl border border-rose-200/80 bg-rose-50/90 px-4 py-3 text-sm text-rose-700 shadow-sm dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-200"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
