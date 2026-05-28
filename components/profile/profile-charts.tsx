'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { ECharts, EChartsOption } from 'echarts';
import { useUserProfileStore } from '@/lib/store/user-profile';
import type { StudentProfileDimensions, DimensionKey } from '@/lib/types/student-profile';

const DIMENSION_META: Record<string, { label: string; color: string }> = {
  knowledgeFoundation: { label: '知识基础', color: '#0ea5e9' },
  cognitiveStyle: { label: '认知风格', color: '#8b5cf6' },
  errorPronePatterns: { label: '易错点偏好', color: '#ef4444' },
  learningPace: { label: '学习节奏', color: '#f59e0b' },
  interestDirection: { label: '兴趣方向', color: '#10b981' },
  metaCognitiveStrategy: { label: '元认知策略', color: '#6366f1' },
  emotionalMotivation: { label: '情感动机', color: '#ec4899' },
  interactionPreference: { label: '交互偏好', color: '#14b8a6' },
};

function extractWordCloudData(profile: StudentProfileDimensions | undefined) {
  if (!profile) return [];
  const tags: { name: string; value: number; category: string }[] = [];
  const kf = profile.knowledgeFoundation;
  if (kf?.score && kf.score > 0) {
    (kf.keywords || []).forEach((kw) => tags.push({ name: kw, value: kf.score, category: '知识基础' }));
  }
  const cs = profile.cognitiveStyle;
  if (cs?.score && cs.score > 0) {
    (cs.keywords || []).forEach((kw) => tags.push({ name: kw, value: cs.score, category: '认知风格' }));
    const styleMap: Record<string, string> = { visual: '视觉型', textual: '文本型', sequential: '序列型', global: '全局型', analytical: '分析型', intuitive: '直觉型' };
    if (cs.style && cs.style !== 'unknown' && styleMap[cs.style]) tags.push({ name: styleMap[cs.style], value: cs.score, category: '认知风格' });
  }
  const ep = profile.errorPronePatterns;
  if (ep?.score && ep.score > 0) {
    (ep.patterns || []).forEach((p) => tags.push({ name: p, value: ep.score, category: '易错点' }));
  }
  const lp = profile.learningPace;
  if (lp?.score && lp.score > 0) {
    const paceMap: Record<string, string> = { slow: '慢节奏', medium: '中等节奏', fast: '快节奏' };
    if (lp.paceLevel && lp.paceLevel !== 'unknown' && paceMap[lp.paceLevel]) tags.push({ name: paceMap[lp.paceLevel], value: lp.score, category: '学习节奏' });
  }
  const id = profile.interestDirection;
  if (id?.score && id.score > 0) {
    (id.areas || []).forEach((a) => tags.push({ name: a, value: id.score, category: '兴趣方向' }));
  }
  const mc = profile.metaCognitiveStrategy;
  if (mc?.score && mc.score > 0) {
    const strategyMap: Record<string, string> = { 'self-checking': '自我检查', 'direct-answer': '直接求答', 'independent-exploration': '独立探索', mixed: '混合型' };
    if (mc.strategy && mc.strategy !== 'unknown' && strategyMap[mc.strategy]) tags.push({ name: strategyMap[mc.strategy], value: mc.score, category: '元认知' });
  }
  const em = profile.emotionalMotivation;
  if (em?.score && em.score > 0) {
    const motivationMap: Record<string, string> = { intrinsic: '内在驱动', extrinsic: '外在驱动', social: '社交驱动', achievement: '成就感', mixed: '混合型' };
    if (em.motivation && em.motivation !== 'unknown' && motivationMap[em.motivation]) tags.push({ name: motivationMap[em.motivation], value: em.score, category: '情感动机' });
  }
  const ip = profile.interactionPreference;
  if (ip?.score && ip.score > 0) {
    const prefMap: Record<string, string> = { brief: '简答', detailed: '详答', 'with-code': '带代码', 'with-analogy': '带类比', 'with-example': '带例子', mixed: '混合型' };
    if (ip.preference && ip.preference !== 'unknown' && prefMap[ip.preference]) tags.push({ name: prefMap[ip.preference], value: ip.score, category: '交互偏好' });
  }
  return tags;
}

