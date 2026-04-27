# 对话式学习画像自主构建模块实现方案

## 当前状态分析
- `lib/store/user-profile.ts`: 仅存储 avatar, nickname, bio 三个基础字段
- `app/profile/page.tsx`: 使用硬编码的模拟数据（dimensions, learningHistory）显示雷达图和饼图
- 没有从对话中提取画像特征的机制
- 没有增量更新的机制

## 实现方案

### 第一步：扩展 UserProfile 数据结构

**文件**: `lib/store/user-profile.ts`

扩展 `UserProfileState` 接口，新增6个画像维度字段，每个维度包含数值和文本描述：

```typescript
export interface StudentProfileDimensions {
  knowledgeFoundation: { score: number; description: string; keywords: string[] };
  cognitiveStyle: { score: number; description: string; style: string; keywords: string[] };
  errorPronePatterns: { score: number; description: string; patterns: string[] };
  learningPace: { score: number; description: string; paceLevel: string };
  interestDirection: { score: number; description: string; areas: string[] };
  metaCognitiveStrategy: { score: number; description: string; strategy: string };
  emotionalMotivation: { score: number; description: string; motivation: string };
  interactionPreference: { score: number; description: string; preference: string };
}

export interface UserProfileState {
  avatar: string;
  nickname: string;
  bio: string;
  learningProfile: StudentProfileDimensions; // 新增
  updatedAt: number; // 新增，记录最后更新时间
  conversationCount: number; // 新增，记录对话轮次
  // ... existing setters
  setLearningProfile: (dimensions: Partial<StudentProfileDimensions>) => void;
  incrementConversationCount: () => void;
}
```

- 每个维度包含 `score`(0-100), `description`(文字描述), 和该维度特定的字段
- `setLearningProfile` 支持部分更新（合并模式，非覆盖）
- `learningProfile` 持久化到 localStorage

---

### 第二步：创建画像提取 API

**新文件**: `app/api/profile/extract/route.ts`

创建独立 API 端点，接收学生对话消息，使用 LLM 提取画像维度：

```
POST /api/profile/extract
Request: {
  messages: Array<{ role: "user"|"assistant", content: string }>,
  existingProfile: StudentProfileDimensions | null,
  apiKey: string,
  baseUrl?: string,
  model?: string,
  providerType?: string,
}
Response: {
  profile: StudentProfileDimensions,
  updatedFields: string[], // 本次更新的维度名
}
```

实现逻辑：
1. 使用当前配置的 LLM 模型
2. 构造 system prompt：包含8个维度的定义和提取规则
3. 传入用户的历史对话消息
4. 使用 JSON structured output 返回提取结果
5. 与现有 profile 合并（仅更新有变化的维度）

---

### 第三步：创建画像提取 Prompt 模板

**新文件**: `lib/prompts/templates/profile-extraction/system.md`

```
你是一个专业的教育心理学家和画像分析师。你的任务是分析学生与教师的对话内容，提取学生的多维度学习画像。

请从对话中分析以下8个维度：

## 1. 知识基础 (knowledgeFoundation)
分析学生已掌握的核心概念和先修知识完成度
- 关注：学生对概念的陈述、不理解的内容、提问深度
- 关键词模式："我知道..."、"...不太理解"、"什么是..."
- 评分：0-100，越高表示基础越扎实

## 2. 认知风格 (cognitiveStyle)
分析学生的学习偏好（视觉/文本/序列/全局/分析/直觉）
- 关注："能画个图吗"、"先讲定义再举例"、"能举个具体的例子吗"
- 可能的风格：visual, textual, sequential, global, analytical, intuitive
- 评分：风格明确程度 0-100

## 3. 易错点偏好 (errorPronePatterns)
分析学生的常见错误类型或概念混淆模式
- 关注："经常把X和Y搞混"、"我总是不理解..."、"这里我老是做错"
- 记录具体的混淆模式

## 4. 学习节奏 (learningPace)
分析学生的内容消化速度和重复需求
- 关注："讲短一点"、"能再解释一遍吗"、"太快了"、"慢一点"
- 节奏等级：slow, medium, fast
- 评分：对节奏需求的明确程度 0-100

## 5. 兴趣方向 (interestDirection)
分析学生对子领域或应用场景的偏好
- 关注："我对X更感兴趣"、"Y不太想深入"、"能不能讲讲Z的应用"
- 记录感兴趣的领域和应用场景

## 6. 元认知策略 (metaCognitiveStrategy)
分析学生对自己学习状态的觉察和求助方式
- 关注："我不确定我理解的对不对"、"直接给答案吧"、"我想自己试试"
- 策略类型：self-checking, direct-answer, independent-exploration
- 评分：元认知意识强度 0-100

## 7. 情感动机 (emotionalMotivation)
分析学生的学习动机和情感态度
- 关注："这个好有趣"、"学这个有什么用"、"我有点跟不上，有点沮丧"
- 动机类型：intrinsic, extrinsic, social, achievement
- 评分：学习积极性 0-100

## 8. 交互偏好 (interactionPreference)
分析学生的回答偏好（简答/详答/带代码/带类比）
- 关注："简单说"、"详细解释一下"、"能用类比吗"、"给段代码看看"
- 偏好类型：brief, detailed, with-code, with-analogy, with-example
- 评分：偏好明确程度 0-100

## 输出格式
你必须输出严格的 JSON，格式如下：
{
  "knowledgeFoundation": { "score": 75, "description": "...", "keywords": [...] },
  "cognitiveStyle": { "score": 85, "description": "...", "style": "visual", "keywords": [...] },
  ...
}

评分规则：
- 0-30: 信息不足，无法判断
- 31-60: 有初步迹象
- 61-80: 特征明显
- 81-100: 特征非常突出

注意：
- 只基于对话中的实际证据，不要臆测
- 如果没有足够证据，保持原分数不变（传入了现有画像时）
- description 使用中文
```

