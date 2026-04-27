'use client';

import type { KeyboardEvent } from 'react';
import { BookOpenText, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserProfileCard } from '@/components/user-profile';
import { useI18n } from '@/lib/hooks/use-i18n';
import { useUserProfileStore } from '@/lib/store/user-profile';
import { HomePromptBar } from '@/components/home/home-prompt-bar';
import type { SettingsSection } from '@/lib/types/settings';

interface HomeHeroProps {
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
  classroomCount: number;
}

export function HomeHero(props: HomeHeroProps) {
  const { t } = useI18n();
  const avatar = useUserProfileStore((state) => state.avatar);
  const nickname = useUserProfileStore((state) => state.nickname);
  const displayName = nickname || t('profile.defaultNickname');

  return (
    <section id="home-hero" className="relative pt-8 md:pt-16">
      <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="flex flex-col items-center gap-6"
        >
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-2 text-sm text-slate-600 shadow-[0_18px_44px_rgba(159,172,195,0.16)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/65 dark:text-slate-300">
              <BookOpenText className="size-4 text-sky-500" />
              {t('home.heroEyebrow')}
            </span>

            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-2 text-sm text-slate-700 shadow-[0_18px_44px_rgba(159,172,195,0.16)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/65 dark:text-slate-200"
                >
                  <img
                    src={avatar}
                    alt={displayName}
                    className="size-8 rounded-full object-cover ring-2 ring-sky-200/80 dark:ring-sky-400/20"
                  />
                  <span>{t('home.greetingWithName', { name: displayName })}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="center"
                sideOffset={14}
                className="w-[min(92vw,22rem)] border-none bg-transparent p-0 shadow-none"
              >
                <UserProfileCard />
              </PopoverContent>
            </Popover>
          </div>

          <div className="relative max-w-4xl px-4">
            <div className="home-watermark pointer-events-none absolute left-1/2 top-[38%] h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl" />
            <h1
              className="relative z-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[clamp(3.6rem,9vw,7.5rem)] font-medium leading-[0.95] tracking-[-0.06em] text-slate-900 dark:text-slate-50"
              style={{
                fontFamily:
                  '"Iowan Old Style","Palatino Linotype","Noto Serif SC","Source Han Serif SC","Songti SC","STSong",serif',
              }}
            >
              <span>{t('home.heroTitleBefore')}</span>
              <span className="home-highlight-orb relative inline-flex h-[1.2em] w-[1.2em] items-center justify-center rounded-full text-sky-500 dark:text-sky-300">
                {t('home.heroTitleHighlight')}
              </span>
              <span>{t('home.heroTitleAfter')}</span>
            </h1>
          </div>

          <div className="max-w-2xl space-y-3 px-4">
            <p className="text-lg text-slate-600 dark:text-slate-300">
              {t('home.heroDescription')}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="size-4 text-sky-500" />
                {t('home.heroStatPrompt')}
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span>{t('home.heroStatClassrooms', { count: props.classroomCount })}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7, ease: 'easeOut' }}
          className="relative z-10 mt-10 w-full"
        >
          <HomePromptBar {...props} />
        </motion.div>
      </div>
    </section>
  );
}