export default function ProfileCharts() {
  const radarChartRef = useRef<HTMLDivElement>(null);
  const donutChartRef = useRef<HTMLDivElement>(null);
  const lineChartRef = useRef<HTMLDivElement>(null);
  const barChartRef = useRef<HTMLDivElement>(null);
  const wordCloudChartRef = useRef<HTMLDivElement>(null);

  const chartInstances = useRef<Record<string, ECharts | null>>({});
  const [ready, setReady] = useState(false);
  const learningProfile = useUserProfileStore((s) => s.learningProfile);

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
          series: [{ type: 'radar', data: [{ value: values, name: '学生画像', areaStyle: { color: 'rgba(14, 165, 233, 0.25)' }, lineStyle: { color: '#0ea5e9', width: 3 }, itemStyle: { color: '#0ea5e9' } }] }],
        } as EChartsOption;
      }
      if (type === 'donut') {
        const avgScore = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
        return {
          backgroundColor: 'transparent',
          tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
          graphic: [
            { type: 'text', left: 'center', top: '48%', style: { text: `${avgScore}`, textAlign: 'center', fill: '#64748b', fontSize: 28, fontWeight: 'bold' } },
            { type: 'text', left: 'center', top: '58%', style: { text: '平均分', textAlign: 'center', fill: '#94a3b8', fontSize: 12 } },
          ],
          series: [{ type: 'pie', radius: ['42%', '70%'], avoidLabelOverlap: true, label: { show: true, position: 'outside', formatter: '{b}: {c}%', color: '#475569', fontSize: 12, fontWeight: 500 }, labelLine: { show: true, length: 10, length2: 10, lineStyle: { color: '#cbd5e1', width: 1.5 } }, emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#1e293b' }, itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.2)' } }, data: labels.map((label, i) => ({ value: values[i], name: label, itemStyle: { color: colors[i] } })) }],
        } as EChartsOption;
      }
      if (type === 'line') {
        const hasData = values.some((v) => v > 0);
        return {
          backgroundColor: 'transparent',
          tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
          legend: { data: labels, top: 0, type: 'scroll', textStyle: { fontSize: 11 }, itemWidth: 16, itemHeight: 10 },
          grid: { left: '3%', right: '4%', bottom: '3%', top: '12%', containLabel: true },
          xAxis: { type: 'category', boundaryGap: false, data: hasData ? ['当前'] : ['暂无数据'], axisLine: { lineStyle: { color: 'rgba(100, 116, 139, 0.3)' } }, axisLabel: { color: '#64748b', fontSize: 10 } },
          yAxis: { type: 'value', max: 100, axisLine: { lineStyle: { color: 'rgba(100, 116, 139, 0.3)' } }, axisLabel: { color: '#64748b', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(100, 116, 139, 0.1)' } } },
          series: labels.map((label, i) => ({ name: label, type: 'line', data: hasData ? [values[i]] : [0], smooth: true, symbol: 'circle', symbolSize: 8, lineStyle: { width: 2.5, color: colors[i] }, itemStyle: { color: colors[i] } })),
          graphic: !hasData ? [{ type: 'text', left: 'center', top: 'center', style: { text: '暂无学习数据，开始对话后自动生成', fill: '#94a3b8', fontSize: 14 } }] : [],
        } as EChartsOption;
      }
      return {
        backgroundColor: 'transparent',
        grid: { left: '3%', right: '8%', bottom: '3%', top: '3%', containLabel: true },
        xAxis: { type: 'value', max: 100, axisLine: { lineStyle: { color: 'rgba(100, 116, 139, 0.3)' } }, axisLabel: { color: '#94a3b8', fontSize: 10 } },
        yAxis: { type: 'category', data: labels, axisLabel: { color: '#64748b', fontSize: 11, fontWeight: 500 }, axisLine: { show: false }, axisTick: { show: false } },
        series: [{ type: 'bar', data: values.map((v, i) => ({ value: v, itemStyle: { color: `${colors[i]}33`, borderRadius: 4 } })), barWidth: '45%', label: { show: true, position: 'right', color: '#64748b', fontSize: 11, formatter: '{c}%' } }],
      } as EChartsOption;
    }, []);

  // Defer chart init so the main thread is free for navigation
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    async function init() {
      const [echarts] = await Promise.all([
        import('echarts'),
        import('echarts-wordcloud'),
      ]);

      if (cancelled) return;

      const instance = chartInstances.current;
      const profile = useUserProfileStore.getState().learningProfile;

      const refs: [React.RefObject<HTMLDivElement | null>, string, 'radar' | 'donut' | 'line' | 'bar' | null][] = [
        [radarChartRef, 'radar', 'radar'],
        [donutChartRef, 'donut', 'donut'],
        [lineChartRef, 'line', 'line'],
        [barChartRef, 'bar', 'bar'],
        [wordCloudChartRef, 'wordcloud', null],
      ];

      for (const [ref, key, chartType] of refs) {
        if (!ref.current) continue;
        instance[key]?.dispose();
        instance[key] = echarts.init(ref.current);

        if (chartType) {
          instance[key]!.setOption(buildChartOption(chartType));
        } else {
          const wordCloudData = extractWordCloudData(profile);
          if (wordCloudData.length === 0) {
            instance[key]!.setOption({
              backgroundColor: 'transparent',
              graphic: [{ type: 'text', left: 'center', top: 'center', style: { text: '暂无特征标签，开始对话后自动生成', fill: '#94a3b8', fontSize: 14 } }],
            } as unknown as EChartsOption);
          } else {
            instance[key]!.setOption({
              backgroundColor: 'transparent',
              tooltip: { show: true, formatter: (p: unknown) => { const item = p as { name: string; value: number }; return `${item.name}: ${item.value}`; } },
              series: [{
                type: 'wordCloud',
                shape: 'circle',
                left: 'center', top: 'center', width: '90%', height: '90%',
                sizeRange: [14, 48],
                rotationRange: [-45, 45],
                rotationStep: 15,
                gridSize: 8,
                drawOutOfBound: false,
                textStyle: {
                  fontFamily: 'sans-serif', fontWeight: 'bold',
                  color: () => { const colors = ['#0ea5e9', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#14b8a6']; return colors[Math.floor(Math.random() * colors.length)]; },
                },
                emphasis: { textStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' } },
                data: wordCloudData.map((t) => ({ name: t.name, value: t.value })),
              }],
            } as unknown as EChartsOption);
          }
        }
      }
    }

    init();

    const handleResize = () => {
      Object.values(chartInstances.current).forEach((inst) => inst?.resize());
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelled = true;
      window.removeEventListener('resize', handleResize);
      Object.values(chartInstances.current).forEach((inst) => inst?.dispose());
    };
  }, [ready]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/50 bg-white/80 p-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/80">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">学习能力</h2>
          <div ref={radarChartRef} className="h-[320px]" />
        </div>

        <div className="rounded-2xl border border-slate-200/50 bg-white/80 p-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/80">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">维度占比</h2>
          <div ref={donutChartRef} className="h-[320px]" />
        </div>

        <div className="rounded-2xl border border-slate-200/50 bg-white/80 p-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/80 lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">画像变化趋势</h2>
          <div ref={lineChartRef} className="h-[360px]" />
        </div>

        <div className="rounded-2xl border border-slate-200/50 bg-white/80 p-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/80">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">维度详细对比</h2>
          <div ref={barChartRef} className="h-[400px]" />
        </div>

        <div className="rounded-2xl border border-slate-200/50 bg-white/80 p-4 shadow-sm dark:border-slate-700/50 dark:bg-slate-900/80">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">特征标签</h2>
          </div>
          <div ref={wordCloudChartRef} className="h-[400px]" />
        </div>
      </div>
    </div>
  );
}