---

### 第四步：在对话流程中集成画像提取

**修改文件**: `components/chat/use-chat-sessions.ts`

在 `sendMessage` 函数中，每次用户发送消息后：
1. 将消息添加到历史记录
2. 触发异步画像提取（不阻塞主对话流）
3. 更新 UserProfile Store

```typescript
// 在 sendMessage 的适当位置添加：
const handleProfileUpdate = useCallback(async (sessionId: string) => {
  const session = sessionsRef.current.find(s => s.id === sessionId);
  if (!session) return;
  
  const userMessages = session.messages.filter(m => m.role === 'user');
  if (userMessages.length < 2) return; // 至少2轮对话才提取
  
  const existingProfile = useUserProfileStore.getState().learningProfile;
  // 调用 API
  const response = await fetch('/api/profile/extract', { ... });
  const data = await response.json();
  
  // 更新 store
  useUserProfileStore.getState().setLearningProfile(data.profile);
  useUserProfileStore.getState().incrementConversationCount();
}, []);
```

---

### 第五步：重构学生肖像页面（Profile Page）

**修改文件**: `app/profile/page.tsx`

将页面从静态展示改为交互式对话式构建：

#### 5a. 新增对话输入区域
- 在页面顶部添加聊天输入框（类似课堂中的聊天输入）
- 用户可以用自然语言描述自己的学习情况
- 支持语音输入（已有 TTS/ASR 功能）

#### 5b. 新增对话历史记录区
- 显示最近几轮与系统关于画像构建的对话
- 使用 `components/ui/chat` 组件或自建的简单对话组件

#### 5c. 更新雷达图维度
将雷达图的维度从当前的7个改为8个标准维度：
- 知识基础
- 认知风格
- 易错点偏好
- 学习节奏
- 兴趣方向
- 元认知策略
- 情感动机
- 交互偏好

#### 5d. 移除饼图，新增维度趋势图
- 移除"学习科目分布"饼图
- 新增"维度变化趋势"图（显示各维度随对话轮次的变化）

#### 5e. 维度详情卡片更新
- 每个卡片显示：维度名称、分数、描述、关键词/特征标签
- 新增"最后更新"时间戳
- 新增"置信度"指示器

#### 5f. 新增"快速构建"引导对话
- 提供一组引导性问题按钮，点击后自动发送
- 例如："告诉我你的学习基础"、"你喜欢的学习方式是什么"等

---

### 第六步：新增对话式引导组件

**新文件**: `components/profile/profile-chat-input.tsx`

简单的聊天输入组件：
- 文本输入框
- 发送按钮
- 语音输入按钮（复用已有 ASR）
- 引导问题建议（可点击的快速提问）

**新文件**: `components/profile/profile-conversation-history.tsx`

对话历史组件：
- 显示最近的对话记录
- 用户消息和系统回复的区分样式
- 最大显示 N 条（可折叠）

---

### 第七步：创建画像查询接口

**修改文件**: `lib/store/user-profile.ts`

新增一个查询方法，供其他智能体读取当前画像：

```typescript
export function getStudentProfileSnapshot(): StudentProfileDimensions {
  return useUserProfileStore.getState().learningProfile;
}
```

同时，在 `app/api/chat/route.ts` 的 request 中，确保传入完整的 learningProfile 给 AI：

