# LearnGenie Project Context

这份文档面向“新开启对话的 AI / 新接手项目的人”。
目标是用最短路径理解这个仓库的框架结构、核心链路、关键模块和阅读顺序。

## 1. 项目一句话说明

LearnGenie 是一个基于 Next.js App Router 的 AI 互动课堂应用。
它把“课程生成、课堂播放、Agent 聊天、多媒体生成、知识库检索、导入导出、本地持久化”放在同一个仓库里，属于“单仓全栈 + 前端本地状态 + 服务端 AI 编排”的结构。

## 2. 技术栈与总体形态

- 框架：Next.js 16 + React 19 + TypeScript
- UI：自定义组件 + Radix/Base UI + motion + Tailwind 4
- 状态管理：Zustand
- 本地持久化：Dexie / IndexedDB
- AI 调用：AI SDK + LangGraph + 多 Provider 适配
- 测试：Vitest + Playwright
- 包结构：主应用 + `packages/` 下两个 workspace 包

这个项目不是前后端分离的双仓库，而是：

- `app/` 同时放页面路由和 API Route
- `components/` 放前端交互与渲染层
- `lib/` 放业务核心、生成流水线、AI 编排、存储、工具函数
- `packages/` 放被主应用复用的内部包

## 3. 先读什么

如果是新的 AI 会话，推荐按这个顺序读：

1. `PROJECT_CONTEXT.md`
2. `ARCHITECTURE.md`
3. `README.md`
4. `package.json`
5. `app/page.tsx`
6. `app/generation-preview/page.tsx`
7. `app/api/generate-classroom/route.ts`
8. `lib/server/classroom-generation.ts`
9. `app/api/chat/route.ts`
10. `lib/orchestration/director-graph.ts`
11. `components/stage.tsx`
12. `lib/store/stage.ts`

如果只想快速定位问题：

- 课程生成问题：看 `lib/server/classroom-generation.ts` 和 `lib/generation/`
- 课堂播放/交互问题：看 `components/stage.tsx`、`components/stage/`、`lib/playback/`
- Agent 聊天问题：看 `app/api/chat/route.ts`、`lib/orchestration/`、`components/chat/`
- 知识库/RAG 问题：看 `app/api/knowledge/*`、`lib/knowledge-base/`、`rag/`
- 本地数据问题：看 `lib/utils/database.ts`、`lib/utils/stage-storage.ts`、`lib/store/`

## 4. 顶层目录地图

### `app/`

Next.js App Router 入口层。

- `app/page.tsx`
  首页，负责收集课程需求、上传 PDF、触发知识库匹配、创建生成会话。
- `app/generation-preview/`
  生成过程承接页，负责解析 session、逐步执行生成链路、展示生成进度。
- `app/classroom/[id]/`
  课程播放页，加载 stage/scenes，进入课堂互动。
- `app/bookshelf/`
  书架/内容管理入口。
- `app/knowledge/[docId]/`
  知识库文档查看页。
- `app/api/`
  服务端 API 层，主要是薄路由，真正业务多在 `lib/`。

### `components/`

前端 UI 和交互层，模块很多，但可以按职责理解：

- `components/home/`
  首页展示和输入。
- `components/settings/`
  模型、音频、图片、视频、PDF、Web Search 等配置界面。
- `components/chat/`
  聊天区、会话列表、课堂对话 UI。
- `components/stage.tsx`
  课堂总容器，是课堂页最核心的前端组件之一。
- `components/stage/`
  场景渲染与场景侧边栏。
- `components/scene-renderers/`
  按场景类型渲染互动内容，比如 quiz、PBL 等。
- `components/slide-renderer/`
  幻灯片/画布渲染编辑体系，体量很大，是渲染层复杂度最高的目录。
- `components/whiteboard/`、`components/canvas/`
  白板和画布交互。
- `components/bookshelf/`
  书架和错题等内容管理 UI。
- `components/ui/`
  通用基础组件。

### `lib/`

业务核心都在这里，是最值得长期理解的目录。

- `lib/server/`
  服务端业务编排层，连接 API Route 和更底层的生成/存储能力。
- `lib/generation/`
  课程生成流水线，包含大纲生成、场景内容生成、动作生成、场景组装等。
