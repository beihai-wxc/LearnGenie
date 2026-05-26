'use client';

import { useEffect, useState, type KeyboardEvent, type ReactNode } from 'react';
import { BotOff, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import { useRouter } from 'next/navigation';
import { createLogger } from '@/lib/logger';
import { useI18n } from '@/lib/hooks/use-i18n';
import { storeImages } from '@/lib/utils/image-storage';
import { useSettingsStore } from '@/lib/store/settings';
import { useUIStore } from '@/lib/store/ui';
import { useUserProfileStore } from '@/lib/store/user-profile';
import { useMediaGenerationStore } from '@/lib/store/media-generation';
import { useDraftCache } from '@/lib/hooks/use-draft-cache';
import type { UserRequirements } from '@/lib/types/generation';
import type { PdfImage } from '@/lib/types/generation';
import type { ParsedPdfContent } from '@/lib/types/pdf';
import type {
  KnowledgeLearningPath,
  KnowledgeSearchResult,
} from '@/lib/knowledge-base/types';
import type { AgentWorkflowSnapshot } from '@/lib/agents/types';
import { listStages } from '@/lib/utils/stage-storage';import { HomeHero } from '@/components/home/home-hero';
import { KnowledgeSearchResults } from '@/components/knowledge/knowledge-search-results';
import { Sidebar } from '@/components/sidebar/sidebar';
import { ProtectedRoute } from '@/components/auth/protected-route';

const log = createLogger('GeneratePage');

const INTERACTIVE_MODE_STORAGE_KEY = 'interactiveModeEnabled';

interface FormState {
  pdfFile: File | null;
  requirement: string;
  interactiveMode: boolean;
}

interface SessionDraft {
  requirements: UserRequirements;
  pdfText?: string;
  knowledgeContext?: string;
  knowledgeContextSources?: string[];
  knowledgeSafetyNote?: string;
  agentWorkflow?: AgentWorkflowSnapshot;
  pdfImages?: PdfImage[];
  imageStorageIds?: string[];
  knowledgeIngest?: {
    title: string;
    text: string;
  };
}

interface KnowledgeResultPanelState {
  title: string;
  query: string;
  results: KnowledgeSearchResult[];
  matched: boolean;
  autoContextSources?: string[];
  recommendedPath?: KnowledgeLearningPath | null;
  safetyNote?: string;
  agentWorkflow?: AgentWorkflowSnapshot | null;
  fallbackSession: SessionDraft;
  fallbackLabel: string;
  fallbackHint?: string;
}

const initialFormState: FormState = {
  pdfFile: null,
  requirement: '',
  interactiveMode: false,
};

function GenerateContent() {
  const { t } = useI18n();
  const router = useRouter();
  const currentModelId = useSettingsStore((state) => state.modelId);
  const [form, setForm] = useState<FormState>(initialFormState);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);
  const [error, setError] = useState<string | null>(null);
  const [isKnowledgeSearching, setIsKnowledgeSearching] = useState(false);
  const [knowledgePanel, setKnowledgePanel] = useState<KnowledgeResultPanelState | null>(null);
  const [knowledgeDialogOpen, setKnowledgeDialogOpen] = useState(false);
  const [classroomCount, setClassroomCount] = useState(0);
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
    listStages().then((stages) => setClassroomCount(stages.length));
  }, []);

  const updateForm = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'requirement' || field === 'pdfFile') {
      setKnowledgePanel(null);
      setKnowledgeDialogOpen(false);
    }
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

  const createGenerationSession = async (draft: SessionDraft) => {
    const sessionState = {
      sessionId: nanoid(),
      requirements: draft.requirements,
      pdfText: draft.pdfText || '',
      knowledgeContext: draft.knowledgeContext,
      knowledgeContextSources: draft.knowledgeContextSources || [],
      knowledgeSafetyNote: draft.knowledgeSafetyNote,
      agentWorkflow: draft.agentWorkflow,
      pdfImages: draft.pdfImages || [],
      imageStorageIds: draft.imageStorageIds || [],
      sceneOutlines: null,
      currentStep: 'generating' as const,
      knowledgeIngest: draft.knowledgeIngest,
    };
    sessionStorage.setItem('generationSession', JSON.stringify(sessionState));
    router.push('/generation-preview');
  };

  const parsePdfForKnowledge = async (file: File) => {
    const parseFormData = new FormData();
    parseFormData.append('pdf', file);

    const settings = useSettingsStore.getState();
    if (settings.pdfProviderId) {
      parseFormData.append('providerId', settings.pdfProviderId);
    }
    const providerConfig = settings.pdfProvidersConfig?.[settings.pdfProviderId];
    if (providerConfig?.apiKey?.trim()) {
      parseFormData.append('apiKey', providerConfig.apiKey);
    }
    if (providerConfig?.baseUrl?.trim()) {
      parseFormData.append('baseUrl', providerConfig.baseUrl);
    }

    const parseResponse = await fetch('/api/parse-pdf', {
      method: 'POST',
      body: parseFormData,
    });
    const parseJson = (await parseResponse.json()) as {
      success?: boolean;
      data?: ParsedPdfContent;
      error?: string;
    };
    if (!parseResponse.ok || !parseJson.success || !parseJson.data) {
      throw new Error(parseJson.error || t('generation.pdfParseFailed'));
    }

    const rawPdfImages = parseJson.data.metadata?.pdfImages;
    const images: Array<{
      id: string;
      src: string;
      pageNumber: number;
      description?: string;
      width?: number;
      height?: number;
    }> = rawPdfImages
      ? rawPdfImages.map((img) => ({
          id: img.id,
          src: img.src || '',
          pageNumber: img.pageNumber || 1,
          description: img.description,
          width: img.width,
          height: img.height,
        }))
      : (parseJson.data.images || []).map((src, index) => ({
          id: `img_${index + 1}`,
          src,
          pageNumber: 1,
        }));

    const imageStorageIds = await storeImages(
      images.map((img) => ({ id: img.id, src: img.src, pageNumber: img.pageNumber })),
    );

    const pdfImages: PdfImage[] = images.map((img, index) => ({
      id: img.id,
      src: '',
      pageNumber: img.pageNumber,
      description: img.description,
      width: img.width,
      height: img.height,
      storageId: imageStorageIds[index],
    }));

    return {
      text: parseJson.data.text,
      pdfImages,
      imageStorageIds,
    };
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

    if (!form.requirement.trim() && !form.pdfFile) {
      setError(t('upload.requirementRequired'));
      return;
    }

    setError(null);
    setIsKnowledgeSearching(true);

    try {
      const userProfile = useUserProfileStore.getState();
      const updateLearningProfile = userProfile.setLearningProfile;
      const profileContext = {
        nickname: userProfile.nickname || undefined,
        bio: userProfile.bio || undefined,
        learningProfile: userProfile.learningProfile,
      };
      const baseRequirements: UserRequirements = {
        requirement: form.requirement.trim(),
        userNickname: userProfile.nickname || undefined,
        userBio: userProfile.bio || undefined,
        interactiveMode: form.interactiveMode,
      };

      if (form.pdfFile) {
        const parsedPdf = await parsePdfForKnowledge(form.pdfFile);
        const workflowResponse = await fetch('/api/agent/session-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: parsedPdf.text.slice(0, 2200),
            mode: 'upload',
            nickname: profileContext.nickname,
            bio: profileContext.bio,
            existingProfile: profileContext.learningProfile,
          }),
        });
        const workflowJson = await workflowResponse.json();
        if (!workflowResponse.ok || !workflowJson.success || !workflowJson.workflow) {
          throw new Error(workflowJson.error || 'Agent session planning failed');
        }
        if (workflowJson.workflow.profile?.data?.dimensions) {
          updateLearningProfile(workflowJson.workflow.profile.data.dimensions);
        }
        const uploadMatchResponse = await fetch('/api/knowledge/match-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: parsedPdf.text,
            title: form.pdfFile.name.replace(/\.pdf$/i, ''),
            profileContext,
          }),
        });
        const uploadMatchJson = await uploadMatchResponse.json();
        if (!uploadMatchResponse.ok || !uploadMatchJson.success) {
          throw new Error(uploadMatchJson.error || 'Knowledge match failed');
        }

        const finalRequirement =
          baseRequirements.requirement || uploadMatchJson.recommendedRequirement;
        const fallbackSession: SessionDraft = {
          requirements: { ...baseRequirements, requirement: finalRequirement },
          pdfText: parsedPdf.text,
          knowledgeContext: uploadMatchJson.autoContext?.contextText,
          knowledgeContextSources: uploadMatchJson.autoContext?.sourceTitles,
          knowledgeSafetyNote: uploadMatchJson.safetyNote,
          agentWorkflow: workflowJson.workflow as AgentWorkflowSnapshot,
          pdfImages: parsedPdf.pdfImages,
          imageStorageIds: parsedPdf.imageStorageIds,
          knowledgeIngest: {
            title: form.pdfFile.name.replace(/\.pdf$/i, ''),
            text: parsedPdf.text,
          },
        };

        setKnowledgePanel({
          title: uploadMatchJson.matched
            ? '发现相似的人工智能课程资料'
            : '未找到相关知识库资料',
          query: form.pdfFile.name,
          results: (uploadMatchJson.results as KnowledgeSearchResult[]) ?? [],
          matched: uploadMatchJson.matched,
          autoContextSources: uploadMatchJson.autoContext?.sourceTitles,
          recommendedPath: uploadMatchJson.recommendedPath,
          safetyNote: uploadMatchJson.safetyNote,
          agentWorkflow: workflowJson.workflow as AgentWorkflowSnapshot,
          fallbackSession,
          fallbackLabel: uploadMatchJson.matched ? '开始智能生成课堂' : '直接生成课堂',
          fallbackHint: uploadMatchJson.matched
            ? '系统会保留你的原始主题与上传内容，并在后台自动结合最相关的知识库片段来辅助生成课堂。你可以先浏览这些资料，但不需要手动选择。'
            : '当前知识库未找到与上传资料足够匹配的内容，系统将基于上传资料主题进行通用生成。',
        });
        setKnowledgeDialogOpen(true);
        return;
      }

      const workflowResponse = await fetch('/api/agent/session-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: baseRequirements.requirement,
          mode: 'topic',
          nickname: profileContext.nickname,
          bio: profileContext.bio,
          existingProfile: profileContext.learningProfile,
        }),
      });
      const workflowJson = await workflowResponse.json();
      if (!workflowResponse.ok || !workflowJson.success || !workflowJson.workflow) {
        throw new Error(workflowJson.error || 'Agent session planning failed');
      }
      if (workflowJson.workflow.profile?.data?.dimensions) {
        updateLearningProfile(workflowJson.workflow.profile.data.dimensions);
      }

      const knowledgeResponse = await fetch('/api/knowledge/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: baseRequirements.requirement,
          intent: 'learn',
          profileContext,
        }),
      });
      const knowledgeJson = await knowledgeResponse.json();
      if (!knowledgeResponse.ok || !knowledgeJson.success) {
        throw new Error(knowledgeJson.error || 'Knowledge search failed');
      }

      const fallbackSession: SessionDraft = {
        requirements: baseRequirements,
        knowledgeContext: knowledgeJson.autoContext?.contextText,
        knowledgeContextSources: knowledgeJson.autoContext?.sourceTitles,
        knowledgeSafetyNote: knowledgeJson.safetyNote,
        agentWorkflow: workflowJson.workflow as AgentWorkflowSnapshot,
      };

      setKnowledgePanel({
        title: knowledgeJson.matched
          ? '发现相关的人工智能课程知识'
          : '未找到相关知识库资料',
        query: baseRequirements.requirement,
        results: (knowledgeJson.results as KnowledgeSearchResult[]) ?? [],
        matched: knowledgeJson.matched,
        autoContextSources: knowledgeJson.autoContext?.sourceTitles,
        recommendedPath: knowledgeJson.recommendedPath,
        safetyNote: knowledgeJson.safetyNote,
        agentWorkflow: workflowJson.workflow as AgentWorkflowSnapshot,
        fallbackSession,
        fallbackLabel: knowledgeJson.matched ? '开始智能生成课堂' : '直接生成课堂',
        fallbackHint: knowledgeJson.matched
          ? '系统不会完全照搬知识库内容，也不会只做通用生成，而是保留你的原始主题，在后台自动带入最相关的知识片段来辅助生成课堂。'
          : '当前知识库未找到足够强的命中，系统将基于主题进行通用生成。你可以返回修改主题描述，或直接继续生成。',
      });
      setKnowledgeDialogOpen(true);
      return;
    } catch (generationError) {
      log.error('Error preparing generation', generationError);
      setError(
        generationError instanceof Error ? generationError.message : t('upload.generateFailed'),
      );
    } finally {
      setIsKnowledgeSearching(false);
    }
  };

  const canGenerate = !!form.requirement.trim() || !!form.pdfFile;

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      if (canGenerate) handleGenerate();
    }
  };

  return (
    <>
      <Sidebar />
      <div className="ml-52 home-page flex min-h-[100dvh] flex-col overflow-x-hidden pb-10">
        <div className="home-bg-glow home-bg-glow-left" />
        <div className="home-bg-glow home-bg-glow-right" />

        <main className="relative z-10 flex-1 px-4 md:px-8">
          <div className="mx-auto max-w-7xl">
            <HomeHero
              requirement={form.requirement}
              onRequirementChange={(value) => updateForm('requirement', value)}
              onSubmit={handleGenerate}
              onSettingsOpen={() => {
                setSettingsOpen(true);
              }}
              onKeyDown={handleKeyDown}
              pdfFile={form.pdfFile}
              onPdfFileChange={(file) => updateForm('pdfFile', file)}
              onPdfError={setError}
              interactiveMode={form.interactiveMode}
              onInteractiveModeChange={(value) => updateForm('interactiveMode', value)}
              canSubmit={canGenerate && !isKnowledgeSearching}
              error={error}
              classroomCount={classroomCount}
            />
            {knowledgePanel ? (
              <KnowledgeSearchResults
                open={knowledgeDialogOpen}
                onOpenChange={setKnowledgeDialogOpen}
                title={knowledgePanel.title}
                query={knowledgePanel.query}
                results={knowledgePanel.results}
                matched={knowledgePanel.matched}
                autoContextSources={knowledgePanel.autoContextSources}
                recommendedPath={knowledgePanel.recommendedPath}
                safetyNote={knowledgePanel.safetyNote}
                agentWorkflow={knowledgePanel.agentWorkflow}
                fallbackLabel={knowledgePanel.fallbackLabel}
                fallbackHint={knowledgePanel.fallbackHint}
                onBack={() => createGenerationSession(knowledgePanel.fallbackSession)}
              />
            ) : null}
          </div>
        </main>

        <footer className="relative z-10 px-4 pb-6 pt-6 text-center text-xs text-slate-400 md:px-8 dark:text-slate-500">
          LearnGenie - immersive AI classroom
        </footer>
      </div>
    </>
  );
}

export default function GeneratePage() {
  return (
    <ProtectedRoute>
      <GenerateContent />
    </ProtectedRoute>
  );
}
