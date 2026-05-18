import { describe, expect, it } from 'vitest';
import { runReviewAgent } from '@/lib/agents/review-agent';
import type { ResourceBundleData, RetrievalAgentData } from '@/lib/agents/types';

describe('review-agent', () => {
  it('downgrades confidence when retrieval is weak', () => {
    const retrieval = {
      matched: false,
      query: '未知主题',
      profileContext: {},
      results: [],
      bestMatch: null,
      autoContext: null,
      recommendedPath: null,
      safetyNote: 'fallback',
    } as RetrievalAgentData;

    const resources: ResourceBundleData = {
      supportedTypes: ['lecture', 'quiz', 'reading', 'mindmap', 'project'],
      items: [
        {
          type: 'lecture',
          title: '讲解',
          summary: 'summary',
          promptSeed: 'seed',
          basedOn: [],
          status: 'partial',
        },
      ],
    };

    const result = runReviewAgent({
      query: '未知主题',
      retrieval,
      resources,
    });

    expect(result.data.approved).toBe(false);
    expect(result.data.confidenceLabel).toBe('low');
    expect(result.data.unsupportedClaims.length).toBeGreaterThan(0);
  });
});

