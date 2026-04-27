'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Brain, Sparkles, TrendingUp } from 'lucide-react';
import * as echarts from 'echarts';
import { cn } from '@/lib/utils';
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

export default function ProfilePage() {
  const radarChartRef = useRef<HTMLDivElement>(null);
  const roseChartRef = useRef<HTMLDivElement>(null);
  const donutChartRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);

  const radarChartInstance = useRef<echarts.ECharts | null>(null);
  const roseChartInstance = useRef<echarts.ECharts | null>(null);
  const donutChartInstance = useRef<echarts.ECharts | null>(null);
  const barChartInstance = useRef<echarts.ECharts | null>(null);

  const learningProfile = useUserProfileStore((s) => s.learningProfile);
  const dimensionKeys = Object.keys(DIMENSION_META) as DimensionKey[];

  const buildChartOption = useCallback(
    (type: 'radar' | 'rose' | 'donut' | 'bar') => {
      const values = dimensionKeys.map((key) => {
        const dim = learningProfile[key] as { score?: number } | undefined;
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

      if (type === 'rose') {
        return {
          backgroundColor: 'transparent',
          polar: {},
          angleAxis: {
            type: 'category',
            data: labels,
            axisLabel: { color: '#64748b', fontSize: 10 },
            axisLine: { lineStyle: { color: 'rgba(100, 116, 139, 0.3)' } },
          },
          radiusAxis: {
            max: 100,
            axisLabel: { color: '#94a3b8', fontSize: 10 },
            axisLine: { lineStyle: { color: 'rgba(100, 116, 139, 0.3)' } },
          },
          series: [
            {
              type: 'bar',
              data: values.map((v, i) => ({ value: v, itemStyle: { color: colors[i] } })),
              coordinateSystem: 'polar',
              showBackground: true,
              backgroundStyle: { color: 'rgba(100, 116, 139, 0.1)' },
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
              avoidLabelOverlap: false,
              label: { show: false },
              emphasis: {
                label: { show: true, fontSize: 14, fontWeight: 'bold' },
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

      const sorted = dimensionKeys
        .map((key, i) => ({ key, value: values[i], color: colors[i], label: labels[i] }))
        .sort((a, b) => b.value - a.value);

      return {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
        },
        grid: { left: 80, right: 40, top: 10, bottom: 20 },
        xAxis: {
          type: 'value',
          max: 100,
          axisLabel: { color: '#94a3b8', fontSize: 11 },
          splitLine: { lineStyle: { color: 'rgba(100, 116, 139, 0.15)' } },
          axisLine: { show: false },
        },
        yAxis: {
          type: 'category',
          data: sorted.map((d) => d.label).reverse(),
          axisLabel: { color: '#475569', fontSize: 11 },
          axisLine: { show: false },
          axisTick: { show: false },
        },
        series: [
          {
            type: 'bar',
            data: sorted.map((d) => ({ value: d.value, itemStyle: { color: d.color } })).reverse(),
            barWidth: '50%',
            showBackground: true,
            backgroundStyle: { color: 'rgba(100, 116, 139, 0.08)', borderRadius: 6 },
            itemStyle: { borderRadius: 6 },
            label: {
              show: true,
              position: 'right',
              formatter: '{c}%',
              color: '#64748b',
              fontSize: 12,
            },
          },
        ],
      } as echarts.EChartsOption;
    },
    [learningProfile, dimensionKeys],
  );

  const initCharts = useCallback(() => {
    const chartConfigs = [
      { ref: radarChartRef, instance: radarChartInstance, option: buildChartOption('radar') },
      { ref: roseChartRef, instance: roseChartInstance, option: buildChartOption('rose') },
      { ref: donutChartRef, instance: donutChartInstance, option: buildChartOption('donut') },
      { ref: barChartRef, instance: barChartInstance, option: buildChartOption('bar') },
    ];

    for (const config of chartConfigs) {
      if (!config.ref.current) continue;
      if (config.instance.current) {
        config.instance.current.dispose();
      }
      config.instance.current = echarts.init(config.ref.current);
      config.instance.current.setOption(config.option);
    }
  }, [buildChartOption]);

  useEffect(() => {
    initCharts();
    const handleResize = () => {
      radarChartInstance.current?.resize();
      roseChartInstance.current?.resize();
      donutChartInstance.current?.resize();
      barChartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      radarChartInstance.current?.dispose();
      roseChartInstance.current?.dispose();
      donutChartInstance.current?.dispose();
      barChartInstance.current?.dispose();
    };
  }, [initCharts]);

  return (
    <>
      <Sidebar />
      <div className="ml-52 min-h-screen bg-gradient-to-br from-slate-50 to-sky-50 p-6 dark:from-slate-950 dark:to-slate-900">
        <div className="mx-auto max-w-7xl">

          {/* Header */}
          <div className="mb-6">
            <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900 dark:text-slate-50">
              <Brain className="size-8 text-sky-500" />
              学生肖像
            </h1>
            <p className="mt-1.5 text-slate-600 dark:text-slate-300">
              AI 根据你的学习行为，展示你的多维度学习画像
            </p>

            {/* Dimension summary badges */}
            <div className="mt-4 flex flex-wrap gap-2">
              {dimensionKeys.map((key) => {
                const meta = DIMENSION_META[key];
                const dim = learningProfile[key] as unknown as Record<string, unknown> | undefined;
                const summary = getDimensionSummary(key, dim);
                const hasData = dim && (dim.score as number) > 0;

                return (
                  <div
                    key={key}
                    className={cn(
                      'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all',
                      hasData
                        ? 'border-slate-200 bg-white/80 dark:border-slate-700 dark:bg-slate-800/60'
                        : 'border-slate-200/50 bg-slate-100/50 dark:border-slate-700/50 dark:bg-slate-800/30',
                    )}
                  >
                    <span className="font-medium" style={{ color: meta.color }}>{meta.shortLabel}</span>
                    <span className="text-slate-400 dark:text-slate-500">·</span>
                    <span className={cn('max-w-[100px] truncate', hasData ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500')}>
                      {summary}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Radar chart */}
          <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200/50 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/80">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="size-5 text-sky-500" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                学习能力雷达图
              </h2>
            </div>
            <div ref={radarChartRef} className="h-[360px]" />
          </div>

          {/* Rose + Donut charts */}
          <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="overflow-hidden rounded-3xl border border-slate-200/50 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/80">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="size-5 text-purple-500" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                  维度分布
                </h2>
              </div>
              <div ref={roseChartRef} className="h-[360px]" />
            </div>
            <div className="overflow-hidden rounded-3xl border border-slate-200/50 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/80">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="size-5 text-emerald-500" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                  维度占比
                </h2>
              </div>
              <div ref={donutChartRef} className="h-[360px]" />
            </div>
          </div>

          {/* Bar chart */}
          <div className="overflow-hidden rounded-3xl border border-slate-200/50 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:border-white/10 dark:bg-slate-900/80">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="size-5 text-amber-500" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                维度详细对比
              </h2>
            </div>
            <div ref={barChartRef} className="h-[300px]" />
          </div>
        </div>
      </div>
    </>
  );
}