**修改文件**: `lib/types/chat.ts`
```typescript
// 在 StatelessChatRequest 中扩展 userProfile 类型
userProfile?: {
  nickname?: string;
  bio?: string;
  learningProfile?: StudentProfileDimensions; // 新增
};
```

**修改文件**: `lib/orchestration/prompt-builder.ts`
```typescript
// 扩展 buildStudentProfileSection 函数
function buildStudentProfileSection(userProfile?: { nickname?: string; bio?: string; learningProfile?: StudentProfileDimensions }): string {
  // ... 增加 learningProfile 的注入
}
```

---

### 第八步：新增类型定义

**新文件**: `lib/types/student-profile.ts`

集中定义所有画像相关的类型：

```typescript
export interface DimensionBase {
  score: number;
  description: string;
}

export interface KnowledgeFoundation extends DimensionBase {
  keywords: string[];
}

export interface CognitiveStyle extends DimensionBase {
  style: 'visual' | 'textual' | 'sequential' | 'global' | 'analytical' | 'intuitive' | 'unknown';
  keywords: string[];
}

export interface ErrorPronePatterns extends DimensionBase {
  patterns: string[];
}

export interface LearningPace extends DimensionBase {
  paceLevel: 'slow' | 'medium' | 'fast' | 'unknown';
}

export interface InterestDirection extends DimensionBase {
  areas: string[];
}

export interface MetaCognitiveStrategy extends DimensionBase {
  strategy: 'self-checking' | 'direct-answer' | 'independent-exploration' | 'mixed' | 'unknown';
}

export interface EmotionalMotivation extends DimensionBase {
  motivation: 'intrinsic' | 'extrinsic' | 'social' | 'achievement' | 'mixed' | 'unknown';
}

export interface InteractionPreference extends DimensionBase {
  preference: 'brief' | 'detailed' | 'with-code' | 'with-analogy' | 'with-example' | 'mixed' | 'unknown';
}

export interface StudentProfileDimensions {
  knowledgeFoundation: KnowledgeFoundation;
  cognitiveStyle: CognitiveStyle;
  errorPronePatterns: ErrorPronePatterns;
  learningPace: LearningPace;
  interestDirection: InterestDirection;
  metaCognitiveStrategy: MetaCognitiveStrategy;
  emotionalMotivation: EmotionalMotivation;
  interactionPreference: InteractionPreference;
}
```

---

### 第九步：修改 use-chat-sessions 传入完整画像

**修改文件**: `components/chat/use-chat-sessions.ts`

在调用 agent loop 时，传入完整的 learningProfile：

```typescript
const userProfileState = useUserProfileStore.getState();
// 修改现有的 userProfile 传入
userProfile: {
  nickname: userProfileState.nickname || undefined,
  bio: userProfileState.bio || undefined,
  learningProfile: userProfileState.learningProfile, // 新增
},
```

---

### 第十步：更新 i18n 多语言文案

**修改文件**: `lib/i18n/locales/zh-CN.json`
**修改文件**: `lib/i18n/locales/en.json`（如果存在）

新增以下 key：
- `profile.chatInputPlaceholder`
- `profile.quickBuildGuide`
- `profile.dimensions.*`（8个维度的名称和说明）
- `profile.noDataHint`
- `profile.lastUpdated`
- `profile.conversationCount`
- `profile.confidenceLevel`

---

### 文件变更清单

| 操作 | 文件路径 |
|------|---------|
| 修改 | `lib/store/user-profile.ts` |
| 修改 | `app/profile/page.tsx` |
| 修改 | `components/chat/use-chat-sessions.ts` |
| 修改 | `lib/types/chat.ts` |
| 修改 | `lib/orchestration/prompt-builder.ts` |
| 修改 | `lib/i18n/locales/zh-CN.json` |
| 新增 | `lib/types/student-profile.ts` |
| 新增 | `app/api/profile/extract/route.ts` |
| 新增 | `lib/prompts/templates/profile-extraction/system.md` |
| 新增 | `components/profile/profile-chat-input.tsx` |
| 新增 | `components/profile/profile-conversation-history.tsx` |

---

### 实施顺序

1. 新增类型定义 `lib/types/student-profile.ts`
2. 扩展 `lib/store/user-profile.ts` 数据结构和持久化
3. 创建画像提取 prompt 模板
4. 创建画像提取 API `app/api/profile/extract/route.ts`
5. 创建对话输入组件 `components/profile/profile-chat-input.tsx`
6. 创建对话历史组件 `components/profile/profile-conversation-history.tsx`
7. 重构 Profile 页面 `app/profile/page.tsx`
8. 集成画像提取到对话流程 `components/chat/use-chat-sessions.ts`
9. 更新 prompt builder 传入完整画像
10. 更新类型定义和 i18n 文案
