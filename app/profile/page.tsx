'use client';

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { Brain, RefreshCw } from 'lucide-react';
import * as echarts from 'echarts';
import { Sidebar } from '@/components/sidebar/sidebar';
import { useUserProfileStore } from '@/lib/store/user-profile';
import type { StudentProfileDimensions, DimensionKey } from '@/lib/types/student-profile';

const DIMENSION_META: Record<string, { label: string; color: string; shortLabel: string }> = {
  knowledgeFoundation: { label: '知识基础', color: '#0ea5e9', shortLabel: '知识基础' },
  cognitiveStyle: { label: '认知风格', color: '#8b5cf6', shortLabel: '认知风格' },
  errorPronePatterns: { label: '易错点偏好', color: '#ef4444', shortLabel: '易错点' },
  learningPace: { label: '学习节奏', color: '#f59e0b', shortLabel: '学习节奏' },
  interestDirection: { label: '兴趣方向', color: '#10b981', shortLabel: '兴趣方向' },
  metaCognitiveStrategy: { label: '元认知策略', color: '#6366f1', shortLabel: '元认知' },
  emotionalMotivation: { label: '情感动机', color: '#ec4899', shortLabel: '情感动机' },
  interactionPreference: { label: '交互偏好', color: '#14b8a6', shortLabel: '交互偏好' },
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

const STYLE_LABELS: Record<string, string> = {
  visual: '视觉型',
  textual: '文本型',
  sequential: '序列型',
  global: '全局型',
  analytical: '分析型',
  intuitive: '直觉型',
  unknown: '待了解',
};

const PACE_LABELS: Record<string, string> = {
  slow: '慢节奏',
  medium: '适中',
  fast: '快节奏',
  unknown: '待了解',
};

const STRATEGY_LABELS: Record<string, string> = {
  'self-checking': '自我检查',
  'direct-answer': '直接求答',
  'independent-exploration': '独立探索',
  mixed: '混合型',
  unknown: '待了解',
};

const MOTIVATION_LABELS: Record<string, string> = {
  intrinsic: '内在驱动',
  extrinsic: '外在驱动',
  social: '社交驱动',
  achievement: '成就驱动',
  mixed: '混合型',
  unknown: '待了解',
};

const PREFERENCE_LABELS: Record<string, string> = {
  brief: '简答',
  detailed: '详答',
  'with-code': '带代码',
  'with-analogy': '带类比',
  'with-example': '带例子',
  mixed: '混合型',
  unknown: '待了解',
};

function getDimensionSummary(key: DimensionKey, dimRaw: unknown): string {
  const dim = dimRaw as Record<string, unknown> | undefined;
  if (!dim || (dim.score as number | undefined) === undefined || (dim.score as number) <= 0) return '待了解';
  if (key === 'knowledgeFoundation') return ((dim.description as string) || '').slice(0, 12) || '待了解';
  if (key === 'errorPronePatterns') return ((dim.patterns as string[] | undefined)?.[0])?.slice(0, 8) || '待了解';
  if (key === 'interestDirection') return ((dim.areas as string[] | undefined)?.[0])?.slice(0, 8) || '待了解';
  if (key === 'cognitiveStyle') return STYLE_LABELS[dim.style as string] || '待了解';
  if (key === 'learningPace') return PACE_LABELS[dim.paceLevel as string] || '待了解';
  if (key === 'metaCognitiveStrategy') return STRATEGY_LABELS[dim.strategy as string] || '待了解';
  if (key === 'emotionalMotivation') return MOTIVATION_LABELS[dim.motivation as string] || '待了解';
  if (key === 'interactionPreference') return PREFERENCE_LABELS[dim.preference as string] || '待了解';
  return '待了解';
}

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

// Simulated feature tags for word cloud
const FEATURE_TAGS = [
  { name: 'JavaScript基础', value: 35, category: '知识基础' },
  { name: '异步编程', value: 28, category: '易错点' },
  { name: '前端框架', value: 25, category: '兴趣方向' },
  { name: 'React', value: 30, category: '兴趣方向' },
  { name: '闭包', value: 22, category: '易错点' },
  { name: '视觉型学习', value: 40, category: '认知风格' },
  { name: '序列型', value: 35, category: '认知风格' },
  { name: '自我检查', value: 32, category: '元认知' },
  { name: '内在驱动', value: 38, category: '情感动机' },
  { name: '成就感', value: 30, category: '情感动机' },
  { name: '带例子', value: 45, category: '交互偏好' },
  { name: 'TypeScript', value: 20, category: '知识基础' },
  { name: 'API设计', value: 18, category: '兴趣方向' },
  { name: '事件循环', value: 26, category: '易错点' },
  { name: '全局型', value: 25, category: '认知风格' },
  { name: '快节奏', value: 28, category: '学习节奏' },
  { name: '独立探索', value: 22, category: '元认知' },
  { name: '社交驱动', value: 20, category: '情感动机' },
  { name: '带类比', value: 24, category: '交互偏好' },
  { name: 'CSS布局', value: 15, category: '知识基础' },
  { name: '状态管理', value: 28, category: '兴趣方向' },
  { name: 'this指向', value: 24, category: '易错点' },
  { name: '中等节奏', value: 30, category: '学习节奏' },
  { name: 'Vue.js', value: 18, category: '兴趣方向' },
  { name: '调试技巧', value: 20, category: '元认知' },
];

export default function ProfilePage() {
  const radarChartRef = useRef<HTMLDivElement>(null);
  const donutChartRef = useRef<HTMLDivElement>(null);
  const lineChartRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);
  const wordCloudChartRef = useRef<HTMLDivElement>(null);

  const radarChartInstance = useRef<echarts.ECharts | null>(null);
  const donutChartInstance = useRef<echarts.ECharts | null>(null);
  const lineChartInstance = useRef<echarts.ECharts | null>(null);
  const barChartInstance = useRef<echarts.ECharts | null>(null);
  const wordCloudChartInstance = useRef<echarts.ECharts | null>(null);

  const [wordCloudRefresh, setWordCloudRefresh] = useState(0);

  const learningProfile = useUserProfileStore((s) => s.learningProfile);
  const profileSummary = useMemo(() => generateProfileSummary(learningProfile), [learningProfile]);
  const dimensionKeys = Object.keys(DIMENSION_META) as DimensionKey[];
  const buildChartOption = useCallback(
    (type: 'radar' | 'donut' | 'line' | 'bar') => {
      const profile = useUserProfileStore.getState().learningProfile;
      const values = dimensionKeys.map((key) => {
        const dim = profile[key] as { score?: number } | undefined;
        return dim?.score ?? 0;
      });

      const labels = dimensionKeys.map((key) => DIMENSION_META[key].label);
      const colors = dimensionKeys.map((key) => DIMENSION_META[key].color);

      if (type === 'radar') {
        return {
          backgroundColor: 'transparent',
          radar: {
            indicator: labels.map((name) => ({ name, max: 100 })),
            shape: 'polygon',
            splitNumber: 5,
            axisName: { color: '#64748b', fontSize: 11, fontWeight: 500 },
            splitLine: { lineStyle: { color: ['rgba(100, 116, 139, 0.2)', 'rgba(100, 116, 139, 0.2)'] } },
            splitArea: { show: true, areaStyle: { color: ['rgba(14, 165, 233, 0.05)', 'rgba(14, 165, 233, 0.02)'] } },
            axisLine: { lineStyle: { color: 'rgba(100, 116, 139, 0.3)' } },
          },
          series: [
            {
              type: 'radar',
              data: [
                {
                  value: values,
                  name: '学生画像',
                  areaStyle: { color: 'rgba(14, 165, 233, 0.25)' },
                  lineStyle: { color: '#0ea5e9', width: 3 },
                  itemStyle: { color: '#0ea5e9' },
                },
              ],
            },
          ],
        } as echarts.EChartsOption;
      }

      if (type === 'donut') {
        const avgScore = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
        return {
          backgroundColor: 'transparent',
          tooltip: {
            trigger: 'item',
            formatter: '{b}: {c}%',
          },
          graphic: [
            {
              type: 'text',
              left: 'center',
              top: '48%',
              style: {
                text: `${avgScore}`,
                textAlign: 'center',
                fill: '#64748b',
                fontSize: 28,
                fontWeight: 'bold',
              },
            },
            {
              type: 'text',
              left: 'center',
              top: '58%',
              style: {
                text: '平均分',
                textAlign: 'center',
                fill: '#94a3b8',
                fontSize: 12,
              },
            },
          ],
          series: [
            {
              type: 'pie',
              radius: ['42%', '70%'],
              avoidLabelOverlap: true,
              label: {
                show: true,
                position: 'outside',
                formatter: '{b}: {c}%',
                color: '#475569',
                fontSize: 12,
                fontWeight: 500,
              },
              labelLine: {
                show: true,
                length: 10,
                length2: 10,
                lineStyle: {
                  color: '#cbd5e1',
                  width: 1.5,
                },
              },
              emphasis: {
                label: {
                  show: true,
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: '#1e293b',
                },
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.2)',
                },
              },
              data: labels.map((label, i) => ({
                value: values[i],
                name: label,
                itemStyle: { color: colors[i] },
              })),
            },
          ],
        } as echarts.EChartsOption;
      }

      if (type === 'line') {
        const hasData = values.some((v) => v > 0);
        return {
          backgroundColor: 'transparent',
          tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' },
          },
          legend: {
            data: labels,
            top: 0,
            type: 'scroll',
            textStyle: { fontSize: 11 },
            itemWidth: 16,
            itemHeight: 10,
          },
          grid: { left: '3%', right: '4%', bottom: '3%', top: '12%', containLabel: true },
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: hasData ? ['当前'] : ['暂无数据'],
            axisLine: { lineStyle: { color: 'rgba(100, 116, 139, 0.3)' } },
            axisLabel: { color: '#64748b', fontSize: 10 },
          },
          yAxis: {
            type: 'value',
            max: 100,
            axisLine: { lineStyle: { color: 'rgba(100, 116, 139, 0.3)' } },
            axisLabel: { color: '#64748b', fontSize: 10 },
            splitLine: { lineStyle: { color: 'rgba(100, 116, 139, 0.1)' } },
          },
          series: labels.map((label, i) => ({
            name: label,
            type: 'line',
            data: hasData ? [values[i]] : [0],
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
            lineStyle: { width: 2.5, color: colors[i] },
            itemStyle: { color: colors[i] },
          })),
          graphic: !hasData
            ? [
                {
                  type: 'text',
                  left: 'center',
                  top: 'center',
                  style: {
                    text: '暂无学习数据，开始对话后自动生成',
                    fill: '#94a3b8',
                    fontSize: 14,
                  },
                },
              ]
            : [],
        } as echarts.EChartsOption;
      }

      if (type === 'bar') {
        return {
          backgroundColor: 'transparent',
          grid: { left: '3%', right: '8%', bottom: '3%', top: '3%', containLabel: true },
          xAxis: { type: 'value', max: 100, axisLine: { lineStyle: { color: 'rgba(100, 116, 139, 0.3)' } }, axisLabel: { color: '#94a3b8', fontSize: 10 } },
          yAxis: {
            type: 'category',
            data: labels,
            axisLabel: { color: '#64748b', fontSize: 11, fontWeight: 500 },
            axisLine: { show: false },
            axisTick: { show: false },
          },
          series: [
            {
              type: 'bar',
              data: values.map((v, i) => ({
                value: v,
                itemStyle: {
                  color: new (echarts as any).graphic.LinearGradient(0, 0, 1, 0, [
                    { offset: 0, color: `${colors[i]}33` },
                    { offset: 1, color: colors[i] },
                  ]),
                  borderRadius: 4,
                },
              })),
              barWidth: '45%',
              label: { show: true, position: 'right', color: '#64748b', fontSize: 11, formatter: '{c}%' },
            },
          ],
        } as echarts.EChartsOption;
      }

      return {} as echarts.EChartsOption;
    }, []);

  const initCharts = useCallback(() => {
    if (radarChartRef.current) {
      if (radarChartInstance.current) {
        radarChartInstance.current.dispose();
      }
      radarChartInstance.current = echarts.init(radarChartRef.current);
      radarChartInstance.current.setOption(buildChartOption('radar'));
    }

    if (donutChartRef.current) {
      if (donutChartInstance.current) {
        donutChartInstance.current.dispose();
      }
      donutChartInstance.current = echarts.init(donutChartRef.current);
      donutChartInstance.current.setOption(buildChartOption('donut'));
    }

    if (lineChartRef.current) {
      if (lineChartInstance.current) {
        lineChartInstance.current.dispose();
      }
      lineChartInstance.current = echarts.init(lineChartRef.current);
      lineChartInstance.current.setOption(buildChartOption('line'));
    }

    if (barChartRef.current) {
      if (barChartInstance.current) {
        barChartInstance.current.dispose();
      }
      barChartInstance.current = echarts.init(barChartRef.current);
      barChartInstance.current.setOption(buildChartOption('bar'));
    }

    if (wordCloudChartRef.current) {
      if (wordCloudChartInstance.current) {
        wordCloudChartInstance.current.dispose();
      }
      wordCloudChartInstance.current = echarts.init(wordCloudChartRef.current);
      wordCloudChartInstance.current.setOption({
        backgroundColor: 'transparent',
        tooltip: { show: true, formatter: (p: any) => `${p.name}: ${p.value}` },
        series: [
          {
            type: 'wordCloud',
            shape: 'circle',
            left: 'center',
            top: 'center',
            width: '90%',
            height: '90%',
            sizeRange: [14, 48],
            rotationRange: [-45, 45],
            rotationStep: 15,
            gridSize: 8,
            drawOutOfBound: false,
            textStyle: {
              fontFamily: 'sans-serif',
              fontWeight: 'bold',
              color: function () {
                const colors = ['#0ea5e9', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#14b8a6'];
                return colors[Math.floor(Math.random() * colors.length)];
              },
            },
            emphasis: {
              textStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' },
            },
            data: FEATURE_TAGS.map((t) => ({ name: t.name, value: t.value })),
          },
        ],
      } as echarts.EChartsOption);
    }
  }, []);

  useEffect(() => {
    initCharts();
    const handleResize = () => {
      radarChartInstance.current?.resize();
      donutChartInstance.current?.resize();
      lineChartInstance.current?.resize();
      barChartInstance.current?.resize();
      wordCloudChartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      radarChartInstance.current?.dispose();
      donutChartInstance.current?.dispose();
      lineChartInstance.current?.dispose();
      barChartInstance.current?.dispose();
      wordCloudChartInstance.current?.dispose();
    };
  }, [initCharts, wordCloudRefresh]);

  return (
    <>
      <Sidebar />
      <div className="ml-52 min-h-[100dvh] overflow-x-hidden bg-slate-50/60 pb-10 dark:bg-slate-950/60">
        {/* Hero Header */}
        <div className="relative overflow-hidden border-b border-slate-200/50 bg-white/80 dark:border-slate-800/50 dark:bg-slate-900/80">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-100/60 via-white to-violet-100/50 dark:from-sky-950/30 dark:via-slate-900/50 dark:to-violet-950/20" />
          <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-10">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-400 sm:size-12">
                <Brain className="size-5 sm:size-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl dark:text-slate-100">学生肖像</h1>
                <p className="mt-0.5 text-xs text-slate-500 sm:text-sm dark:text-slate-400">学习画像与维度分析</p>
              </div>
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
              {dimensionKeys.map((key) => (
                <div key={key} className="flex items-center gap-3 rounded-xl border border-slate-200/60 p-4 dark:border-slate-700/50">
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold"
                    style={{ backgroundColor: `${DIMENSION_META[key].color}1a`, color: DIMENSION_META[key].color }}
                  >
                    {DIMENSION_META[key].shortLabel}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{DIMENSION_META[key].label}</p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">待了解</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart Grid */}
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Radar Chart */}
            <div className="rounded-2xl border border-slate-200/50 bg-white/80 p-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/80">
              <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">学习能力</h2>
              <div ref={radarChartRef} className="h-[320px]" />
            </div>

            {/* Donut Chart */}
            <div className="rounded-2xl border border-slate-200/50 bg-white/80 p-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/80">
              <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">维度占比</h2>
              <div ref={donutChartRef} className="h-[320px]" />
            </div>

            {/* Line Chart - Time Series */}
            <div className="rounded-2xl border border-slate-200/50 bg-white/80 p-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/80 lg:col-span-2">
              <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">画像变化趋势</h2>
              <div ref={lineChartRef} className="h-[360px]" />
            </div>

            {/* Bar Chart */}
            <div className="rounded-2xl border border-slate-200/50 bg-white/80 p-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/80">
              <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">维度详细对比</h2>
              <div ref={barChartRef} className="h-[400px]" />
            </div>

            {/* Word Cloud */}
            <div className="rounded-2xl border border-slate-200/50 bg-white/80 p-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/80">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">特征标签</h2>
                <button
                  onClick={() => setWordCloudRefresh((prev) => prev + 1)}
                  className="text-xs text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                >
                  刷新
                </button>
              </div>
              <div ref={wordCloudChartRef} className="h-[400px]" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
