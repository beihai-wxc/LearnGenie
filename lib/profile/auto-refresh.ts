/**
 * Profile auto-refresh — per-turn LLM-based profile update with NO_CHANGE sentinel.
 * Patterned after DeepTutor's MemoryService.refresh_from_turn().
 */

import { createLogger } from '@/lib/logger';
import type { StudentProfileDimensions, LearningSummary } from '@/lib/types/student-profile';

const log = createLogger('ProfileAutoRefresh');
const NO_CHANGE = 'NO_CHANGE';

export interface ProfileUpdateInput {
  userMessage: string;
  assistantMessage: string;
  sessionId?: string;
  language?: string;
}

export interface ProfileUpdateResult {
  profileChanged: boolean;
  summaryChanged: boolean;
  profileMarkdown?: string;
  summaryMarkdown?: string;
}

const EXPECTED_PROFILE_HEADINGS = [
  'identity', 'user identity', 'learning style', 'knowledge level',
  'preferences', '身份', '用户身份', '学习风格', '学习方式', '知识水平', '偏好',
];

const EXPECTED_SUMMARY_HEADINGS = [
  'current focus', 'accomplishments', 'open questions',
  'learning journey', '当前关注', '当前学习', '已完成', '学习成果',
  '开放问题', '待解决问题', '学习旅程',
];

