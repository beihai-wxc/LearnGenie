'use client';

import type { KeyboardEvent } from 'react';
import { BookOpenText, Sparkles } from 'lucide-react';
import { motion, useAnimationControls } from 'motion/react';
import { useEffect } from 'react';
import { useI18n } from '@/lib/hooks/use-i18n';
import { HomePromptBar } from '@/components/home/home-prompt-bar';
import type { SettingsSection } from '@/lib/types/settings';

const SCROLL_DURATION = 6000;
const PAUSE_DURATION = 3000;

function ScrollingDescription() {
  const { t } = useI18n();
  const controls1 = useAnimationControls();
  const controls2 = useAnimationControls();

  useEffect(() => {
    let isMounted = true;

    const runAnimation = async () => {
      while (isMounted) {
        await controls1.start({
          x: ['100%', '0%'],
          transition: { duration: SCROLL_DURATION / 1000, ease: 'easeOut' },
        });

        if (!isMounted) return;

        await controls2.start({
          x: ['100%', '0%'],
          transition: { duration: SCROLL_DURATION / 1000, ease: 'easeOut' },
        });

        if (!isMounted) return;

        await new Promise((resolve) => setTimeout(resolve, PAUSE_DURATION));

        if (!isMounted) return;

        await Promise.all([
          controls1.start({ x: '-100%', transition: { duration: SCROLL_DURATION / 2000, ease: 'easeIn' } }),
          controls2.start({ x: '-100%', transition: { duration: SCROLL_DURATION / 2000, ease: 'easeIn' } }),
        ]);

        if (!isMounted) return;

        controls1.set({ x: '100%' });
        controls2.set({ x: '100%' });
      }
    };

    runAnimation();

    return () => {
      isMounted = false;
    };
  }, [controls1, controls2]);

  return (
    <div className="relative overflow-hidden">
      <motion.p
        className="whitespace-nowrap text-lg text-[#535862] dark:text-[#93979f]"
        initial={{ x: '100%' }}
        animate={controls1}
      >
        {t('home.heroDescriptionPart1')}
      </motion.p>
      <motion.p
        className="whitespace-nowrap text-lg text-[#535862] dark:text-[#93979f]"
        initial={{ x: '100%' }}
        animate={controls2}
      >
        {t('home.heroDescriptionPart2')}
      </motion.p>
    </div>
  );
}

interface HomeHeroProps {
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
  classroomCount: number;
}

export function HomeHero(props: HomeHeroProps) {
  const { t } = useI18n();

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
            <span className="inline-flex items-center gap-2 rounded-full border border-[#eef0f1] bg-white/70 px-4 py-2 text-sm text-[#535862] shadow-sm backdrop-blur-md dark:border-white/[0.08] dark:bg-[#131720]/65 dark:text-[#93979f]">
              <BookOpenText className="size-4 text-blue-600" />
              {t('home.heroEyebrow')}
            </span>
          </div>

          <div className="relative max-w-4xl px-4">
            <div className="pointer-events-none absolute left-1/2 top-[38%] h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(187,180,255,0.3),transparent_72%)] blur-2xl" />
            <h1
              className="relative z-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[clamp(3.6rem,9vw,7.5rem)] font-medium leading-[0.95] tracking-[-0.06em] text-[#0a0d12] dark:text-[#fafdff]"
              style={{
                fontFamily:
                  '"Iowan Old Style","Palatino Linotype","Noto Serif SC","Source Han Serif SC","Songti SC","STSong",serif',
              }}
            >
              <span>{t('home.heroTitleBefore')}</span>
              <span className="relative inline-flex h-[1.2em] w-[1.2em] items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_32%,rgba(255,255,255,0.95),rgba(236,242,255,0.88)_46%,rgba(199,218,255,0.55)_100%)] text-blue-600 shadow-[0_24px_60px_rgba(148,176,220,0.28),inset_0_1px_0_rgba(255,255,255,0.88)] dark:bg-[radial-gradient(circle_at_35%_32%,rgba(32,55,86,0.95),rgba(21,40,68,0.92)_46%,rgba(19,28,50,0.85)_100%)] dark:text-blue-300 dark:shadow-[0_24px_60px_rgba(28,54,99,0.34),inset_0_1px_0_rgba(255,255,255,0.04)]">
                {t('home.heroTitleHighlight')}
              </span>
              <span>{t('home.heroTitleAfter')}</span>
            </h1>
          </div>

          <div className="max-w-2xl space-y-3 px-4">
            <ScrollingDescription />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7, ease: 'easeOut' }}
          className="relative z-10 mt-10 w-full"
        >
          <HomePromptBar
            requirement={props.requirement}
            onRequirementChange={props.onRequirementChange}
            onSubmit={props.onSubmit}
            onSettingsOpen={props.onSettingsOpen}
            onKeyDown={props.onKeyDown}
            pdfFile={props.pdfFile}
            onPdfFileChange={props.onPdfFileChange}
            onPdfError={props.onPdfError}
            interactiveMode={props.interactiveMode}
            onInteractiveModeChange={props.onInteractiveModeChange}
            canSubmit={props.canSubmit}
            error={props.error}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.7, ease: 'easeOut' }}
            className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500 dark:text-slate-400"
          >
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="size-4 text-sky-500" />
              {t('home.heroStatPrompt')}
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600" />
            <span>{t('home.heroStatClassrooms', { count: props.classroomCount })}</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
