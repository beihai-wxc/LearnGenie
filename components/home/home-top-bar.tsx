'use client';

import { useEffect, useRef, useState } from 'react';
import { Home, Monitor, Moon, Settings, Sun } from 'lucide-react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/hooks/use-theme';
import { useI18n } from '@/lib/hooks/use-i18n';

interface HomeTopBarProps {
  onSettingsOpen: () => void;
  onScrollToHero: () => void;
}

export function HomeTopBar({
  onSettingsOpen,
  onScrollToHero,
}: HomeTopBarProps) {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const [themeOpen, setThemeOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!themeOpen) return;
    const handleOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setThemeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [themeOpen]);

  return (
    <div className="sticky top-0 z-50 px-4 pt-4 md:px-8 md:pt-6">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 rounded-full border border-white/70 bg-white/78 px-4 py-3 shadow-[0_18px_50px_rgba(152,170,201,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/62 dark:shadow-[0_20px_60px_rgba(5,12,24,0.45)]">
        <button
          type="button"
          onClick={onScrollToHero}
          className="flex items-center gap-3 rounded-full px-2 py-1 text-left transition-transform hover:scale-[1.01]"
        >
          <img src="/logo-horizontal.png" alt="LearnGenie" className="h-9 w-auto md:h-10" />
        </button>

        <div className="hidden sm:flex items-center rounded-[22px] border border-slate-200/70 bg-white/85 p-1 shadow-[0_10px_30px_rgba(160,173,198,0.18)] dark:border-white/10 dark:bg-slate-900/80">
          <button
            type="button"
            onClick={onScrollToHero}
            className="flex h-11 items-center gap-2 rounded-[16px] px-4 text-sm font-medium text-slate-700 transition-colors hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
          >
            <Home className="size-4" />
            <span>{t('home.topbarHome')}</span>
          </button>
        </div>

        <div ref={containerRef} className="flex items-center gap-2">
          <div className="hidden md:block rounded-full border border-slate-200/70 bg-white/75 p-1 dark:border-white/10 dark:bg-slate-900/70">
            <LanguageSwitcher onOpen={() => setThemeOpen(false)} />
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setThemeOpen((open) => !open)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/70 bg-white/75 text-slate-500 transition-colors hover:text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-400 dark:hover:text-white"
              aria-label={t('settings.theme')}
            >
              {theme === 'light' && <Sun className="size-4" />}
              {theme === 'dark' && <Moon className="size-4" />}
              {theme === 'system' && <Monitor className="size-4" />}
            </button>

            {themeOpen && (
              <div className="absolute right-0 top-full mt-3 min-w-[150px] overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 p-1 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95">
                {(['light', 'dark', 'system'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setTheme(option);
                      setThemeOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors',
                      theme === option
                        ? 'bg-sky-100/80 text-sky-900 dark:bg-sky-500/20 dark:text-sky-100'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5',
                    )}
                  >
                    {option === 'light' && <Sun className="size-4" />}
                    {option === 'dark' && <Moon className="size-4" />}
                    {option === 'system' && <Monitor className="size-4" />}
                    <span>{t(`settings.themeOptions.${option}`)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onSettingsOpen}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/70 bg-white/75 text-slate-500 transition-colors hover:text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-400 dark:hover:text-white"
            aria-label={t('settings.title')}
          >
            <Settings className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
