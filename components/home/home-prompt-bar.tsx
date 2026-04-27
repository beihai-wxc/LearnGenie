'use client';

import { useEffect, useRef, type KeyboardEvent } from 'react';
import { ArrowRight, Atom } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GenerationToolbar } from '@/components/generation/generation-toolbar';
import { SpeechButton } from '@/components/audio/speech-button';
import { AgentBar } from '@/components/agent/agent-bar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/hooks/use-i18n';
import type { SettingsSection } from '@/lib/types/settings';

interface HomePromptBarProps {
  requirement: string;
  onRequirementChange: (value: string) => void;
  onSubmit: () => void;
  onSettingsOpen: (section?: SettingsSection) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  pdfFile: File | null;
  onPdfFileChange: (file: File | null) => void;
  onPdfError: (error: string | null) => void;
  webSearch: boolean;
  onWebSearchChange: (value: boolean) => void;
  interactiveMode: boolean;
  onInteractiveModeChange: (value: boolean) => void;
  onVoiceTranscription: (text: string) => void;
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
  webSearch,
  onWebSearchChange,
  interactiveMode,
  onInteractiveModeChange,
  onVoiceTranscription,
  canSubmit,
  error,
}: HomePromptBarProps) {
  const { t } = useI18n();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = '0px';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
  }, [requirement]);

  return (
    <div className="w-full">
      <div className="rounded-[32px] border border-white/80 bg-white/82 p-3 shadow-[0_32px_80px_rgba(160,174,200,0.28)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/72 dark:shadow-[0_35px_80px_rgba(5,12,24,0.5)]">
        <div className="flex items-end gap-3 rounded-[24px] border border-slate-200/70 bg-white/72 px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] dark:border-white/8 dark:bg-slate-900/70">
          <textarea
            ref={textareaRef}
            value={requirement}
            onChange={(event) => onRequirementChange(event.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder={t('home.promptPlaceholder')}
            className="min-h-[30px] max-h-[220px] flex-1 resize-none bg-transparent pt-1 text-[15px] leading-8 text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
          />

          <div className="flex items-center gap-2 pb-1">
            <SpeechButton
              size="md"
              onTranscription={onVoiceTranscription}
              className="rounded-full border border-slate-200/70 bg-white/70 text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            />
            <button
              type="button"
              disabled={!canSubmit}
              onClick={onSubmit}
              className={cn(
                'flex h-12 min-w-12 items-center justify-center rounded-full px-4 transition-all',
                canSubmit
                  ? 'bg-slate-900 text-white shadow-[0_16px_40px_rgba(15,23,42,0.3)] hover:-translate-y-0.5 dark:bg-sky-400 dark:text-slate-950'
                  : 'bg-slate-200 text-slate-400 dark:bg-white/10 dark:text-slate-600',
              )}
              aria-label={t('home.generateAction')}
            >
              <ArrowRight className="size-5" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <GenerationToolbar
              webSearch={webSearch}
              onWebSearchChange={onWebSearchChange}
              onSettingsOpen={onSettingsOpen}
              pdfFile={pdfFile}
              onPdfFileChange={onPdfFileChange}
              onPdfError={onPdfError}
            />

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
                    <span className="home-breathe-ring absolute inset-[-4px] rounded-full" />
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
