/**
 * Markdown profile sync — generates and persists PROFILE.md + SUMMARY.md
 * from the structured learning profile data.
 * Patterned after DeepTutor's two-file memory system.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import {
  KNOWLEDGE_PROFILE_DIR,
  KNOWLEDGE_PROFILE_FILE,
  KNOWLEDGE_SUMMARY_FILE,
} from '@/lib/knowledge-base/constants';
import type { StudentProfileDimensions, LearningSummary } from '@/lib/types/student-profile';
import { createLogger } from '@/lib/logger';

const log = createLogger('ProfileMarkdownSync');

export function generateProfileMarkdown(
  profile: StudentProfileDimensions,
  identity: string,
  nickname?: string,
): string {
  const displayName = nickname || identity || '用户';
  const now = new Date().toISOString().split('T')[0];

  const sections: string[] = [
    `# ${displayName} - 学习画像`,
    `> 最后更新: ${now}`,
    '',
  ];

  if (identity) {
    sections.push('## Identity', identity, '');
  } else if (nickname) {
    sections.push('## Identity', `昵称: ${nickname}`, '');
  }

  // Learning Style (from cognitiveStyle)
  if (profile.cognitiveStyle.style !== 'unknown' && profile.cognitiveStyle.score > 0) {
    sections.push(
      '## Learning Style',
      `认知风格: ${profile.cognitiveStyle.style} (置信度 ${profile.cognitiveStyle.score})`,
      profile.cognitiveStyle.description,
      profile.cognitiveStyle.keywords.length > 0
        ? `关键词: ${profile.cognitiveStyle.keywords.join('、')}`
        : '',
      '',
    );
  } else {
    sections.push('## Learning Style', '（待构建）', '');
  }

  // Knowledge Level
  if (profile.knowledgeFoundation.score > 0) {
    sections.push(
      '## Knowledge Level',
      `知识基础: ${profile.knowledgeFoundation.score}/100`,
      profile.knowledgeFoundation.description,
      profile.knowledgeFoundation.keywords.length > 0
        ? `已掌握概念: ${profile.knowledgeFoundation.keywords.slice(0, 8).join('、')}`
        : '',
      '',
    );
  } else {
    sections.push('## Knowledge Level', '（待构建）', '');
  }

  // Preferences
  const prefs: string[] = [];
  if (profile.interactionPreference.preference !== 'unknown' && profile.interactionPreference.score > 0) {
    prefs.push(`交互偏好: ${profile.interactionPreference.preference}`);
  }
  if (profile.learningPace.paceLevel !== 'unknown' && profile.learningPace.score > 0) {
    prefs.push(`学习节奏: ${profile.learningPace.paceLevel}`);
  }
  if (profile.emotionalMotivation.motivation !== 'unknown' && profile.emotionalMotivation.score > 0) {
    prefs.push(`学习动机: ${profile.emotionalMotivation.motivation}`);
  }
  if (profile.metaCognitiveStrategy.strategy !== 'unknown' && profile.metaCognitiveStrategy.score > 0) {
    prefs.push(`元认知策略: ${profile.metaCognitiveStrategy.strategy}`);
  }

  if (prefs.length > 0) {
    sections.push('## Preferences', ...prefs, '');
  } else {
    sections.push('## Preferences', '（待构建）', '');
  }

  // Interest areas
  if (profile.interestDirection.areas.length > 0) {
    sections.push(
      `### 兴趣方向`,
      profile.interestDirection.description,
      profile.interestDirection.areas.join('、'),
      '',
    );
  }

  // Error-prone patterns
  if (profile.errorPronePatterns.patterns.length > 0) {
    sections.push(
      `### 薄弱环节`,
      profile.errorPronePatterns.description,
      profile.errorPronePatterns.patterns.join('、'),
      '',
    );
  }

  return sections.join('\n').trim() + '\n';
}

export function generateSummaryMarkdown(summary: LearningSummary): string {
  const now = new Date().toISOString().split('T')[0];

  return [
    '# 学习旅程摘要',
    `> 最后更新: ${now}`,
    '',
    '## Current Focus',
    summary.currentFocus || '（暂无记录）',
    '',
    '## Accomplishments',
    summary.accomplishments || '（暂无记录）',
    '',
    '## Open Questions',
    summary.openQuestions || '（暂无记录）',
    '',
  ].join('\n');
}

/**
 * Persist PROFILE.md and SUMMARY.md to the rag/profiles/ directory.
 */
export async function syncProfileMarkdownFiles(
  profile: StudentProfileDimensions,
  identity: string,
  nickname?: string,
  summary?: LearningSummary,
): Promise<void> {
  try {
    await fs.mkdir(KNOWLEDGE_PROFILE_DIR, { recursive: true });

    const profileMd = generateProfileMarkdown(profile, identity, nickname);
    await fs.writeFile(KNOWLEDGE_PROFILE_FILE, profileMd, 'utf8');

    if (summary) {
      const summaryMd = generateSummaryMarkdown(summary);
      await fs.writeFile(KNOWLEDGE_SUMMARY_FILE, summaryMd, 'utf8');
    }

    log.info('Profile markdown files synced');
  } catch (err) {
    log.warn('Failed to sync profile markdown files:', err);
  }
}

/**
 * Read existing PROFILE.md content from disk.
 */
export async function readProfileMarkdown(): Promise<string> {
  try {
    return await fs.readFile(KNOWLEDGE_PROFILE_FILE, 'utf8');
  } catch {
    return '';
  }
}

/**
 * Read existing SUMMARY.md content from disk.
 */
export async function readSummaryMarkdown(): Promise<string> {
  try {
    return await fs.readFile(KNOWLEDGE_SUMMARY_FILE, 'utf8');
  } catch {
    return '';
  }
}