- `lib/orchestration/`
  Agent 编排层，尤其是聊天会话的 director graph、prompt 构建、状态总结。
- `lib/ai/`
  模型与 Provider 适配。
- `lib/media/`
  图片/视频生成 Provider 适配和编排。
- `lib/audio/`
  TTS / ASR Provider 适配。
- `lib/pdf/`
  PDF 解析 Provider 适配。
- `lib/knowledge-base/`
  知识库检索、上传资料入库、匹配逻辑。
- `lib/playback/`
  课堂播放引擎。
- `lib/action/`
  场景动作执行引擎。
- `lib/store/`
  Zustand 状态仓库，是前端行为的核心状态层。
- `lib/utils/`
  IndexedDB、图片存储、阶段存储、辅助函数等。
- `lib/prompts/`
  Prompt 模板与加载器。
- `lib/types/`
  跨层共享类型定义。

### 其他关键目录

- `packages/`
  内部 workspace 包。
  - `mathml2omml`：公式导出相关
  - `pptxgenjs`：PPT 导出相关
- `rag/`
  本地知识库资源和索引数据。
- `tests/`
  单元测试与服务测试。
- `e2e/`
  Playwright 端到端测试。
- `eval/`
  评估脚本与实验入口。
- `scripts/`
  辅助脚本，包括 i18n 检查、PDF 生成、爬虫脚本等。
- `configs/`
  图形、字体、主题、元素、热键等配置常量。

## 5. 三条最重要的业务链路

### A. 课程生成链路

入口：

- `app/page.tsx`
- `app/generation-preview/page.tsx`

服务端入口：

- `app/api/generate-classroom/route.ts`

核心逻辑：

- `lib/server/classroom-job-runner.ts`
- `lib/server/classroom-generation.ts`
- `lib/generation/outline-generator.ts`
- `lib/generation/scene-generator.ts`
- `lib/server/classroom-media-generation.ts`

大致流程：

1. 首页收集需求，必要时先解析 PDF 或知识库匹配。
2. 把生成 session 写入 `sessionStorage` 后跳转到 `generation-preview`。
3. `generation-preview` 发起 `/api/generate-classroom`。
4. API 先创建异步 job，再后台执行生成。
5. 服务端生成大纲、场景、媒体、TTS，并持久化课堂。
6. 前端轮询 job 状态，完成后进入 `classroom/[id]`。

### B. 课堂播放与课堂内 AI 互动链路

入口：

- `app/classroom/[id]/page.tsx`
- `components/stage.tsx`

核心模块：

- `lib/store/stage.ts`
- `lib/playback/engine.ts`
- `lib/action/engine.ts`
- `components/chat/`
- `components/roundtable/`

大致流程：

1. 读取 stage / scene / chats。
2. `Stage` 组件统一管理场景切换、播放状态、讨论状态、白板状态、聊天区状态。
3. `PlaybackEngine` 负责讲解播放节奏。
4. `ActionEngine` 负责动作执行。
5. ChatArea 负责发起对话与接收流式事件。

### C. Agent 聊天编排链路

服务端入口：

- `app/api/chat/route.ts`

核心模块：

- `lib/orchestration/stateless-generate.ts`
- `lib/orchestration/director-graph.ts`
- `lib/orchestration/prompt-builder.ts`
- `lib/orchestration/summarizers/`

特点：

- 这是一个无状态 SSE 聊天接口。
- 客户端把完整消息和当前 storeState 一次性传给后端。
- 后端用 director graph 决定下一个 agent、何时 cue user、何时结束。
- 结果以 SSE 增量事件流回前端。

## 6. 数据与状态怎么存

这个项目非常依赖本地存储，理解这一点很重要。

### 前端运行时状态

- 主要通过 Zustand 管理。
- 关键 store 在 `lib/store/`。
- 其中 `lib/store/stage.ts` 是课堂级核心 store。

### 本地持久化

- 通过 Dexie/IndexedDB 存。
- 入口定义在 `lib/utils/database.ts`。

重要表包括：

- `stages`
- `scenes`
- `chatSessions`
- `playbackStates`
- `stageOutlines`
- `mediaFiles`
- `generatedAgents`
- `bookshelf`
- `accessHistory`
- `wrongQuestions`

