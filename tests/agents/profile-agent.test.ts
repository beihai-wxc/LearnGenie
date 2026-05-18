import { describe, expect, it } from 'vitest';
import { createDefaultProfileDimensions } from '@/lib/types/student-profile';
import { buildLearnerProfileFromDialogue } from '@/lib/agents/profile-agent';

describe('profile-agent', () => {
  it('extracts at least several profile signals from dialogue', () => {
    const result = buildLearnerProfileFromDialogue({
      query: '我是零基础，想系统学习激活函数，最好配代码例子，讲慢一点。',
      existingProfile: createDefaultProfileDimensions(),
    });

    expect(result.success).toBe(true);
    expect(result.data.dimensions.knowledgeFoundation.score).toBeGreaterThan(0);
    expect(result.data.dimensions.interactionPreference.preference).toBe('with-code');
    expect(result.data.dimensions.learningPace.paceLevel).toBe('slow');
    expect(result.data.inferredFromDialogue.length).toBeGreaterThan(2);
  });
});