function normalizeHeading(value: string): string {
  return value.replace(/[*_`]+/g, '').replace(/[:：#\s]+$/, '').trim().toLowerCase();
}

function isValidMemoryRewrite(which: 'profile' | 'summary', content: string): boolean {
  const allowed = which === 'profile' ? EXPECTED_PROFILE_HEADINGS : EXPECTED_SUMMARY_HEADINGS;
  const headings = Array.from(content.matchAll(/^##(?!#)\s*(.+?)\s*$/gm));
  return headings.some((m) => m[1] && allowed.includes(normalizeHeading(m[1])));
}

function buildTurnSource(input: ProfileUpdateInput): string {
  return [
    `[Session] ${input.sessionId || '(unknown)'}`,
    `[Timestamp] ${new Date().toISOString()}`,
    '',
    `[User]\n${input.userMessage.trim()}`,
    '',
    `[Assistant]\n${input.assistantMessage.trim()}`,
  ].join('\n');
}

function profileRewritePrompt(current: string, source: string, zh: boolean): { system: string; user: string } {
  if (zh) {
    return {
      system: [
        '你负责维护一份用户画像文档。只保留稳定的用户身份、偏好、知识水平。',
        `如果无需修改，请只返回 ${NO_CHANGE}。`,
      ].join(' '),
      user: [
        '如果需要更新，请重写用户画像，可使用以下标题：',
        '## Identity\n## Learning Style\n## Knowledge Level\n## Preferences',
        '',
        '规则：保持简短，删除过时内容，不要记录临时对话。',
        '',
        `[当前画像]\n${current || '(empty)'}`,
        '',
        `[新增材料]\n${source}`,
      ].join('\n'),
    };
  }
  return {
    system: [
      'You maintain a user profile document. Only keep stable identity,',
      'preferences, and knowledge levels.',
      `If nothing should change, return exactly ${NO_CHANGE}.`,
    ].join(' '),
    user: [
      'Rewrite the user profile if needed. Suggested sections:',
      '## Identity\n## Learning Style\n## Knowledge Level\n## Preferences',
      '',
      'Rules: keep it short, remove stale items, no transient chatter.',
      '',
      `[Current profile]\n${current || '(empty)'}`,
      '',
      `[New material]\n${source}`,
    ].join('\n'),
  };
}

function summaryRewritePrompt(current: string, source: string, zh: boolean): { system: string; user: string } {
  if (zh) {
    return {
      system: [
        '你负责维护一份学习旅程摘要。记录用户正在学什么、完成了什么、有哪些待解决的问题。',
        `如果无需修改，请只返回 ${NO_CHANGE}。`,
      ].join(' '),
      user: [
        '如果需要更新，请重写学习旅程摘要，可使用以下标题：',
        '## Current Focus\n## Accomplishments\n## Open Questions',
        '',
        '规则：保持简短，删除已完成或过时的条目。',
        '',
        `[当前摘要]\n${current || '(empty)'}`,
        '',
        `[新增材料]\n${source}`,
      ].join('\n'),
    };
  }
  return {
    system: [
      'You maintain a learning journey summary. Track what the user is studying,',
      'what they\'ve accomplished, and what open questions remain.',
      `If nothing should change, return exactly ${NO_CHANGE}.`,
    ].join(' '),
    user: [
      'Rewrite the learning summary if needed. Suggested sections:',
      '## Current Focus\n## Accomplishments\n## Open Questions',
      '',
      'Rules: keep it short, remove completed/stale items.',
      '',
      `[Current summary]\n${current || '(empty)'}`,
      '',
      `[New material]\n${source}`,
    ].join('\n'),
  };
}

/**
 * Quick heuristic check to avoid unnecessary LLM calls.
 * Returns true if the messages contain potential learning signals.
 */
function hasLearningSignals(input: ProfileUpdateInput): boolean {
  const combined = `${input.userMessage} ${input.assistantMessage}`.toLowerCase();
  const signalWords = [
    '不懂', '不理解', '不知道', '什么是', '怎么', '为什么',
    '我学会', '我懂了', '明白了', '知道了', '原来如此',
    '喜欢', '感兴趣', '偏好', '更喜欢',
    '太慢', '太快', '详细', '简单',
    "don't understand", 'what is', 'how to', 'why',
    'i learned', 'i prefer', 'i like',
  ];
  return signalWords.some((word) => combined.includes(word));
}

/**
 * Attempt to refresh the user profile from a single conversation turn.
 * Uses the NO_CHANGE sentinel to avoid unnecessary rewrites.
 *
 * @param input - The user and assistant messages from the turn
 * @param currentProfileMarkdown - Current PROFILE.md content
 * @param currentSummaryMarkdown - Current SUMMARY.md content
 * @param llmCall - Function to call the LLM (lightweight, temperature=0.2)
 * @param language - 'zh' or 'en'
 */
export async function refreshProfileFromTurn(
  input: ProfileUpdateInput,
  currentProfileMarkdown: string,
  currentSummaryMarkdown: string,
  llmCall: (systemPrompt: string, userPrompt: string) => Promise<string>,
  language = 'zh',
): Promise<ProfileUpdateResult> {
  if (!input.userMessage.trim() || !input.assistantMessage.trim()) {
    return { profileChanged: false, summaryChanged: false };
  }

  if (!hasLearningSignals(input)) {
    return { profileChanged: false, summaryChanged: false };
  }

  const source = buildTurnSource(input);
  const zh = language.toLowerCase().startsWith('zh');

  let profileChanged = false;
  let summaryChanged = false;
  let profileMarkdown: string | undefined;
  let summaryMarkdown: string | undefined;

  // Rewrite profile
  try {
    const { system, user } = profileRewritePrompt(currentProfileMarkdown, source, zh);
    const raw = await llmCall(system, user);
    const cleaned = raw.trim();
    if (cleaned && cleaned !== NO_CHANGE && cleaned !== currentProfileMarkdown) {
      if (isValidMemoryRewrite('profile', cleaned)) {
        profileMarkdown = cleaned;
        profileChanged = true;
      } else {
        log.warn('Skipping invalid profile rewrite: missing expected section heading');
      }
    }
  } catch (err) {
    log.warn('Profile auto-refresh failed:', err);
  }

  // Rewrite summary
  try {
    const { system, user } = summaryRewritePrompt(currentSummaryMarkdown, source, zh);
    const raw = await llmCall(system, user);
    const cleaned = raw.trim();
    if (cleaned && cleaned !== NO_CHANGE && cleaned !== currentSummaryMarkdown) {
      if (isValidMemoryRewrite('summary', cleaned)) {
        summaryMarkdown = cleaned;
        summaryChanged = true;
      } else {
        log.warn('Skipping invalid summary rewrite: missing expected section heading');
      }
    }
  } catch (err) {
    log.warn('Summary auto-refresh failed:', err);
  }

  return { profileChanged, summaryChanged, profileMarkdown, summaryMarkdown };
}
