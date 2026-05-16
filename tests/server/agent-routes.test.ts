import { describe, expect, it } from 'vitest';

describe('agent api routes', () => {
  it('returns workflow data from session-plan route', async () => {
    const { POST } = await import('@/app/api/agent/session-plan/route');
    const req = new Request('http://localhost/api/agent/session-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: '我是零基础，想学习激活函数，最好配代码例子',
        mode: 'topic',
      }),
    });

    const res = await POST(req as never);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.workflow.profile.stage).toBe('profile');
    expect(json.workflow.resources.data.items.length).toBeGreaterThanOrEqual(5);
  });

  it('returns evaluation data from evaluate route', async () => {
    const { POST } = await import('@/app/api/agent/evaluate/route');
    const req = new Request('http://localhost/api/agent/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentProfile: {
          learningPace: { score: 0, description: '', paceLevel: 'unknown', updatedAt: 0 },
        },
        evaluation: {
          selfReportedUnderstanding: 'low',
          freeformFeedback: '还是不懂',
        },
      }),
    });

    const res = await POST(req as never);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.result.stage).toBe('evaluation');
    expect(json.result.data.masteryEstimate).toBeLessThan(50);
  });
});
