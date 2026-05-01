const CJK_RE = /[\u4e00-\u9fff]/;

function collectChineseTokens(text: string, tokens: Set<string>) {
  const compact = text.replace(/\s+/g, '');
  for (let i = 0; i < compact.length; i += 1) {
    const current = compact[i];
    if (!CJK_RE.test(current)) continue;
    tokens.add(current);
    if (i < compact.length - 1 && CJK_RE.test(compact[i + 1])) {
      tokens.add(`${current}${compact[i + 1]}`);
    }
  }
}

export function normalizeText(input: string): string {
  return input.replace(/\r/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

export function tokenizeText(input: string): string[] {
  const normalized = normalizeText(input);
  const tokens = new Set<string>();
  const englishMatches = normalized.match(/[a-z0-9][a-z0-9_-]*/g) ?? [];
  for (const match of englishMatches) {
    if (match.length > 1) tokens.add(match);
  }
  collectChineseTokens(normalized, tokens);
  return [...tokens];
}

export function extractTopKeywords(input: string, limit = 12): string[] {
  const stopwords = new Set([
    'the',
    'and',
    'for',
    'with',
    'that',
    'this',
    'from',
    'into',
    '课程',
    '知识',
    '学习',
    '内容',
    '学生',
    '人工智能',
    '模块',
    '介绍',
    '理解',
  ]);
  const counts = new Map<string, number>();
  for (const token of tokenizeText(input)) {
    if (stopwords.has(token)) continue;
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([token]) => token);
}
