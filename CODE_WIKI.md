# LearnGenie Code Wiki

> 本文档为 LearnGenie 项目的结构化代码百科，覆盖项目整体架构、模块职责、关键类与函数说明、依赖关系以及运行方式等关键信息。
> 文档基于代码现状生成，便于新接手者快速建立全景认知。

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈](#2-技术栈)
3. [整体架构](#3-整体架构)
4. [目录结构](#4-目录结构)
5. [核心模块职责](#5-核心模块职责)
6. [关键类与函数说明](#6-关键类与函数说明)
7. [关键业务链路](#7-关键业务链路)
8. [数据存储与状态管理](#8-数据存储与状态管理)
9. [Provider 体系](#9-provider-体系)
10. [认证与权限](#10-认证与权限)
11. [国际化与主题](#11-国际化与主题)
12. [依赖关系](#12-依赖关系)
13. [项目运行方式](#13-项目运行方式)
14. [测试与评估](#14-测试与评估)
15. [常见问题排查](#15-常见问题排查)

---

## 1. 项目概述

LearnGenie 是一个基于 Next.js 16 App Router 构建的 **AI 互动课堂系统**（pnpm monorepo），将课程生成、课堂播放、多 Agent 聊天、多媒体生成、知识库检索、导入导出、本地持久化、用户认证、国际化、PBL 教学 等能力整合在同一仓库中。

- **定位**：面向比赛场景的智能教学系统，强调可运行、可演示、可解释、可扩展。
- **形态**：单仓全栈 + 前端本地状态 + 服务端 AI 编排。
- **核心能力**：一键生成课堂、多智能体协作、多形态内容输出（幻灯片 / 测验 / 互动 / PBL）、白板与语音交互、多模型/服务商可插拔。

---

## 2. 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 + React 19 + TypeScript |
| UI 库 | Radix UI / Base UI + Tailwind CSS v4（CSS-based 配置）+ animate.css + motion（framer-motion） |
| 状态管理 | Zustand（10+ stores，含 persist 中间件） |
| 本地持久化 | Dexie / IndexedDB（数据库名 `MAIC-Database`，v14 版本） |
| 主题 | next-themes（light / dark / system） |
| AI 调用 | Vercel AI SDK + LangGraph + LangChain + 多 Provider 适配 |
| 富文本编辑 | ProseMirror（幻灯片编辑器） |
| 图表 | ECharts + echarts-wordcloud |
| 国际化 | i18next + react-i18next（5 种语言动态加载） |
| 认证 | bcryptjs + JWT（jose）+ httpOnly Cookie 会话 |
| 包管理 | pnpm v10 + workspace（monorepo） |
| 测试 | Vitest（单元）+ Playwright（端到端） |
| 公式渲染 | KaTeX + temml + mathml2omml |
| PPT 导出 | pptxgenjs（内部 workspace 包） |
| MCP 协议 | @modelcontextprotocol/sdk（PBL 子系统） |

---

## 3. 整体架构

LearnGenie 采用 **"单仓全栈 + 内置 BFF + 多模型编排"** 架构：

```
┌─────────────────────────────────────────────────────────────┐
│                         表现层 (Frontend)                    │
│  app/ (页面) + components/ (UI/业务组件)                     │
│  状态：Zustand + IndexedDB                                   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / SSE
┌──────────────────────────────▼──────────────────────────────┐
│                    接口层 (API / BFF)                        │
│  app/api/* (Next.js Route Handlers)                         │
│  middleware.ts（JWT + ACCESS_CODE 双重守卫）                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│              领域与编排层 (Domain / Orchestration)           │
│  lib/server/      服务端业务编排                             │
│  lib/orchestration/  Agent 编排 (LangGraph director graph)   │
│  lib/agents/      多 Agent 系统 (6 阶段流水线)               │
│  lib/generation/  课堂生成流水线                             │
│  lib/ai/          模型 Provider 适配                         │
│  lib/action/      动作执行引擎                               │
│  lib/playback/    课堂播放引擎                               │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                 数据与存储层 (Storage)                       │
│  浏览器侧：Dexie/IndexedDB (lib/utils/database.ts)          │
│  服务端侧：文件型用户存储 + 课堂 JSON 持久化                 │
└─────────────────────────────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│             内部包层 (Workspace Packages)                   │
│  packages/mathml2omml   公式导出                            │
│  packages/pptxgenjs     PPT 导出                            │
└─────────────────────────────────────────────────────────────┘
```

**架构特点**：
- 前后端分层但同仓部署，开发调试链路短。
- 真正的业务骨架在 `lib/`，而不是在 `app/api/`。
- 课堂页是最复杂的运行时区域，核心总控在 `components/stage.tsx`。
- 课程生成（异步 job + 轮询）与 Agent 聊天（无状态 SSE + LangGraph）是两套独立但相关的 AI 链路。
- 本地 IndexedDB 持久化是产品体验的重要组成。

---

## 4. 目录结构

```
LearnGenie/
├── app/                          # Next.js App Router 入口层
│   ├── api/                      # 服务端 API 路由（薄路由）
│   ├── bookshelf/                # 历史课堂
│   ├── classroom/[id]/           # 课堂播放页
│   ├── eval/whiteboard/          # 白板评估页
│   ├── generate/                 # 课程生成入口
│   ├── generation-preview/       # 生成过程承接页
│   ├── knowledge/                # 知识库
│   ├── login/  register/         # 认证页
│   ├── profile/                  # 用户画像
│   ├── wrong-questions/          # 错题本
│   ├── layout.tsx                # 根布局（Provider 层级）
│   └── page.tsx                  # 首页 / Landing
├── components/                   # 前端 UI 与交互层
│   ├── agent/ ai-elements/ audio/ auth/
│   ├── bookshelf/ canvas/ chat/ document-preview/
│   ├── generation/ home/ knowledge/ landing/
│   ├── profile/ roundtable/ scene-renderers/
│   ├── settings/ sidebar/ slide-renderer/    # ← 渲染层复杂度最高
│   ├── stage/ ui/ whiteboard/
│   └── stage.tsx                 # 课堂总容器（核心）
├── lib/                          # 业务核心（最值得长期理解）
│   ├── action/                   # 动作执行引擎
│   ├── agents/                   # 多 Agent 系统
│   ├── ai/                       # 模型与 Provider 适配
│   ├── api/                      # Stage API 封装
│   ├── audio/                    # TTS / ASR Provider
│   ├── chat/                     # 聊天动作翻译
│   ├── constants/                # Agent 默认值等
│   ├── contexts/                 # React Context
│   ├── document-preview/         # 文档解析
│   ├── export/                   # 导出（pptx/zip/latex）
│   ├── generation/               # 课堂生成流水线
│   ├── hooks/                    # 通用 hooks
│   ├── i18n/                     # 国际化
│   ├── import/                   # 导入课堂
│   ├── knowledge-base/           # 知识库检索
│   ├── logger.ts                 # 日志工具
│   ├── media/                    # 图片/视频生成
│   ├── orchestration/            # Agent 编排（核心）
│   ├── pbl/                      # PBL 教学系统
│   ├── pdf/                      # PDF 解析
│   ├── playback/                 # 课堂播放引擎
│   ├── profile/                  # 用户画像
│   ├── prompts/                  # Prompt 模板
│   ├── prosemirror/              # 富文本编辑器
│   ├── rag/                      # 向量检索
│   ├── server/                   # 服务端业务编排
│   ├── storage/                  # 存储 Provider
│   ├── store/                    # Zustand 状态仓库（10+）
│   ├── types/                    # 跨层共享类型
│   ├── utils/                    # 工具函数（含 IndexedDB）
│   └── web-search/               # Web 搜索 Provider
├── packages/                     # 内部 workspace 包
│   ├── mathml2omml/
│   └── pptxgenjs/
├── public/                       # 静态资源（头像、Logo）
├── rag/                          # 本地知识库资源与索引
├── tests/  e2e/  eval/           # 测试与评估
├── scripts/                      # 辅助脚本
├── configs/                      # 配置常量
├── middleware.ts                 # 认证守卫
├── next.config.ts                # Next.js 配置
└── package.json                  # 依赖与脚本
```

---

## 5. 核心模块职责

### 5.1 表现层（`app/` + `components/`）

| 路径 | 职责 |
|------|------|
| `app/layout.tsx` | 根布局：ThemeProvider → I18nProvider → ServerProvidersInit → AuthProvider → Toaster |
| `app/page.tsx` | 首页：收集课程需求、上传 PDF、知识库匹配、创建生成会话 |
| `app/generation-preview/page.tsx` | 生成过程承接页：解析 session、调用生成 API、轮询进度 |
| `app/classroom/[id]/page.tsx` | 课堂播放页：加载 stage/scenes，进入互动 |
| `app/bookshelf/` | 历史课堂管理 |
| `app/knowledge/` | 知识库文档列表与查看 |
| `app/login/` `app/register/` | 邮箱登录/注册 |
| `components/stage.tsx` | **课堂总容器**：场景切换、播放状态、讨论状态、白板状态、聊天区统一管理 |
| `components/slide-renderer/` | **渲染层最复杂**：Editor（ProseMirror）、Canvas（拖拽/缩放/旋转）、各类 Element（Text/Image/Shape/Line/Table/Chart/LaTeX/Code/Video） |
| `components/scene-renderers/` | 按场景类型渲染（quiz、interactive、pbl 等） |
| `components/chat/` | 聊天区、会话列表、课堂对话 UI |
| `components/roundtable/` | 圆桌讨论组件 |
| `components/agent/` | Agent 头像、配置面板、工作流面板 |
| `components/settings/` | 模型/音频/图片/视频/PDF/Web Search/Agent 等配置 |
| `components/auth/` | 登录/注册表单、AuthProvider、客户端路由守卫 |
| `components/ui/` | 通用基础组件（button、card、input 等） |

### 5.2 接口层（`app/api/`）

API 层为薄路由，真正业务在 `lib/`。关键路由分组：

| 路由 | 职责 |
|------|------|
| `auth/` | 登录、注册、登出、获取当前用户（JWT + bcrypt） |
| `chat/` | Agent 聊天（无状态 SSE 流，每次传入完整 storeState） |
| `generate-classroom/` | 课程生成（异步 job 模式，前端轮询） |
| `generate/` | 场景大纲流式生成、场景内容/动作生成、Agent 形象生成、图片/视频/TTS |
| `classroom/` `classroom-media/` | 课堂 CRUD 与服务端媒体存取 |
| `knowledge/` | 知识库检索、上传匹配、入库、文档管理 |
| `profile/extract/` | 用户画像抽取 |
| `agent/` | Agent 会话规划、画像、评估、资源包 |
| `pbl/chat/` | PBL 教学聊天（SSE 流） |
| `verify-*` | 各类 Provider 验证（model/image/video/pdf） |
| `parse-pdf/` | PDF 解析 |
| `web-search/` | Web 搜索（Tavily） |
| `quiz-grade/` | 测验批改 |
| `transcription/` | ASR 转录 |
| `proxy-media/` | 媒体代理（含 SSRF 防护） |
| `server-providers/` | 获取服务端环境变量配置的 Provider 列表 |
| `access-code/` | 访问码验证 |
| `health/` | 健康检查 |

### 5.3 领域与编排层（`lib/`）

#### `lib/server/` — 服务端业务编排
连接 API Route 与更底层的生成/存储能力。

| 文件 | 职责 |
|------|------|
| `classroom-generation.ts` | 课堂生成主逻辑（大纲→场景→媒体→TTS→持久化） |
| `classroom-job-runner.ts` | 异步 job 运行器（含进度更新） |
| `classroom-job-store.ts` | job 状态存储 |
| `classroom-storage.ts` | 服务端课堂持久化 |
| `classroom-media-generation.ts` | 媒体与 TTS 生成 |
| `auth-utils.ts` | JWT 创建与验证（jose）、bcrypt 哈希 |
| `user-store.ts` | 文件型用户存储（`.data/users.json`） |
| `resolve-model.ts` | 模型字符串解析为 LanguageModel |
| `provider-config.ts` | 服务端 Provider 配置读取 |
| `proxy-fetch.ts` | 带 SSRF 防护的 fetch 封装 |
| `ssrf-guard.ts` | SSRF 防护（阻止私有网络访问） |
| `document-converter.ts` | 文档格式转换 |
| `search-query-builder.ts` | 搜索查询构建 |
| `api-response.ts` | 统一 API 响应封装（`apiSuccess` / `apiError`） |

#### `lib/orchestration/` — Agent 编排（核心）

| 文件 | 职责 |
|------|------|
| `stateless-generate.ts` | **无状态多 Agent 生成**：单次生成、JSON Array 输出格式、partial-json 流式解析 |
| `director-graph.ts` | **LangGraph StateGraph**：director 节点决定下一个 agent、何时 cue user、何时结束 |
| `director-prompt.ts` | director 决策的 prompt 构建与解析 |
| `prompt-builder.ts` | 结构化 prompt 构建 |
| `ai-sdk-adapter.ts` | AI SDK 与 LangGraph 适配层 |
| `tool-schemas.ts` | 工具 Schema 定义 |
| `summarizers/` | 对话总结器（conversation-summary / message-converter / peer-context / state-context / whiteboard-ledger） |
| `registry/` | Agent 注册表（store/types） |

#### `lib/agents/` — 多 Agent 系统

工作流阶段：**profile → retrieval → planning → resource-generation → review → evaluation**

| 文件 | 职责 |
|------|------|
| `orchestrator.ts` | **工作流编排入口**：串联 6 个阶段 |
| `profile-agent.ts` | 学习者画像构建（从对话推断） |
| `retrieval-agent.ts` | 知识库检索 |
| `path-planning-agent.ts` | 学习路径规划 |
| `resource-agents.ts` | 资源包生成（lecture/quiz/mindmap/reading/code-lab/project/video-script） |
| `review-agent.ts` | 资源审核 |
| `evaluation-agent.ts` | 学习效果评估 |
| `types.ts` | Agent 工作流类型定义（含 `AgentWorkflowStage`） |

#### `lib/generation/` — 课堂生成流水线

| 文件 | 职责 |
|------|------|
| `outline-generator.ts` | 场景大纲生成 |
| `scene-generator.ts` | 场景内容与动作生成 |
| `scene-builder.ts` | 场景组装 |
| `action-parser.ts` | 动作解析 |
| `pipeline-runner.ts` `pipeline-types.ts` | 流水线运行器与类型 |
| `prompt-formatters.ts` | Prompt 格式化 |
| `json-repair.ts` | JSON 修复 |
| `interactive-post-processor.ts` | 互动场景后处理 |

#### `lib/ai/` — 模型与 Provider 适配

| 文件 | 职责 |
|------|------|
| `providers.ts` | **Provider 注册表**（OpenAI/Anthropic/Google/MiniMax/DeepSeek/Qwen/Kimi/GLM/SiliconFlow/Doubao/Grok/Ollama） |
| `llm.ts` | **统一 LLM 调用层**：`callLLM` / `streamLLM` |
| `model-metadata.ts` | 模型元数据（thinking 能力等） |
| `thinking-config.ts` | 推理配置（budget/effort/level） |
| `thinking-context.ts` | AsyncLocalStorage 传递推理参数（server-only） |

#### `lib/action/` 与 `lib/playback/`

| 文件 | 职责 |
|------|------|
| `action/engine.ts` | **ActionEngine**：统一执行所有 agent 动作（spotlight/laser/speech/whiteboard/discussion 等） |
| `playback/engine.ts` | **PlaybackEngine**：课堂播放状态机（idle/playing/paused/live） |
| `playback/derived-state.ts` | 派生状态计算 |
| `playback/index.ts` `types.ts` | 导出与类型 |

#### 其他关键 lib 模块

| 路径 | 职责 |
|------|------|
| `lib/store/` | Zustand 状态仓库（10+ stores） |
| `lib/utils/database.ts` | **IndexedDB 入口**（Dexie，`MAIC-Database` v14） |
| `lib/api/` | Stage API 封装（canvas/element/mode/navigation/scene/whiteboard） |
| `lib/audio/` | TTS / ASR Provider 适配 |
| `lib/media/` | 图片/视频生成 Provider 适配与编排 |
| `lib/pdf/` | PDF 解析 Provider（unpdf / mineru） |
| `lib/knowledge-base/` | 知识库检索、上传入库、概念术语、分词 |
| `lib/rag/` | 向量检索（embedding + vector-store） |
| `lib/web-search/` | Web 搜索 Provider（Tavily/Baidu/Bocha/Brave） |
| `lib/pbl/` | PBL 教学系统（生成、MCP 工具集、系统提示词） |
| `lib/export/` | 导出（classroom-zip、pptx、latex-to-omml、html-parser） |
| `lib/import/` | 导入课堂 |
| `lib/i18n/` | 国际化（5 种语言） |
| `lib/profile/` | 用户画像处理（auto-refresh、markdown-sync） |
| `lib/prosemirror/` | 富文本编辑器 |
| `lib/types/` | 跨层共享类型定义 |
| `lib/prompts/` | Prompt 模板与加载器 |
| `lib/logger.ts` | 日志工具（`createLogger`） |

### 5.4 内部包层（`packages/`）

| 包 | 职责 |
|----|------|
| `mathml2omml` | MathML → OMML 转换（用于 PPT 公式导出） |
| `pptxgenjs` | PPT 生成（fork 自 pptxgenjs，定制扩展） |

---

## 6. 关键类与函数说明

### 6.1 服务端编排

#### `runClassroomGenerationJob` — [lib/server/classroom-job-runner.ts](file:///e:/MY_Project/LearnGenie/lib/server/classroom-job-runner.ts)
异步课堂生成 job 的运行入口。使用内存 `Map<jobId, Promise>` 防止重复执行，通过 `onProgress` 回调持续更新 job 状态。

#### `generateClassroom` — [lib/server/classroom-generation.ts](file:///e:/MY_Project/LearnGenie/lib/server/classroom-generation.ts)
课堂生成主流程：
1. 生成场景大纲（`generateSceneOutlinesFromRequirements`）
2. 逐场景生成内容与动作（`generateSceneContent` / `generateSceneActions`）
3. 生成媒体（`generateMediaForClassroom`）
4. 生成 TTS（`generateTTSForClassroom`）
5. 持久化课堂（`persistClassroom`）

#### `resolveModel` — [lib/server/resolve-model.ts](file:///e:/MY_Project/LearnGenie/lib/server/resolve-model.ts)
将模型字符串（如 `anthropic:claude-3-5-haiku-20241022`）解析为 Vercel AI SDK 的 `LanguageModel` 实例，优先级：客户端传入 > 服务端环境变量 > 默认。

### 6.2 Agent 编排

#### `statelessGenerate` — [lib/orchestration/stateless-generate.ts](file:///e:/MY_Project/LearnGenie/lib/orchestration/stateless-generate.ts)
无状态多 Agent 生成的核心生成器函数。设计要点：
- 后端无状态，所有状态在请求/响应中传递
- 单次生成（无 generate/tool/loop）
- 输出为 JSON Array：`[{type:"action",...},{type:"text",content:"..."}]`
- 使用 `partial-json` 健壮地流式解析不完整 JSON

#### `createOrchestrationGraph` — [lib/orchestration/director-graph.ts](file:///e:/MY_Project/LearnGenie/lib/orchestration/director-graph.ts)
基于 LangGraph `StateGraph` 构建编排图：
```
START → director ──(end)──→ END
           │
           └─(next)→ agent_generate ──→ director (loop)
```
- 单 Agent：director 为纯代码逻辑（无 LLM 调用）
- 多 Agent：director 用 LLM 决策下一个发言者 / USER / END

#### `runAgentWorkflow` — [lib/agents/orchestrator.ts](file:///e:/MY_Project/LearnGenie/lib/agents/orchestrator.ts)
多 Agent 工作流编排入口，串联 6 阶段：profile → retrieval → planning → resource-generation → review → evaluation，返回 `AgentWorkflowSnapshot`。

### 6.3 前端核心

#### `Stage` 组件 — [components/stage.tsx](file:///e:/MY_Project/LearnGenie/components/stage.tsx)
课堂总容器，是课堂页最核心的前端组件。统一管理：
- 场景切换（`currentSceneId`）
- 播放状态（`PlaybackEngine`）
- 讨论状态（`Roundtable`）
- 白板状态（`CanvasArea`）
- 聊天区状态（`ChatArea`）
- 生成进度（`generatingOutlines` / `failedOutlines`）

#### `PlaybackEngine` — [lib/playback/engine.ts](file:///e:/MY_Project/LearnGenie/lib/playback/engine.ts)
课堂播放状态机：
```
idle ──start()──→ playing ──pause()──→ paused
                     ↑ resume()          │
                     └───────────────────┘
live ──pause()──→ paused
  ↑                  │
  │ resume/user msg  │
  └──────────────────┘
```
直接消费 `Scene.actions[]`，无中间编译步骤。

#### `ActionEngine` — [lib/action/engine.ts](file:///e:/MY_Project/LearnGenie/lib/action/engine.ts)
统一的 agent 动作执行层。两种执行模式：
- Fire-and-forget：spotlight、laser（派发后立即返回）
- Synchronous：speech、whiteboard、discussion（等待完成）

替代了原本 28 个 Vercel AI SDK 工具，让在线（流式）与离线（播放）路径共享同一执行层。

### 6.4 状态管理

#### `useStageStore` — [lib/store/stage.ts](file:///e:/MY_Project/LearnGenie/lib/store/stage.ts)
**课堂级核心 store**（IndexedDB 持久化）。管理 stage、scenes、chats、mode、生成状态、outlines 等。所有课堂相关状态汇聚点。

#### `useSettingsStore` — [lib/store/settings.ts](file:///e:/MY_Project/LearnGenie/lib/store/settings.ts)
全局设置 store（localStorage 持久化），涵盖 LLM/TTS/ASR/PDF/Image/Video/WebSearch/Embedding 等多类 Provider 配置。

#### `useAuthStore` — [lib/store/auth.ts](file:///e:/MY_Project/LearnGenie/lib/store/auth.ts)
认证 store（localStorage 持久化），含 token/user/login/register/logout/fetchUser。

### 6.5 类型定义

#### `Stage` / `Scene` — [lib/types/stage.ts](file:///e:/MY_Project/LearnGenie/lib/types/stage.ts)
课堂域核心类型：
- `Stage`：整个课堂/课程，含 id、name、whiteboard、videoManifest、agentIds、generatedAgentConfigs
- `Scene`：单个页面/场景，类型为 `slide | quiz | interactive | pbl`，含 content、actions、whiteboards、multiAgent 配置
- `SceneType`：`'slide' | 'quiz' | 'interactive' | 'pbl'`
- `StageMode`：`'autonomous' | 'playback'`

#### `AgentWorkflowStage` — [lib/agents/types.ts](file:///e:/MY_Project/LearnGenie/lib/agents/types.ts)
多 Agent 工作流的 6 个阶段：`'profile' | 'retrieval' | 'planning' | 'resource-generation' | 'review' | 'evaluation'`，每个阶段返回 `AgentStageResultEnvelope<T>`（含 success/confidence/warnings/sources/nextAction/data）。

#### `StatelessChatRequest` / `StatelessEvent` — [lib/types/chat.ts](file:///e:/MY_Project/LearnGenie/lib/types/chat.ts)
无状态聊天请求与 SSE 事件类型。请求体含 messages、storeState、config（agentIds）、apiKey、model 等。

### 6.6 LLM 调用

#### `callLLM` / `streamLLM` — [lib/ai/llm.ts](file:///e:/MY_Project/LearnGenie/lib/ai/llm.ts)
**统一 LLM 调用层**，所有 LLM 交互应通过这两个函数。内部处理 thinking/reasoning 适配：原生 Provider 映射到 providerOptions，OpenAI-compatible Provider 通过 fetch wrapper 注入。

#### `PROVIDERS` — [lib/ai/providers.ts](file:///e:/MY_Project/LearnGenie/lib/ai/providers.ts)
Provider 注册表，定义了每个 Provider 的 id、name、type、defaultBaseUrl、requiresApiKey、icon、models 等。支持 12+ Provider。

---

## 7. 关键业务链路

### 7.1 课程生成链路（异步 job + 轮询）

```
用户输入需求
    │
    ▼
app/page.tsx (首页) ──写入 sessionStorage──→ 跳转 generation-preview
    │
    ▼
app/api/generate-classroom/route.ts (POST)
    │  创建 jobId，通过 next/after 后台执行
    ▼
lib/server/classroom-job-runner.ts (runClassroomGenerationJob)
    │
    ▼
lib/server/classroom-generation.ts (generateClassroom)
    │
    ├─→ lib/generation/outline-generator.ts (生成大纲)
    ├─→ lib/generation/scene-generator.ts (逐场景生成内容/动作)
    ├─→ lib/server/classroom-media-generation.ts (图片/视频)
    ├─→ lib/server/classroom-media-generation.ts (TTS)
    └─→ lib/server/classroom-storage.ts (persistClassroom)
    │
    ▼
前端轮询 /api/generate-classroom/[jobId] → 完成后跳转 /classroom/[id]
```

### 7.2 课堂播放与课堂内 AI 互动链路

```
app/classroom/[id]/page.tsx
    │
    ▼
components/stage.tsx (Stage 总容器)
    │
    ├─→ lib/store/stage.ts (读取 stage/scenes/chats)
    ├─→ lib/playback/engine.ts (PlaybackEngine 控制播放节奏)
    ├─→ lib/action/engine.ts (ActionEngine 执行动作)
    ├─→ components/canvas/canvas-area.tsx (白板/画布)
    ├─→ components/roundtable/ (圆桌讨论)
    └─→ components/chat/chat-area.tsx (发起对话 / 接收 SSE)
```

### 7.3 Agent 聊天编排链路（无状态 SSE + LangGraph）

```
前端 ChatArea 发起请求 (messages + storeState)
    │
    ▼
app/api/chat/route.ts (POST, SSE)
    │  resolveModel → LanguageModel
    ▼
lib/orchestration/stateless-generate.ts (statelessGenerate)
    │
    ▼
lib/orchestration/director-graph.ts (createOrchestrationGraph)
    │  LangGraph StateGraph: director ↔ agent_generate
    │  director 决定下一个 agent / USER / END
    │  agent_generate 调用 LLM 生成 JSON Array 输出
    ▼
SSE 事件流回前端 (text deltas + tool calls)
    │
    ▼
前端边接收边渲染，支持中断（abort fetch）
```

### 7.4 多 Agent 工作流（6 阶段流水线）

```
runAgentWorkflow (lib/agents/orchestrator.ts)
    │
    ├─→ profile-agent.ts      构建学习者画像
    ├─→ retrieval-agent.ts    知识库检索
    ├─→ path-planning-agent.ts 学习路径规划
    ├─→ resource-agents.ts    资源包生成
    ├─→ review-agent.ts       资源审核
    └─→ evaluation-agent.ts   学习效果评估
            │
            ▼
      AgentWorkflowSnapshot
```

---

## 8. 数据存储与状态管理

### 8.1 前端运行时状态（Zustand）

10+ stores，均使用 `zustand/middleware/persist`。关键 store 在 `lib/store/`：

| Store | 持久化 | 职责 |
|-------|--------|------|
| `stage.ts` | IndexedDB | 课堂级核心 store |
| `auth.ts` | localStorage | 认证状态 |
| `settings.ts` | localStorage | 全局设置（多类 Provider 配置） |
| `ui.ts` | - | UI 状态（设置弹窗开关） |
| `canvas.ts` | - | 画布状态 |
| `keyboard.ts` | - | 键盘快捷键 |
| `snapshot.ts` | - | 快照/撤销 |
| `media-generation.ts` | - | 媒体生成状态 |
| `user-profile.ts` | localStorage（按用户 scoped） | 用户画像 |
| `bookshelf-favorites.ts` | - | 书架收藏 |
| `whiteboard-history.ts` | - | 白板历史 |
| `widget-iframe.ts` | - | Widget iframe |

### 8.2 本地持久化（Dexie / IndexedDB）

入口：[lib/utils/database.ts](file:///e:/MY_Project/LearnGenie/lib/utils/database.ts)
- 数据库名：`MAIC-Database`
- 当前版本：v14

**重要表**（所有用户数据表均含 `userId` 字段实现多账号隔离）：

| 表 | 用途 |
|----|------|
| `stages` | 课堂基本信息 |
| `scenes` | 场景/页面数据 |
| `audioFiles` | TTS 音频文件 |
| `imageFiles` | 图片文件 |
| `snapshots` | 快照 |
| `chatSessions` | 聊天会话 |
| `playbackState` | 播放状态 |
| `stageOutlines` | 大纲 |
| `mediaFiles` | 媒体文件 |
| `generatedAgents` | 生成的 Agent |
| `bookshelf` | 书架 |
| `categories` | 分类 |
| `accessHistory` | 访问历史 |
| `wrongQuestions` | 错题 |

### 8.3 服务端持久化

- 用户存储：文件型 `.data/users.json`（[lib/server/user-store.ts](file:///e:/MY_Project/LearnGenie/lib/server/user-store.ts)）
- 课堂持久化：[app/api/classroom/route.ts](file:///e:/MY_Project/LearnGenie/app/api/classroom/route.ts) + [lib/server/classroom-storage.ts](file:///e:/MY_Project/LearnGenie/lib/server/classroom-storage.ts)

**存储层次总结**：
- "编辑/播放中的即时状态" → Zustand
- "本地恢复与缓存" → IndexedDB
- "生成完成后可分享/可访问的课堂" → 服务端 classroom storage

---

## 9. Provider 体系

项目支持多类 Provider，可通过**环境变量**和**设置面板**共同配置。

### 9.1 LLM Provider（[lib/ai/](file:///e:/MY_Project/LearnGenie/lib/ai/)）

支持 12+ Provider：OpenAI / Anthropic / Google / MiniMax / DeepSeek / Qwen / Kimi / GLM / SiliconFlow / Doubao / Grok / Ollama。

- 适配方式：原生 SDK（OpenAI/Anthropic/Google）+ OpenAI-compatible（其余）
- thinking context：通过 `AsyncLocalStorage` 传递推理参数（server-only）
- 服务端解析：[lib/server/resolve-model.ts](file:///e:/MY_Project/LearnGenie/lib/server/resolve-model.ts)

### 9.2 其他 Provider

| 类别 | 位置 |
|------|------|
| 图片生成 | `lib/media/image-providers.ts` + `lib/media/adapters/`（grok/kling/minimax/nano-banana/qwen/seedream/openai/lemonade） |
| 视频生成 | `lib/media/video-providers.ts` + `lib/media/adapters/`（veo/seedance/kling/minimax/grok） |
| TTS / ASR | `lib/audio/`（含浏览器端 TTS/ASR、voice resolver） |
| PDF 解析 | `lib/pdf/`（unpdf / mineru） |
| Web Search | `lib/web-search/`（Tavily/Baidu/Bocha/Brave） |
| Embedding | `lib/rag/embedding/`（OpenAI/SiliconFlow/Ollama/DashScope/Jina/自定义） |

### 9.3 配置入口

- UI 配置：`components/settings/`
- 服务端配置读取：[lib/server/provider-config.ts](file:///e:/MY_Project/LearnGenie/lib/server/provider-config.ts)
- Provider 验证 API：`app/api/verify-*`
- 服务端 Provider 列表：`app/api/server-providers/route.ts`
- 环境变量示例：[.env.example](file:///e:/MY_Project/LearnGenie/.env.example)

---

## 10. 认证与权限

### 10.1 双重认证机制（[middleware.ts](file:///e:/MY_Project/LearnGenie/middleware.ts)）

1. **JWT 认证**（必选）
   - 验证 `auth_token` Cookie（jose HS256 签名，7 天过期）
   - 保护路径：`/generate`、`/profile`、`/bookshelf`、`/wrong-questions`、`/classroom`、`/generation-preview`、`/knowledge` 及 `/api/*`（auth 端点除外）
   - 未认证 → 重定向 `/login`（页面）或 401（API）

2. **ACCESS_CODE**（可选）
   - 当环境变量配置 `ACCESS_CODE` 时启用
   - 验证 `openmaic_access` Cookie（HMAC SHA-256 签名）
   - 未认证 → 前端展示访问码弹窗

### 10.2 认证流程

- 注册：邮箱 + 密码 + 昵称（密码用 bcryptjs 哈希）
- 登录：返回 JWT（`auth_token` httpOnly Cookie + JSON body，前端存 localStorage）
- 前端状态：[lib/store/auth.ts](file:///e:/MY_Project/LearnGenie/lib/store/auth.ts)（persist 到 localStorage）
- 会话恢复：`AuthProvider`（[components/auth/auth-provider.tsx](file:///e:/MY_Project/LearnGenie/components/auth/auth-provider.tsx)）mount 时调用 `fetchUser()`
- 客户端路由守卫：[components/auth/protected-route.tsx](file:///e:/MY_Project/LearnGenie/components/auth/protected-route.tsx)
- 切换账号：AuthProvider 重置用户画像

### 10.3 关键文件

| 文件 | 职责 |
|------|------|
| `middleware.ts` | 服务端双层守卫 |
| `app/api/auth/` | 登录/注册/登出/获取当前用户/头像 |
| `lib/server/auth-utils.ts` | JWT 创建与验证、bcrypt 哈希 |
| `lib/server/user-store.ts` | 文件型用户存储（`.data/users.json`） |
| `lib/store/auth.ts` | 前端认证状态 |
| `components/auth/` | 登录/注册 UI、AuthProvider、路由守卫 |

---

## 11. 国际化与主题

### 11.1 国际化（i18next）

- 配置：[lib/i18n/config.ts](file:///e:/MY_Project/LearnGenie/lib/i18n/config.ts)
- 支持语言（5 种）：zh-CN（简体中文）/ en-US（English）/ ja-JP（日本語）/ ru-RU（Русский）/ ar-SA（العربية）
- 动态加载：通过 `i18next-resources-to-backend` 按需加载语言包
- 切换入口：[components/language-switcher.tsx](file:///e:/MY_Project/LearnGenie/components/language-switcher.tsx)
- Hook：`useI18n`（[lib/hooks/use-i18n.tsx](file:///e:/MY_Project/LearnGenie/lib/hooks/use-i18n.tsx)）

### 11.2 主题（next-themes）

- 支持模式：light / dark / system
- Hook：[lib/hooks/use-theme.tsx](file:///e:/MY_Project/LearnGenie/lib/hooks/use-theme.tsx)
- Tailwind CSS v4 使用 CSS-based 配置（`@theme inline` 在 `app/globals.css`），无独立 `tailwind.config.ts`

---

## 12. 依赖关系

### 12.1 核心运行时依赖

| 依赖 | 用途 |
|------|------|
| `next` 16.1.2 | 全栈框架（App Router） |
| `react` / `react-dom` 19.2.3 | UI 库 |
| `ai` ^6.0.42 | Vercel AI SDK |
| `@ai-sdk/openai` `@ai-sdk/anthropic` `@ai-sdk/google` | 原生 LLM Provider |
| `@langchain/core` `@langchain/langgraph` | LangGraph 多 Agent 编排 |
| `@modelcontextprotocol/sdk` | MCP 协议（PBL 子系统） |
| `zustand` ^5.0.10 | 状态管理 |
| `dexie` ^4.2.1 | IndexedDB 封装 |
| `immer` ^11.1.3 | 不可变数据更新 |
| `jose` ^6.2.3 | JWT 签名/验证（Edge 兼容） |
| `bcryptjs` ^3.0.3 | 密码哈希 |
| `i18next` `react-i18next` | 国际化 |
| `next-themes` | 主题切换 |
| `motion` ^12.27.5 | 动画（framer-motion） |
| `@xyflow/react` | 节点流程图 |
| `prosemirror-*` | 富文本编辑器 |
| `echarts` `echarts-wordcloud` | 图表 |
| `katex` `temml` | 公式渲染 |
| `shiki` | 代码高亮 |
| `partial-json` `jsonrepair` | 不完整 JSON 解析与修复 |
| `nanoid` | ID 生成 |
| `jszip` `file-saver` | 压缩与文件下载 |
| `pptxtojson` | PPT → JSON |
| `unpdf` | PDF 解析 |
| `sharp` | 图像处理 |
| `undici` | HTTP 客户端 |
| `zod` | 类型校验 |

### 12.2 内部 workspace 包

| 包 | 路径 |
|----|------|
| `mathml2omml` | `packages/mathml2omml/` |
| `pptxgenjs` | `packages/pptxgenjs/` |

由根 `package.json` 的 `postinstall` 脚本自动构建：
```bash
cd packages/mathml2omml && npm run build && cd ../pptxgenjs && npm run build
```

### 12.3 模块间依赖（高层）

```
app/api/*  ──依赖──→  lib/server/*  ──依赖──→  lib/generation/* / lib/ai/*
                              │
                              └──依赖──→  lib/orchestration/*  ──依赖──→  lib/agents/*
                                                                              │
                                                                              └──依赖──→  lib/knowledge-base/* / lib/rag/*

components/*  ──依赖──→  lib/store/*  ──依赖──→  lib/types/*
       │
       └──依赖──→  lib/playback/* / lib/action/* / lib/api/*
```

### 12.4 跨层共享类型

`lib/types/` 是跨层共享类型的汇聚点，含：
- `stage.ts` — Stage / Scene / SceneType / StageMode（**课堂域核心三件套之一**）
- `chat.ts` — ChatSession / StatelessChatRequest / StatelessEvent
- `action.ts` — Action 类型（SpeechAction / DiscussionAction / SpotlightAction 等）
- `generation.ts` — SceneOutline / UserRequirements
- `provider.ts` — ProviderId / ProviderConfig / ModelInfo / ThinkingConfig
- `settings.ts` — 全局设置类型
- `student-profile.ts` — StudentProfileDimensions
- `slides.ts` / `widgets.ts` / `roundtable.ts` / `web-search.ts` / `pdf.ts` / `export.ts` / `edit.ts`

---

## 13. 项目运行方式

### 13.1 环境要求

- Node.js >= 20.9.0（见 `package.json` engines）
- pnpm v10（推荐通过 Corepack 使用）

### 13.2 安装与启动

```bash
# 1. 安装依赖（会自动构建 packages/ 下的 workspace 包）
corepack pnpm install

# 2. 配置环境变量
cp .env.example .env.local
# 至少配置一个 LLM Provider API Key（OpenAI / Gemini / Anthropic / GLM 等）

# 3. 启动开发服务器
corepack pnpm dev
# 默认访问 http://localhost:3000
```

### 13.3 NPM Scripts

| 命令 | 用途 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 生产构建 |
| `pnpm start` | 启动生产服务器 |
| `pnpm lint` | ESLint 检查 |
| `pnpm check` | Prettier 格式检查 |
| `pnpm format` | Prettier 格式化 |
| `pnpm test` | 运行 Vitest 单元测试 |
| `pnpm test:e2e` | 运行 Playwright 端到端测试 |
| `pnpm test:e2e:ui` | Playwright UI 模式 |
| `pnpm rag:build-index` | 构建 RAG 知识库索引 |
| `pnpm eval:whiteboard` | 白板布局评估 |
| `pnpm eval:outline-language` | 大纲语言评估 |
| `pnpm check:i18n-keys` | i18n 键检查 |

### 13.4 环境变量（关键）

详见 [.env.example](file:///e:/MY_Project/LearnGenie/.env.example)。所有变量均为可选，按需配置：

| 类别 | 关键变量 |
|------|---------|
| LLM | `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GOOGLE_API_KEY` / `DEEPSEEK_API_KEY` / `QWEN_API_KEY` / `KIMI_API_KEY` / `MINIMAX_API_KEY` / `GLM_API_KEY` / `SILICONFLOW_API_KEY` / `DOUBAO_API_KEY` / `GROK_API_KEY` / `OLLAMA_BASE_URL` |
| TTS | `TTS_OPENAI_API_KEY` / `TTS_AZURE_API_KEY` / `TTS_GLM_API_KEY` / `TTS_QWEN_API_KEY` / `TTS_MINIMAX_API_KEY` / `TTS_ELEVENLABS_API_KEY` |
| ASR | `ASR_OPENAI_API_KEY` / `ASR_QWEN_API_KEY` |
| PDF | `PDF_UNPDF_API_KEY` / `PDF_MINERU_API_KEY` |
| Image | `IMAGE_SEEDREAM_API_KEY` / `IMAGE_QWEN_IMAGE_API_KEY` / `IMAGE_NANO_BANANA_API_KEY` / `IMAGE_MINIMAX_API_KEY` / `IMAGE_GROK_API_KEY` |
| Video | `VIDEO_SEEDANCE_API_KEY` / `VIDEO_KLING_API_KEY` / `VIDEO_VEO_API_KEY` / `VIDEO_SORA_API_KEY` / `VIDEO_MINIMAX_API_KEY` / `VIDEO_GROK_API_KEY` |
| Web Search | `TAVILY_API_KEY` |
| Embedding | `EMBEDDING_API_KEY` / `EMBEDDING_MODEL` / `EMBEDDING_BINDING` / `EMBEDDING_DIMENSIONS` |
| 其他 | `DEFAULT_MODEL` / `JWT_SECRET` / `ACCESS_CODE` / `ALLOW_LOCAL_NETWORKS` / `LOG_LEVEL` |

### 13.5 部署

- **Vercel**：`next.config.ts` 中 `output: process.env.VERCEL ? undefined : 'standalone'`，原生支持 Vercel 部署
- **自托管**：`output: 'standalone'` 生成独立可部署产物
- **Docker**：项目含 `Dockerfile` 与 `docker-compose.yml`（仓库 README 提到已精简，但文件仍在）

---

## 14. 测试与评估

### 14.1 测试体系

| 目录 | 类型 | 工具 |
|------|------|------|
| `tests/` | 单元测试、服务测试、配置测试 | Vitest |
| `e2e/` | 端到端主流程测试 | Playwright |
| `eval/` | 评估与实验（不完全等同于回归测试） | tsx 脚本 |

### 14.2 测试覆盖范围

- `tests/agents/` — profile-agent、review-agent
- `tests/ai/` — minimax-provider
- `tests/eval/shared/` — run-dir
- `tests/export/` — classroom-zip
- `tests/prompts/` — loader、templates
- `tests/server/` — agent-routes、ssrf-guard
- `e2e/tests/` — full-happy-path、generation-flow
- `eval/whiteboard-layout/` — 白板布局评估
- `eval/outline-language/` — 大纲语言评估

### 14.3 配置文件

- `vitest.config.ts` — Vitest 配置
- `vitest.eval.config.ts` — 评估专用 Vitest 配置
- `playwright.config.ts` — Playwright 配置

---

## 15. 常见问题排查

| 问题 | 排查路径 |
|------|---------|
| 课程生成问题 | `lib/server/classroom-generation.ts` 和 `lib/generation/` |
| 课堂播放/交互问题 | `components/stage.tsx`、`components/stage/`、`lib/playback/` |
| Agent 聊天问题 | `app/api/chat/route.ts`、`lib/orchestration/`、`components/chat/` |
| 知识库/RAG 问题 | `app/api/knowledge/*`、`lib/knowledge-base/`、`rag/` |
| 本地数据问题 | `lib/utils/database.ts`、`lib/utils/stage-storage.ts`、`lib/store/` |
| 认证/登录问题 | `app/login/`、`app/api/auth/`、`lib/store/auth.ts`、`lib/server/auth-utils.ts` |
| 用户资料/画像 | `app/profile/`、`lib/store/user-profile.ts`、`lib/profile/`、`components/user-profile.tsx` |
| 错题本 | `app/wrong-questions/`、`lib/store/` |
| 国际化 | `lib/i18n/`、`components/language-switcher.tsx` |

### 15.1 渲染层最需谨慎的四块

1. **[components/stage.tsx](file:///e:/MY_Project/LearnGenie/components/stage.tsx)** — 课堂总控，状态耦合很多
2. **[components/slide-renderer/](file:///e:/MY_Project/LearnGenie/components/slide-renderer/)** — 幻灯片/画布系统，文件多且联动强
3. **[lib/types/stage.ts](file:///e:/MY_Project/LearnGenie/lib/types/stage.ts)** — 渲染、动作、播放、导出逻辑都依赖此处的类型结构
4. **[lib/store/stage.ts](file:///e:/MY_Project/LearnGenie/lib/store/stage.ts)** — 课堂核心 store，所有课堂相关状态汇聚点

> 通常一个小改动会跨越：`lib/types/*` → `lib/store/*` → `components/stage*` 或 `components/scene-renderers/*` → 导出/播放/生成中的至少一层。

### 15.2 课堂域核心三件套

- [lib/types/stage.ts](file:///e:/MY_Project/LearnGenie/lib/types/stage.ts) — 类型定义
- [lib/store/stage.ts](file:///e:/MY_Project/LearnGenie/lib/store/stage.ts) — 状态管理
- [components/stage.tsx](file:///e:/MY_Project/LearnGenie/components/stage.tsx) — UI 总控

---

## 附录：一句话总结

> LearnGenie 是一个用 Next.js 16 App Router 承载的 AI 互动课堂系统（pnpm monorepo），前端靠 Zustand + IndexedDB（Dexie v14）管理课堂状态，服务端靠 `lib/server` 和 `lib/orchestration` 跑课程生成（异步 job + 轮询）与 Agent 编排（无状态 SSE + LangGraph director graph），渲染核心集中在 `Stage`、scene renderers（quiz/PBL/interactive）和 slide renderer（ProseMirror + ECharts），多 Agent 系统在 `lib/agents/` 按 6 阶段流水线协作，PBL 教学在 `lib/pbl/` 通过 MCP 工具集提供项目式学习支持，JWT 认证在 `middleware.ts` + `app/api/auth/` 提供用户体系，i18next 支持 5 种语言，next-themes 支持 light/dark/system 主题。
