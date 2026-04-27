/**
 * Profile Extraction API
 *
 * POST /api/profile/extract
 * Analyzes student conversation messages using LLM to extract
 * 8-dimension learning profile characteristics.
 *
 * Request:
 * {
 *   messages: Array<{ role: "user" | "assistant", content: string }>,
 *   existingProfile: StudentProfileDimensions | null,
 *   apiKey: string,
 *   baseUrl?: string,
 *   model?: string,
 *   providerType?: string,
 * }
 *
 * Response:
 * {
 *   profile: StudentProfileDimensions,
 *   updatedFields: string[],
 * }
 */

import { NextRequest } from 'next/server';
import { generateObject } from 'ai';
import { z } from 'zod';
import { resolveModel } from '@/lib/server/resolve-model';
import { apiError, apiSuccess } from '@/lib/server/api-response';
import {
  createDefaultProfileDimensions,
  mergeProfileDimensions,
  type StudentProfileDimensions,
} from '@/lib/types/student-profile';
import { createLogger } from '@/lib/logger';

const log = createLogger('ProfileExtract');

const PROFILE_EXTRACTION_SCHEMA = z.object({
  knowledgeFoundation: z.object({
    score: z.number().min(0).max(100),
    description: z.string(),
    keywords: z.array(z.string()),
  }),
  cognitiveStyle: z.object({
    score: z.number().min(0).max(100),
    description: z.string(),
    style: z.enum(['visual', 'textual', 'sequential', 'global', 'analytical', 'intuitive', 'unknown']),
    keywords: z.array(z.string()),
  }),
  errorPronePatterns: z.object({
    score: z.number().min(0).max(100),
    description: z.string(),
    patterns: z.array(z.string()),
  }),
  learningPace: z.object({
    score: z.number().min(0).max(100),
    description: z.string(),
    paceLevel: z.enum(['slow', 'medium', 'fast', 'unknown']),
  }),
  interestDirection: z.object({
    score: z.number().min(0).max(100),
    description: z.string(),
    areas: z.array(z.string()),
  }),
  metaCognitiveStrategy: z.object({
    score: z.number().min(0).max(100),
    description: z.string(),
    strategy: z.enum(['self-checking', 'direct-answer', 'independent-exploration', 'mixed', 'unknown']),
  }),
  emotionalMotivation: z.object({
    score: z.number().min(0).max(100),
    description: z.string(),
    motivation: z.enum(['intrinsic', 'extrinsic', 'social', 'achievement', 'mixed', 'unknown']),
  }),
  interactionPreference: z.object({
    score: z.number().min(0).max(100),
    description: z.string(),
    preference: z.enum(['brief', 'detailed', 'with-code', 'with-analogy', 'with-example', 'mixed', 'unknown']),
  }),
});

