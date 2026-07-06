'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Brain, Book, Lightbulb, AlertTriangle, Timer, Compass, Crosshair, Heart, MessageSquare } from 'lucide-react';
import { Sidebar } from '@/components/sidebar/sidebar';
import { useUserProfileStore } from '@/lib/store/user-profile';
import { useAuthStore } from '@/lib/store/auth';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserProfileCard } from '@/components/user-profile';
import { useI18n } from '@/lib/hooks/use-i18n';
import { cn } from '@/lib/utils';
import type { StudentProfileDimensions, DimensionKey } from '@/lib/types/student-profile';

const ProfileCharts = dynamic(() => import('@/components/profile/profile-charts'), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

const DIMENSION_META: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  knowledgeFoundation: { label: '知识基础', color: '#0ea5e9', icon: Book },
  cognitiveStyle: { label: '认知风格', color: '#8b5cf6', icon: Lightbulb },
  errorPronePatterns: { label: '易错点偏好', color: '#ef4444', icon: AlertTriangle },
  learningPace: { label: '学习节奏', color: '#f59e0b', icon: Timer },
  interestDirection: { label: '兴趣方向', color: '#10b981', icon: Compass },
  metaCognitiveStrategy: { label: '元认知策略', color: '#6366f1', icon: Crosshair },
  emotionalMotivation: { label: '情感动机', color: '#ec4899', icon: Heart },
  interactionPreference: { label: '交互偏好', color: '#14b8a6', icon: MessageSquare },
};

const FRIENDLY_DIMENSION_NAMES: Record<string, string> = {
  knowledgeFoundation: '知识掌握程度',
  cognitiveStyle: '学习偏好',
  errorPronePatterns: '易错薄弱点',
  learningPace: '学习节奏把控',
  interestDirection: '兴趣驱动力',
  metaCognitiveStrategy: '自我学习意识',
  emotionalMotivation: '学习动力与情绪',
  interactionPreference: '交互偏好',
};

function generateProfileSummary(learningProfile: StudentProfileDimensions | undefined): string {
  if (!learningProfile) return '暂无学习数据，开始对话后将自动生成学习画像';

  const scores: { key: DimensionKey; score: number }[] = Object.entries(learningProfile).map(([key, dim]) => ({
    key: key as DimensionKey,
    score: (dim as { score?: number })?.score ?? 0,
  }));

  const validScores = scores.filter((s) => s.score > 0);
  if (validScores.length === 0) return '暂无学习数据，开始对话后将自动生成学习画像';

  const maxScore = Math.max(...validScores.map((s) => s.score));
  const minScore = Math.min(...validScores.map((s) => s.score));
  const diff = maxScore - minScore;

  const highest = validScores.find((s) => s.score === maxScore)!;
  const lowest = validScores.find((s) => s.score === minScore)!;
  const highestName = FRIENDLY_DIMENSION_NAMES[highest.key] || highest.key;
  const lowestName = FRIENDLY_DIMENSION_NAMES[lowest.key] || lowest.key;

  if (diff <= 15) {
    return `该生各维度发展较为均衡，${highestName}略占优势，可继续保持当前学习节奏。`;
  }

  return `该生在学习上 ${highestName}表现最为突出，但在 ${lowestName}方面仍需加强，建议多关注 ${lowestName}的针对性练习。`;
}

function UserProfileButton({ className }: { className?: string }) {
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const profileAvatar = useUserProfileStore((s) => s.avatar);
  const profileNickname = useUserProfileStore((s) => s.nickname);

  const displayAvatar = user?.avatar || profileAvatar || '/avatars/user.png';
  const displayName = user?.nickname || profileNickname || t('profile.defaultNickname');

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-2 text-sm text-slate-700 shadow-[0_18px_44px_rgba(159,172,195,0.16)] backdrop-blur-md dark:border-white/10 dark:bg-slate-900/65 dark:text-slate-200",
            className,
          )}
        >
          <img
            src={displayAvatar}
            alt={displayName}
            className="size-8 rounded-full object-cover ring-2 ring-sky-200/80 dark:ring-sky-400/20"
          />
          <span>嗨，{displayName}，点击介绍一下自己吧</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={14}
        className="w-[min(92vw,22rem)] border-none bg-transparent p-0 shadow-none"
      >
        <UserProfileCard />
      </PopoverContent>
    </Popover>
  );
}

function ChartSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={i === 2 ? 'lg:col-span-2' : ''}
          >
            <div className="animate-pulse rounded-2xl border border-slate-200/50 bg-white/80 p-4 dark:border-slate-700/50 dark:bg-slate-900/80">
              <div className="mb-3 h-4 w-24 rounded bg-slate-200 dark:bg-slate-700" />
              <div className={i === 2 ? 'h-[360px]' : i >= 3 ? 'h-[400px]' : 'h-[320px]'} style={{ background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const learningProfile = useUserProfileStore((s) => s.learningProfile);
  const profileSummary = useMemo(() => generateProfileSummary(learningProfile), [learningProfile]);
  const dimensionKeys = Object.keys(DIMENSION_META) as DimensionKey[];

  return (
    <>
      <Sidebar />
      <div className="ml-52 min-h-[100dvh] overflow-x-hidden bg-slate-50/60 pb-10 dark:bg-slate-950/60">
        {/* Hero Header */}
        <div className="relative overflow-hidden border-b border-slate-200/50 bg-white/80 dark:border-slate-800/50 dark:bg-slate-900/80">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-100/60 via-white to-violet-100/50 dark:from-sky-950/30 dark:via-slate-900/50 dark:to-violet-950/20" />
          <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-10">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 sm:size-12">
                <Brain className="size-5 sm:size-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl dark:text-slate-100">学生肖像</h1>
                <p className="mt-0.5 text-xs text-slate-500 sm:text-sm dark:text-slate-400">学习画像与维度分析</p>
              </div>

              <UserProfileButton className="ml-8" />
            </div>
          </div>
        </div>

        {/* Profile Summary Card */}
        <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
          <div className="relative overflow-hidden rounded-2xl border border-sky-200/50 bg-gradient-to-br from-sky-50 to-violet-50 p-5 shadow-sm dark:border-sky-800/50 dark:from-sky-950/30 dark:to-violet-950/20">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400">
                <Brain className="size-5" />
              </div>
              <div>
                <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">画像概括</h2>
                <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300">
                  {profileSummary}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dimension Detail Cards */}
        <div className="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
          <div className="rounded-2xl border border-slate-200/50 bg-white/80 p-5 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/80">
            <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">维度详情</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {dimensionKeys.map((key) => {
                const DimensionIcon = DIMENSION_META[key].icon;
                const dim = learningProfile?.[key];
                const score = dim?.score ?? 0;
                const description = dim?.description || '暂无数据，请通过对话构建画像';
                const hasData = score > 0;
                return (
                  <div key={key} className="flex flex-col gap-3 rounded-xl border border-slate-200/60 p-4 dark:border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${DIMENSION_META[key].color}1a`, color: DIMENSION_META[key].color }}
                      >
                        <DimensionIcon className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{DIMENSION_META[key].label}</p>
                        <p className="mt-0.5 text-xs font-semibold" style={{ color: hasData ? DIMENSION_META[key].color : undefined }}>
                          {hasData ? `${score} 分` : '待了解'}
                        </p>
                      </div>
                    </div>
                    {hasData && (
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${score}%`, backgroundColor: DIMENSION_META[key].color }}
                        />
                      </div>
                    )}
                    <p className="text-xs leading-relaxed text-slate-500 line-clamp-2 dark:text-slate-400" title={description}>
                      {description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Charts - lazy loaded, non-blocking */}
        <ProfileCharts />
      </div>
    </>
  );
}