### 课堂数据持久化

- 前端本地版本：`lib/utils/stage-storage.ts`
- 服务端课堂持久化：`app/api/classroom/route.ts` + `lib/server/classroom-storage.ts`

理解方式可以简单记成：

- “编辑/播放中的即时状态”主要在 Zustand
- “本地恢复与缓存”主要在 IndexedDB
- “生成完成后可分享/可访问的课堂”走服务端 classroom storage

## 7. Provider 与配置体系

项目支持多类 Provider，可通过环境变量和设置面板共同配置：

- 语言模型：`lib/ai/` + `lib/server/resolve-model.ts`
- 图片生成：`lib/media/image-providers.ts`
- 视频生成：`lib/media/video-providers.ts`
- TTS / ASR：`lib/audio/`
- PDF 解析：`lib/pdf/`
- Web Search：`lib/web-search/`

对应 UI 在：

- `components/settings/`

对应服务端入口常见在：

- `app/api/verify-*`
- `app/api/server-providers/route.ts`

另外有一个简单访问保护：

- `middleware.ts`
- 当配置 `ACCESS_CODE` 时，会要求访问码 Cookie 才能正常访问 API。

## 8. 知识库 / RAG 体系

相关目录：

- `app/api/knowledge/*`
- `lib/knowledge-base/`
- `rag/`

核心能力：

- 搜索现有知识库文档
- 上传资料后做匹配
- 需要时把上传资料真正写入知识库
- 为知识库文档生成或补齐 PDF

注意：

- `rag/` 目录里既有 PDF 语料，也有索引和 JSON 数据。
- 这部分既像应用功能，也像项目资源库。

## 9. 渲染层复杂度最高的部分

如果后续 AI 要改 UI，最需要谨慎的是这三块：

- `components/stage.tsx`
  课堂总控，状态耦合很多。
- `components/slide-renderer/`
  幻灯片/画布系统，文件多且联动强。
- `lib/types/stage.ts`
  很多渲染、动作、播放、导出逻辑都依赖这里的类型结构。

通常一个小改动会跨越：

- `lib/types/*`
- `lib/store/*`
- `components/stage*` 或 `components/scene-renderers/*`
- 导出/播放/生成中的至少一层

## 10. 测试与验证

命令入口看 `package.json`：

- `pnpm dev`
- `pnpm build`
- `pnpm test`
- `pnpm test:e2e`
- `pnpm lint`

测试目录分工：

- `tests/`：单元测试、服务测试、配置测试
- `e2e/`：端到端主流程测试
- `eval/`：更偏评估和实验，不完全等同于回归测试

## 11. 新 AI 对话里的建议提问方式

如果以后开启新对话，建议一开始就让 AI 先读：

- `PROJECT_CONTEXT.md`
- `ARCHITECTURE.md`
- `package.json`

然后再告诉它你要改哪一类内容，例如：

- “先阅读 `PROJECT_CONTEXT.md`，我要改课程生成链路里的大纲生成逻辑”
- “先阅读 `PROJECT_CONTEXT.md`，我要排查课堂页播放状态异常”
- “先阅读 `PROJECT_CONTEXT.md`，我要调整知识库匹配和上传流程”

## 12. 对后续维护最重要的判断

- 这是一个单仓全栈 AI 应用，不是纯前端项目。
- 真正的业务骨架在 `lib/`，不是在 `app/api/`。
- 课堂页是最复杂的运行时区域，核心总控在 `components/stage.tsx`。
- 课程生成和课堂聊天是两套不同但有关联的 AI 链路。
- 本地 IndexedDB 持久化是产品体验的重要组成，不是边角功能。
- `lib/types/stage.ts`、`lib/store/stage.ts`、`components/stage.tsx` 可以视为课堂域的核心三件套。

## 13. 一句话总结给新 AI

把这个仓库理解成：
“一个用 Next.js 承载的 AI 互动课堂系统，前端靠 Zustand + IndexedDB 管课堂状态，服务端靠 `lib/server` 和 `lib/orchestration` 跑课程生成与 Agent 编排，渲染核心集中在 `Stage`、scene renderers 和 slide renderer。”
