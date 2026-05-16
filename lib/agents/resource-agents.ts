import type {
  AgentResourceType,
  AgentStageResultEnvelope,
  ResourceBundleData,
  ResourceBundleItem,
} from './types';
import type { RetrievalAgentData } from './types';
import type { StudentProfileDimensions } from '@/lib/types/student-profile';

const DEFAULT_RESOURCE_TYPES: AgentResourceType[] = [
  'lecture',
  'mindmap',
  'quiz',
  'reading',
  'code-lab',
  'project',
];

function pickResourceTypes(
  retrieval: RetrievalAgentData,
  profile?: StudentProfileDimensions,
): AgentResourceType[] {
  const fromResults = retrieval.results.flatMap((result) => result.resourceTypes ?? []);
  const base = [...new Set([...DEFAULT_RESOURCE_TYPES, ...fromResults])] as AgentResourceType[];
  const preferred = new Set<AgentResourceType>(['lecture', 'quiz', 'reading']);

  if (profile?.interactionPreference.preference === 'with-code') {
    preferred.add('code-lab');
    preferred.add('project');
  }
  if (profile?.cognitiveStyle.style === 'visual') {
    preferred.add('mindmap');
  }

  return [
    ...base.filter((type) => preferred.has(type)),
    ...base.filter((type) => !preferred.has(type)),
  ].slice(0, 6);
}

function buildItem(
  type: AgentResourceType,
  query: string,
  sourceTitles: string[],
  bestTitle?: string,
): ResourceBundleItem {
  const sourceHint = bestTitle ?? sourceTitles[0] ?? '当前主题';
  const templates: Record<AgentResourceType, Omit<ResourceBundleItem, 'basedOn' | 'status'>> = {
    lecture: {
      type,
      title: `讲解文档：${query}`,
      summary: `围绕“${query}”生成一份可直接讲授的课堂讲解稿，优先参考 ${sourceHint}。`,
      promptSeed: `请基于知识来源 ${sourceTitles.join('、') || sourceHint}，围绕“${query}”生成结构化讲解文档。`,
    },
    mindmap: {
      type,
      title: `思维导图：${query}`,
      summary: `提炼“${query}”的关键概念、层级关系与前置知识。`,
      promptSeed: `请把“${query}”整理为思维导图结构，优先参考 ${sourceHint}。`,
    },
    quiz: {
      type,
      title: `练习题：${query}`,
      summary: `生成由浅入深的题目，帮助检验当前主题的掌握情况。`,
      promptSeed: `请基于 ${sourceHint} 为“${query}”生成分层练习题。`,
    },
    reading: {
      type,
      title: `拓展阅读：${query}`,
      summary: `为当前主题提供进一步的概念背景、应用场景与延伸方向。`,
      promptSeed: `请基于 ${sourceHint} 为“${query}”整理拓展阅读建议。`,
    },
    'code-lab': {
      type,
      title: `代码实操：${query}`,
      summary: `把当前知识点转成可执行的小实验或代码练习。`,
      promptSeed: `请把“${query}”设计成一份代码实操任务，知识依据为 ${sourceHint}。`,
    },
    project: {
      type,
      title: `实践项目：${query}`,
      summary: `设计一个和当前主题相关的小项目，帮助把知识迁移到真实任务。`,
      promptSeed: `请为“${query}”设计一份项目实践任务，优先基于 ${sourceHint}。`,
    },
    'video-script': {
      type,
      title: `视频脚本：${query}`,
      summary: `把当前主题整理成适合短视频或动画演示的讲解脚本。`,
      promptSeed: `请把“${query}”整理成短视频/动画脚本，参考 ${sourceHint}。`,
    },
  };

  return {
    ...templates[type],
    basedOn: sourceTitles,
    status: sourceTitles.length > 0 ? 'ready' : 'partial',
  };
}

export function runResourceAgents(input: {
  query: string;
  retrieval: RetrievalAgentData;
}): AgentStageResultEnvelope<ResourceBundleData> {
  const profile = input.retrieval.profileContext.learningProfile;
  const supportedTypes = pickResourceTypes(input.retrieval, profile);
  const sourceTitles = input.retrieval.results.slice(0, 3).map((result) => result.title);
  const bestTitle = input.retrieval.bestMatch?.title;
  const items = supportedTypes.map((type) => buildItem(type, input.query, sourceTitles, bestTitle));

  return {
    success: true,
    stage: 'resource-generation',
    confidence: input.retrieval.matched ? 0.8 : 0.55,
    warnings: input.retrieval.matched
      ? []
      : ['当前资源包以主题生成模板为主，知识库依据相对较弱。'],
    sources: input.retrieval.results.slice(0, 3).map((result) => ({
      docId: result.docId,
      title: result.title,
      excerpt: result.summary,
    })),
    nextAction: input.retrieval.matched ? 'show_recommendations' : 'generate_classroom',
    data: {
      items,
      supportedTypes,
    },
  };
}

