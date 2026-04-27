/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState, type KeyboardEvent, type ReactNode } from 'react';
import { BotOff, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';
import { createLogger } from '@/lib/logger';
import { useI18n } from '@/lib/hooks/use-i18n';
import { storePdfBlob } from '@/lib/utils/image-storage';
import { useSettingsStore } from '@/lib/store/settings';
import { useUserProfileStore } from '@/lib/store/user-profile';
import { useMediaGenerationStore } from '@/lib/store/media-generation';
import { useDraftCache } from '@/lib/hooks/use-draft-cache';
import type { UserRequirements } from '@/lib/types/generation';
import type { SettingsSection } from '@/lib/types/settings';
import { SettingsDialog } from '@/components/settings';
import { HomeHero } from '@/components/home/home-hero';
import { Sidebar } from '@/components/sidebar/sidebar';

const log = createLogger('HomePage');

const INTERACTIVE_MODE_STORAGE_KEY = 'interactiveModeEnabled';

interface FormState {
  pdfFile: File | null;
  requirement: string;
  interactiveMode: boolean;
}

const initialFormState: FormState = {
  pdfFile: null,
  requirement: '',
  interactiveMode: false,
};

export default function Page() {
  const { t } = useI18n();
  const router = useRouter();
  const currentModelId = useSettingsStore((state) => state.modelId);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<SettingsSection | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const { cachedValue: cachedRequirement, updateCache: updateRequirementCache } =
    useDraftCache<string>({ key: 'requirementDraft' });

  useEffect(() => {
    try {
      const savedInteractiveMode = localStorage.getItem(INTERACTIVE_MODE_STORAGE_KEY);
      setForm((prev) => ({
        ...prev,
        interactiveMode: savedInteractiveMode === 'true',
        requirement: cachedRequirement || prev.requirement,
      }));
    } catch {
      if (cachedRequirement) {
        setForm((prev) => ({ ...prev, requirement: cachedRequirement }));
      }
    }
  }, [cachedRequirement]);

  useEffect(() => {
    useMediaGenerationStore.getState().revokeObjectUrls();
    useMediaGenerationStore.setState({ tasks: {} });
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const updateForm = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    try {
      if (field === 'interactiveMode') {
        localStorage.setItem(INTERACTIVE_MODE_STORAGE_KEY, String(value));
      }
      if (field === 'requirement') updateRequirementCache(value as string);
    } catch {
      /* localStorage unavailable */
    }
  };

  const showSetupToast = (icon: ReactNode, title: string, desc: string) => {
    toast.custom(
      (id) => (
        <div
          className="flex w-[356px] cursor-pointer items-start gap-3 rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50 via-white to-amber-50 p-4 shadow-lg shadow-amber-500/8"
          onClick={() => {
            toast.dismiss(id);
            setSettingsOpen(true);
          }}
        >
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 ring-1 ring-amber-200/50">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-900">{title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-amber-700/80">{desc}</p>
          </div>
          <Settings className="mt-1 size-3.5 shrink-0 animate-[spin_3s_linear_infinite] text-amber-500" />
        </div>
      ),
      { duration: 4000 },
    );
  };

  const handleGenerate = async () => {
    if (!currentModelId) {
      showSetupToast(
        <BotOff className="size-4.5 text-amber-600" />,
        t('settings.modelNotConfigured'),
        t('settings.setupNeeded'),
      );
      setSettingsOpen(true);
      return;
    }

    if (!form.requirement.trim()) {
      setError(t('upload.requirementRequired'));
      return;
    }

    setError(null);

    try {
      const userProfile = useUserProfileStore.getState();
      const requirements: UserRequirements = {
        requirement: form.requirement,
        userNickname: userProfile.nickname || undefined,
        userBio: userProfile.bio || undefined,
        interactiveMode: form.interactiveMode,
      };

      let pdfStorageKey: string | undefined;
      let pdfFileName: string | undefined;
      let pdfProviderId: string | undefined;
      let pdfProviderConfig: { apiKey?: string; baseUrl?: string } | undefined;

      if (form.pdfFile) {
        pdfStorageKey = await storePdfBlob(form.pdfFile);
        pdfFileName = form.pdfFile.name;

        const settings = useSettingsStore.getState();
        pdfProviderId = settings.pdfProviderId;
        const providerConfig = settings.pdfProvidersConfig?.[settings.pdfProviderId];
        if (providerConfig) {
          pdfProviderConfig = {
            apiKey: providerConfig.apiKey,
            baseUrl: providerConfig.baseUrl,
          };
        }
      }

      const sessionState = {
        sessionId: nanoid(),
        requirements,
        pdfText: '',
        pdfImages: [],
        imageStorageIds: [],
        pdfStorageKey,
        pdfFileName,
        pdfProviderId,
        pdfProviderConfig,
        sceneOutlines: null,
        currentStep: 'generating' as const,
      };
      sessionStorage.setItem('generationSession', JSON.stringify(sessionState));
      router.push('/generation-preview');
    } catch (generationError) {
      log.error('Error preparing generation', generationError);
      setError(
        generationError instanceof Error ? generationError.message : t('upload.generateFailed'),
      );
    }
  };

  const canGenerate = !!form.requirement.trim();

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      if (canGenerate) handleGenerate();
    }
  };

  return (
    <>
      <Sidebar />
      <div className="ml-52 home-page min-h-[100dvh] overflow-x-hidden pb-10">
        <div className="home-bg-mesh" />
        <div className="home-bg-glow home-bg-glow-left" />
        <div className="home-bg-glow home-bg-glow-right" />
        <div className="home-bg-grid" />

        {/* Settings button - top right corner */}
        <div className="fixed top-4 right-4 z-50">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/70 bg-white/75 text-slate-500 transition-colors hover:text-slate-900 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-400 dark:hover:text-white backdrop-blur-xl shadow-lg"
            aria-label={t('settings.title')}
          >
            <Settings className="size-4" />
          </button>
        </div>

        <SettingsDialog
          open={settingsOpen}
          onOpenChange={(open) => {
            setSettingsOpen(open);
            if (!open) setSettingsSection(undefined);
          }}
          initialSection={settingsSection}
        />

        <main className="relative z-10 px-4 md:px-8">
          <div className="mx-auto max-w-7xl">
            <HomeHero
              requirement={form.requirement}
              onRequirementChange={(value) => updateForm('requirement', value)}
              onSubmit={handleGenerate}
              onSettingsOpen={(section) => {
                setSettingsSection(section);
                setSettingsOpen(true);
              }}
              onKeyDown={handleKeyDown}
              pdfFile={form.pdfFile}
              onPdfFileChange={(file) => updateForm('pdfFile', file)}
              onPdfError={setError}
              interactiveMode={form.interactiveMode}
              onInteractiveModeChange={(value) => updateForm('interactiveMode', value)}
              canSubmit={canGenerate}
              error={error}
              classroomCount={0}
            />
          </div>
        </main>

        <footer className="relative z-10 px-4 pb-6 pt-6 text-center text-xs text-slate-400 md:px-8 dark:text-slate-500">
          LearnGenie • immersive AI classroom
        </footer>
      </div>
    </>
  );
}