const SYSTEM_PROMPT = `你是一个专业的教育心理学家和学习画像分析师。你的任务是分析学生与教师的对话内容，从对话中提取学生的多维度学习画像。

请从对话中分析以下8个维度：

## 1. 知识基础 (knowledgeFoundation)
分析学生已掌握的核心概念和先修知识完成度。
- 关注：学生对概念的陈述、不理解的内容、提问的深度
- 关键词模式："我知道..."、"...不太理解"、"什么是..."
- score 评分：0-100，越高表示基础越扎实
- 输出：score, description(中文描述), keywords(从对话中提取的关键概念)

## 2. 认知风格 (cognitiveStyle)
分析学生的学习偏好（视觉/文本/序列/全局/分析/直觉）。
- 关注："能画个图吗"、"先讲定义再举例"、"能举个具体的例子吗"
- style 可选值：visual(视觉), textual(文本), sequential(序列), global(全局), analytical(分析), intuitive(直觉), unknown(未知)
- score 评分：风格判断的确信程度 0-100
- 输出：score, description(中文描述), style, keywords

## 3. 易错点偏好 (errorPronePatterns)
分析学生的常见错误类型或概念混淆模式。
- 关注："经常把X和Y搞混"、"我总是不理解..."、"这里我老是做错"
- 输出：score(确信程度), description(中文描述), patterns(具体混淆模式列表)

## 4. 学习节奏 (learningPace)
分析学生的内容消化速度和重复需求。
- 关注："讲短一点"、"能再解释一遍吗"、"太快了"、"慢一点"
- paceLevel 可选值：slow(慢), medium(中等), fast(快), unknown(未知)
- score 评分：对节奏需求的明确程度 0-100
- 输出：score, description(中文描述), paceLevel

## 5. 兴趣方向 (interestDirection)
分析学生对子领域或应用场景的偏好。
- 关注："我对X更感兴趣"、"Y不太想深入"、"能不能讲讲Z的应用"
- 输出：score(兴趣明确程度), description(中文描述), areas(感兴趣的领域列表)

## 6. 元认知策略 (metaCognitiveStrategy)
分析学生对自己学习状态的觉察和求助方式。
- 关注："我不确定我理解的对不对"、"直接给答案吧"、"我想自己试试"
- strategy 可选值：self-checking(自我检查), direct-answer(直接求答案), independent-exploration(独立探索), mixed(混合), unknown(未知)
- score 评分：元认知意识强度 0-100
- 输出：score, description(中文描述), strategy

## 7. 情感动机 (emotionalMotivation)
分析学生的学习动机和情感态度。
- 关注："这个好有趣"、"学这个有什么用"、"我有点跟不上，有点沮丧"
- motivation 可选值：intrinsic(内在), extrinsic(外在), social(社交), achievement(成就), mixed(混合), unknown(未知)
- score 评分：学习积极性 0-100
- 输出：score, description(中文描述), motivation

## 8. 交互偏好 (interactionPreference)
分析学生的回答偏好（简答/详答/带代码/带类比/带例子）。
- 关注："简单说"、"详细解释一下"、"能用类比吗"、"给段代码看看"
- preference 可选值：brief(简短), detailed(详细), with-code(带代码), with-analogy(带类比), with-example(带例子), mixed(混合), unknown(未知)
- score 评分：偏好明确程度 0-100
- 输出：score, description(中文描述), preference

## 评分规则
- 0-30: 信息不足，无法判断（保持description为"暂无足够数据"）
- 31-60: 有初步迹象
- 61-80: 特征明显
- 81-100: 特征非常突出

## 重要规则
1. 只基于对话中的实际证据进行分析，不要臆测
2. 如果对话中没有足够的证据支持某个维度，保持该维度的score为0，description为"暂无足够数据，需要通过更多对话了解"
3. description 必须使用中文
4. keywords/patterns/areas 必须从对话中实际提取，不要凭空捏造
5. 严格按照JSON schema输出，不要包含任何解释性文字`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, existingProfile, apiKey, baseUrl, model, providerType } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return apiError('MISSING_REQUIRED_FIELD', 400, 'Missing required field: messages');
    }

    let languageModel;
    try {
      const result = await resolveModel({
        modelString: model,
        apiKey: apiKey || '',
        baseUrl: baseUrl || undefined,
        providerType,
      });
      languageModel = result.model;
    } catch (error) {
      return apiError('INVALID_REQUEST', 401, error instanceof Error ? error.message : String(error));
    }

    const conversationText = messages
      .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
      .join('\n');

    const { object: extractedProfile } = await generateObject({
      model: languageModel,
      schema: PROFILE_EXTRACTION_SCHEMA,
      system: SYSTEM_PROMPT,
      prompt: `以下是学生与教师的对话记录：\n\n${conversationText}\n\n请根据上述对话内容，分析并提取学生的8维度学习画像。`,
    });

    const profileWithTimestamp = addTimestampsToProfile(extractedProfile as StudentProfileDimensions);

    let finalProfile: StudentProfileDimensions;
    const updatedFields: string[] = [];

    if (existingProfile) {
      const dimensionKeys = Object.keys(existingProfile) as (keyof StudentProfileDimensions)[];
      for (const key of dimensionKeys) {
        const newScore = profileWithTimestamp[key].score;
        const oldScore = existingProfile[key].score;
        if (newScore > 0 && newScore > oldScore) {
          updatedFields.push(key);
        }
      }
      finalProfile = mergeProfileDimensions(existingProfile, profileWithTimestamp);
    } else {
      finalProfile = profileWithTimestamp;
      const keys = Object.keys(profileWithTimestamp) as (keyof StudentProfileDimensions)[];
      for (const key of keys) {
        if (profileWithTimestamp[key].score > 0) {
          updatedFields.push(key);
        }
      }
    }

    return apiSuccess({
      profile: finalProfile,
      updatedFields,
    });
  } catch (error) {
    log.error('Profile extraction failed:', error);
    return apiError(
      'INTERNAL_ERROR',
      500,
      error instanceof Error ? error.message : 'Failed to extract profile',
    );
  }
}

function addTimestampsToProfile(profile: StudentProfileDimensions): StudentProfileDimensions {
  const now = Date.now();
  const result = {} as Record<string, Record<string, unknown>>;
  for (const key of Object.keys(profile) as (keyof StudentProfileDimensions)[]) {
    result[key] = { ...profile[key], updatedAt: now };
  }
  return result as unknown as StudentProfileDimensions;
}
