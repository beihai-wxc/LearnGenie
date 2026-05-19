import { describe, expect, it } from 'vitest';
import { runPathPlanningAgent } from '@/lib/agents/path-planning-agent';
import type { RetrievalAgentData } from '@/lib/agents/types';

describe('path-planning-agent', () => {
  it('reuses recommended learning path when available', () => {
    const retrieval = {
      matched: true,
      query: '什么是激活函数',
      profileContext: {},
      results: [],
      bestMatch: {
        docId: 'doc-1',
        title: '深度学习基础',
        module: '核心知识',
        summary: 'summary',
        score: 0.45,
        reasons: [],
        pdfUrl: '',
        previewText: '',
        pdfAvailable: true,
        sourceType: 'seed',
        sourceLabel: '核心知识',
        matchedBy: 'concept',
        matchedChunks: [],
      },
      autoContext: null,
      recommendedPath: {
        title: '推荐学习路径',
        summary: '先学基础，再看实战',
        personalizedFor: [],
        steps: [],
      },
      safetyNote: '',
    } as RetrievalAgentData;

    const result = runPathPlanningAgent(retrieval);
    expect(result.success).toBe(true);
    expect(result.data.recommendedPath?.title).toBe('推荐学习路径');
    expect(result.data.summary).toContain('先学基础');
  });
});

