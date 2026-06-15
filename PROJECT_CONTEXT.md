# LearnGenie 项目上下文文档

面向新 AI 会话 / 新接手的开发者。目标是用最短路径理解仓库的框架结构、核心链路、关键模块和阅读顺序。

## 1. 项目一句话说明

LearnGenie 是一个基于 Next.js App Router 的 AI 互动课堂应用。将"课程生成、课堂播放、Agent 聊天、多媒体生成、知识库检索、导入导出、本地持久化、用户认证、国际化、PBL 教学"放在同一个仓库，属于"单仓全栈 + 前端本地状态 + 服务端 AI 编排"的结构。

## 2. 技术栈与总体形态

- **框架**：Next.js 16.1.2 + React 19.2.3 + TypeScript 5
- **UI**：自定义组件 + Radix/Base UI + motion（framer-motion）+ Tailwind CSS v4（CSS-based 配置，`@theme inline` 在 `app/globals.css`）+ animate.css
- **状态管理**：Zustand（13+ stores，均使用 `zustand/middleware/persist`）
- **本地持久化**：Dexie / IndexedDB（数据库名 `MAIC-Database`，v14 版本，所有用户数据表含 `userId` 字段隔离）
- **主题**：next-themes（light / dark / system）
- **AI 能力**：Vercel AI SDK + LangGraph + LangChain + 多 Provider 适配 + thinking context（AsyncLocalStorage）
- **测试**：Vitest（单元） + Playwright（E2E）
- **国际化**：i18next + react-i18next（zh-CN / en-US / ja-JP / ru-RU / ar-SA，5 种语言动态加载）
- **认证**：bcryptjs + JWT（jose HS256）+ httpOnly Cookie 会话 + 文件型用户存储（`.data/users.json`）
- **包管理**：pnpm v10.28 + workspace monorepo
- **图表**：ECharts
- **富文本编辑**：ProseMirror
- **许可证**：AGPL-3.0
- **部署**：Docker + Vercel

不是前后端分离双仓库：

- `app/` — 页面路由 + API Route（同仓 BFF）
- `components/` — 前端交互与渲染
- `lib/` — 业务核心、生成流水线、AI 编排、存储、工具
- `packages/` — 内部 workspace 包

## 3. 架构分层

### 3.1 表现层（Frontend）

| 目录 | 职责 |
|------|------|
| `app/page.tsx` | Landing 首页与课程创建入口 |
| `app/generate/` | 课程生成入口页 |
| `app/generation-preview/` | 生成进度承接页 |
| `app/classroom/[id]/` | 课堂播放与互动页 |
| `app/bookshelf/` | 历史课堂管理 |
| `app/profile/` | 用户画像页 |
| `components/` | 全部 UI 组件（含 auth、chat、stage、slide-renderer 等） |

### 3.2 接口层（API / BFF）

对外提供统一 API（聊天、课堂生成、媒体生成、解析与校验），做请求参数校验与错误规范化，以 SSE/JSON 形式返回。

### 3.3 鉴权与请求保护层

- `middleware.ts`：JWT 认证（`auth_token` Cookie，jose HS256，7 天过期）+ 可选 ACCESS_CODE（HMAC 签名 Cookie）。保护 `/api/*`、`/generate`、`/profile`、`/bookshelf`、`/classroom`、`/generation-preview`、`/knowledge`、`/wrong-questions`

### 3.4 领域与编排层（Domain / Orchestration）

多智能体流程编排、教学场景生成、对话状态推进、工具调用与结果拼装、模型 Provider 统一适配。

### 3.5 数据与存储层

浏览器侧持久化（课堂、配置、缓存等）+ 媒体文件管理 + 导入导出。

### 3.6 内部包层（Workspace Packages）

- `packages/mathml2omml`：MathML → OMML 公式转换
- `packages/pptxgenjs`：PPTX 导出 SDK

## 4. 先读什么

推荐阅读顺序：

1. 本文档 (`PROJECT_CONTEXT.md`)
2. `README.md`
3. `package.json`
4. `app/layout.tsx` — Provider 层级（ThemeProvider → I18nProvider → ServerProvidersInit → AuthProvider → Toaster）
5. `app/page.tsx` — 首页入口
6. `middleware.ts` — 认证守卫
7. `app/api/generate-classroom/route.ts` + `lib/server/classroom-job-runner.ts` — 课程生成入口
8. `app/api/chat/route.ts` + `lib/orchestration/` — 聊天编排
9. `components/stage.tsx` + `lib/store/stage.ts` — 课堂核心
10. `.env.example` — 所有环境变量

### 快速定位问题

| 问题域 | 关键文件 |
|--------|----------|
| 课程生成 | `lib/generation/`、`lib/server/classroom-job-runner.ts` |
| 课堂播放/交互 | `components/stage.tsx`、`lib/playback/`、`lib/action/` |
| Agent 聊天 | `app/api/chat/route.ts`、`lib/orchestration/`、`components/chat/` |
| 知识库/RAG | `app/api/knowledge/*`、`lib/knowledge-base/`、`lib/rag/`、`rag/` |
| 本地数据 | `lib/utils/database.ts`、`lib/utils/stage-storage.ts`、`lib/store/` |
| 认证/登录 | `app/login/`、`app/api/auth/`、`lib/store/auth.ts`、`lib/server/auth-utils.ts` |
| 用户画像 | `app/profile/`、`lib/store/user-profile.ts`、`lib/profile/` |
| 错题本 | `app/wrong-questions/`、`lib/utils/wrong-questions-storage.ts` |
| 国际化 | `lib/i18n/`、`components/language-switcher.tsx` |
| 导出 | `lib/export/`、`packages/pptxgenjs/` |

## 5. 目录与文件详解

### 5.1 根目录配置文件

| 文件 | 说明 |
|------|------|
| `package.json` | 项目元数据。scripts: `dev`、`build`、`start`、`test`（vitest）、`test:e2e`（playwright）、`lint`、`format`、`rag:build-index`、`eval:whiteboard`、`eval:outline-language` |
| `pnpm-workspace.yaml` | workspace 声明：`packages/*` |
| `next.config.ts` | standalone 输出模式、`mathml2omml`/`pptxgenjs` transpile、200mb body limit、CSP frame-ancestors |
| `tsconfig.json` | ES2017、strict、bundler 解析、path alias `@/*` |
| `eslint.config.mjs` | `eslint-config-next` + typescript、`no-img-element` off、underscore 前缀 unused-var 允许 |
| `postcss.config.mjs` | Tailwind CSS v4 PostCSS 插件 |
| `vitest.config.ts` | 模式 `tests/**/*.test.ts`、setup `tests/setup-env.ts`、alias `@/` |
| `playwright.config.ts` | E2E 目录 `e2e/tests/`、chromium、localhost:3002 |
| `middleware.ts` | 双重认证：JWT + 可选 ACCESS_CODE |
| `Dockerfile` | 多阶段构建：node:22-alpine → deps → builder → runner，端口 3000 |
| `docker-compose.yml` | 单服务 openmaic、env 从 .env.local、持久化卷 |
| `vercel.json` | Next.js framework、pnpm install、API 300s maxDuration |
| `.env.example` | 所有支持的 LLM/TTS/ASR/PDF/Image/Video/WebSearch/Embedding/Proxy/Access 环境变量 |
| `.nvmrc` | Node 22 |
| `.prettierrc` | printWidth 100、singleQuote、trailingComma all、lf |

### 5.2 `app/` — 页面路由与 API

#### 页面

| 文件 | 路由 | 说明 |
|------|------|------|
| `app/layout.tsx` | / | 根布局：字体加载（Inter、Geist）+ globals.css + animate.css + katex.css；Provider 链：ThemeProvider → I18nProvider → ServerProvidersInit → AuthProvider → Toaster |
| `app/page.tsx` | / | Landing 首页：Navbar、Hero、Features、HowItWorks、ProductPreview、UseCases、FAQ、Footer |
| `app/login/page.tsx` | /login | 登录页：左侧 character-animation SVG 动画 + 右侧 login-form |
| `app/register/page.tsx` | /register | 注册页：同上布局、含昵称/邮箱/密码/确认密码 |
| `app/generate/page.tsx` | /generate | 课程生成入口（auth 保护）：prompt 输入、PDF 上传、知识库匹配 |
| `app/generation-preview/page.tsx` | /generation-preview | 生成进度页（auth 保护）：解析 session、执行生成链路、轮询 job |
| `app/classroom/[id]/page.tsx` | /classroom/[id] | 课堂播放页（auth 保护）：加载 stage/scenes、Stage 组件 |
| `app/bookshelf/page.tsx` | /bookshelf | 历史课堂（auth 保护）：分类收藏、错题卡片 |
| `app/wrong-questions/page.tsx` | /wrong-questions | 错题本（auth 保护） |
| `app/knowledge/page.tsx` | /knowledge | 知识库文档列表（auth 保护） |
| `app/knowledge/[docId]/page.tsx` | /knowledge/[docId] | 知识库文档查看（auth 保护） |
| `app/profile/page.tsx` | /profile | 用户画像页（auth 保护）：8 维度雷达图、学习总结 |
| `app/eval/whiteboard/page.tsx` | /eval/whiteboard | 白板评估实验页 |

#### API 路由

**认证 (`app/api/auth/`)**

| 文件 | 方法 | 说明 |
|------|------|------|
| `auth/login/route.ts` | POST | 邮箱+密码登录，返回 JWT（httpOnly Cookie + JSON body） |
| `auth/register/route.ts` | POST | 邮箱+密码+昵称注册，bcrypt 哈希密码 |
| `auth/logout/route.ts` | POST | 登出，清除 Cookie |
| `auth/me/route.ts` | GET | 获取当前用户（从 JWT 解析） |
| `auth/avatar/route.ts` | POST | 更新头像 |

**课程生成 (`app/api/generate-classroom/` `app/api/generate/`)**

| 文件 | 说明 |
|------|------|
| `generate-classroom/route.ts` | 异步生成 job 创建入口 |
| `generate-classroom/[jobId]/route.ts` | Job 状态轮询 |
| `generate/scene-outlines-stream/route.ts` | 大纲流式生成（SSE） |
| `generate/scene-content/route.ts` | 场景内容生成 |
| `generate/scene-actions/route.ts` | 场景动作/讲稿生成 |
| `generate/agent-profiles/route.ts` | Agent 形象生成 |
| `generate/image/route.ts` | 图片生成 |
| `generate/video/route.ts` | 视频生成 |
| `generate/tts/route.ts` | TTS 音频生成 |

**课堂存储 (`app/api/classroom/` `app/api/classroom-media/`)**

| 文件 | 说明 |
|------|------|
| `classroom/route.ts` | 课堂 CRUD |
| `classroom-media/[classroomId]/[...path]/route.ts` | 服务端课堂媒体文件访问 |

**知识库 (`app/api/knowledge/`)**

| 文件 | 说明 |
|------|------|
| `knowledge/search/route.ts` | 知识库搜索 |
| `knowledge/match-upload/route.ts` | 上传资料匹配 |
| `knowledge/ingest/route.ts` | 文档入库 |
| `knowledge/document/[docId]/route.ts` | 文档 CRUD |
| `knowledge/document/[docId]/meta/route.ts` | 文档元数据 |

**Agent (`app/api/agent/`)**

| 文件 | 说明 |
|------|------|
| `agent/session-plan/route.ts` | Agent 会话规划 |
| `agent/profile/route.ts` | Agent 画像抽取 |
| `agent/evaluate/route.ts` | Agent 评估 |
| `agent/resource-bundle/route.ts` | Agent 资源包生成 |

**其他 API**

| 文件 | 说明 |
|------|------|
| `chat/route.ts` | Agent 聊天（无状态 SSE 流） |
| `pbl/chat/route.ts` | PBL 聊天 SSE |
| `profile/extract/route.ts` | 用户画像抽取 |
| `parse-pdf/route.ts` | PDF 解析 |
| `web-search/route.ts` | Web Search（Tavily） |
| `quiz-grade/route.ts` | 测验批改 |
| `transcription/route.ts` | ASR 转录 |
| `proxy-media/route.ts` | 媒体代理（SSRF 防护 + 超时） |
| `verify-model/route.ts` | LLM 模型验证 |
| `verify-image-provider/route.ts` | 图片 Provider 验证 |
| `verify-video-provider/route.ts` | 视频 Provider 验证 |
| `verify-pdf-provider/route.ts` | PDF Provider 验证 |
| `server-providers/route.ts` | 服务端环境变量配置的 Provider 列表 |
| `access-code/status/route.ts` | 访问码状态检查 |
| `access-code/verify/route.ts` | 访问码验证 |
| `azure-voices/route.ts` | Azure TTS 声音列表 |
| `health/route.ts` | 健康检查 |

### 5.3 `components/` — 前端组件

#### 根级独立组件

| 文件 | 说明 |
|------|------|
| `stage.tsx` | **课堂总容器**。管理场景切换、播放状态、讨论状态、白板状态、聊天区状态。状态耦合最多的组件 |
| `header.tsx` | 全局顶部导航栏：返回、语言切换、主题、设置、导出（PPTX/资源包/ZIP） |
| `language-switcher.tsx` | 语言切换按钮，调用 i18next |
| `user-profile.tsx` | 用户画像弹窗卡片 |
| `access-code-guard.tsx` | 访问码守卫组件 |
| `access-code-modal.tsx` | 访问码输入弹窗 |
| `server-providers-init.tsx` | 挂载时 fetchServerProviders、副作用组件 |

#### `components/auth/`

| 文件 | 说明 |
|------|------|
| `auth-provider.tsx` | 认证状态 Provider：挂载时调用 `fetchUser()` 恢复会话，切换账号时重置画像 |
| `login-form.tsx` | 邮箱/密码登录表单 |
| `register-form.tsx` | 昵称/邮箱/密码/确认密码注册表单 |
| `protected-route.tsx` | 客户端路由守卫，未认证重定向 `/login` |
| `auth-decoration.tsx` | SVG 浮动书本装饰动画 |
| `character-animation.tsx` | SVG 角色多状态动画（confused → tablet → inspiration → enlightened） |

#### `components/home/`

| 文件 | 说明 |
|------|------|
| `home-hero.tsx` | 首页课程需求输入区 |
| `home-prompt-bar.tsx` | Prompt 输入栏：文本输入、PDF 上传、知识库匹配、GenerationToolbar |
| `home-top-bar.tsx` | 生成页顶部栏 |
| `home-classroom-showcase.tsx` | 课堂展示区 |

#### `components/landing/`

| 文件 | 说明 |
|------|------|
| `landing-navbar.tsx` | Landing 导航栏 |
| `landing-hero.tsx` | 首页 Hero 区 |
| `landing-features.tsx` | 功能特性展示 |
| `landing-how-it-works.tsx` | 使用流程 |
| `landing-product-preview.tsx` | 产品预览 |
| `landing-use-cases.tsx` | 使用场景 |
| `landing-faq.tsx` | FAQ 折叠面板 |
| `landing-footer.tsx` | 页脚 |
| `floating-elements.tsx` | 浮动装饰元素 |
| `image-carousel.tsx` | 首页图片轮播 |

#### `components/chat/`

| 文件 | 说明 |
|------|------|
| `chat-area.tsx` | 聊天区主组件：Notes/Lecture 分 tab，派生讲稿笔记 |
| `chat-session.tsx` | 聊天会话 UI |
| `session-list.tsx` | 会话列表侧边栏 |
| `use-chat-sessions.ts` | 聊天会话 Hook |
| `lecture-notes-view.tsx` | 右侧讲稿笔记视图 |
| `inline-action-tag.tsx` | 内联动作标签（spotlight/laser 等） |
| `proactive-card.tsx` | 主动建议卡片 |

#### `components/stage/`

| 文件 | 说明 |
|------|------|
| `scene-renderer.tsx` | 根据场景类型（slide/quiz/interactive/pbl）路由到对应渲染器 |
| `scene-sidebar.tsx` | 场景导航侧边栏 |

#### `components/scene-renderers/`

| 文件 | 说明 |
|------|------|
| `quiz-renderer.tsx` | 测验场景渲染器 |
| `interactive-renderer.tsx` | 交互式 iframe/Widget 渲染器 |
| `pbl-renderer.tsx` | PBL 场景主渲染器 |
| `pbl/chat-panel.tsx` | PBL 聊天面板 |
| `pbl/guide.tsx` | PBL 引导组件 |
| `pbl/issueboard-panel.tsx` | PBL 问题面板 |
| `pbl/workspace.tsx` | PBL 工作区 |
| `pbl/role-selection.tsx` | PBL 角色选择 |
| `pbl/use-pbl-chat.ts` | PBL 聊天 Hook |

#### `components/slide-renderer/` — 幻灯片/画布渲染编辑体系

**Editor（顶层）**

| 文件 | 说明 |
|------|------|
| `Editor/index.tsx` | 编辑器主入口 |
| `Editor/ScreenCanvas.tsx` | 屏幕画布容器 |
| `Editor/ScreenElement.tsx` | 屏幕元素渲染 |
| `Editor/ZoomWrapper.tsx` | 缩放包裹器 |
| `Editor/LaserOverlay.tsx` | 激光笔覆盖层 |
| `Editor/SpotlightOverlay.tsx` | 聚光灯覆盖层 |
| `Editor/HighlightOverlay.tsx` | 高亮覆盖层 |

**Editor/Canvas/**

| 文件 | 说明 |
|------|------|
| `Canvas/index.tsx` | 画布主组件 |
| `Canvas/EditableElement.tsx` | 可编辑元素容器 |
| `Canvas/AlignmentLine.tsx` | 对齐辅助线 |
| `Canvas/GridLines.tsx` | 网格线 |
| `Canvas/Ruler.tsx` | 标尺 |
| `Canvas/MouseSelection.tsx` | 鼠标框选 |
| `Canvas/ElementCreateSelection.tsx` | 元素创建选区 |
| `Canvas/ShapeCreateCanvas.tsx` | 形状绘制画布 |
| `Canvas/ViewportBackground.tsx` | 视口背景 |
| `Canvas/Operate/index.tsx` | 操作层入口 |
| `Canvas/Operate/BorderLine.tsx` | 选中边框 |
| `Canvas/Operate/CommonElementOperate.tsx` | 通用操作（移动/缩放/旋转） |
| `Canvas/Operate/TextElementOperate.tsx` | 文本元素操作 |
| `Canvas/Operate/ImageElementOperate.tsx` | 图片元素操作 |
| `Canvas/Operate/ShapeElementOperate.tsx` | 形状元素操作 |
| `Canvas/Operate/LineElementOperate.tsx` | 线条元素操作 |
| `Canvas/Operate/TableElementOperate.tsx` | 表格元素操作 |
| `Canvas/Operate/MultiSelectOperate.tsx` | 多选操作 |
| `Canvas/Operate/ResizeHandler.tsx` | 缩放拖拽手柄 |
| `Canvas/Operate/RotateHandler.tsx` | 旋转拖拽手柄 |
| `Canvas/hooks/` | useDragElement、useRotateElement、useScaleElement、useSelectElement、useMouseSelection、useDrop、useViewportSize、useCommonOperate、useDragLineElement、useInsertFromCreateSelection、useMoveShapeKeypoint |

**Element 类型**

| 子目录 | 说明 |
|--------|------|
| `TextElement/` | 文本元素（BaseTextElement + index） |
| `ImageElement/` | 图片元素（BaseImageElement + ImageClipHandler + useClipImage + useFilter + ImageOutline） |
| `ShapeElement/` | 形状元素（BaseShapeElement + GradientDefs + PatternDefs） |
| `LineElement/` | 线条元素（BaseLineElement + LinePointMarker） |
| `TableElement/` | 表格元素（BaseTableElement + StaticTable + tableUtils） |
| `ChartElement/` | 图表元素（BaseChartElement + Chart + chartOption）——基于 ECharts |
| `CodeElement/` | 代码元素（BaseCodeElement） |
| `LatexElement/` | LaTeX 公式元素（BaseLatexElement） |
| `VideoElement/` | 视频元素（BaseVideoElement） |
| `ProsemirrorEditor.tsx` | ProseMirror 富文本编辑器 |
| `ElementOutline.tsx` | 元素边框 |
| `hooks/` | useElementFill、useElementFlip、useElementOutline、useElementShadow |

**其他**

| 文件 | 说明 |
|------|------|
| `ThumbnailSlide/index.tsx` | 幻灯片缩略图 |
| `ThumbnailInteractive/index.tsx` | 交互式场景缩略图 |

#### `components/ai-elements/`

AI 交互通用 UI 元素：`artifact`、`canvas`、`chain-of-thought`、`checkpoint`、`code-block`、`confirmation`、`connection`、`context`、`controls`、`conversation`、`edge`、`image`、`inline-citation`、`loader`、`message`、`model-selector`、`node`、`open-in-chat`、`panel`、`plan`、`prompt-input`、`queue`、`reasoning`、`shimmer`、`sources`、`suggestion`、`task`、`tool`、`toolbar`、`web-preview`

#### `components/ui/` — 基础 UI 组件库（shadcn/ui 风格）

`alert-dialog`、`alert`、`avatar`、`avatar-display`、`badge`、`button`、`button-group`、`card`、`carousel`、`checkbox`、`collapsible`、`combobox`、`command`、`context-menu`、`dialog`、`dropdown-menu`、`field`、`hover-card`、`input`、`input-group`、`label`、`popover`、`progress`、`scroll-area`、`select`、`separator`、`slider`、`sonner`、`switch`、`tabs`、`textarea`、`tooltip`

#### `components/settings/` — 设置面板

当前 `index.tsx` 仅含**账户**（头像更换/昵称/退出登录）和**系统**（清除缓存）两个 tab。其余子组件（agent-settings、image-settings、video-settings、tts-settings、asr-settings、pdf-settings、web-search-settings、provider-config-panel、provider-list、model-edit-dialog、add-provider-dialog、add-audio-provider-dialog 等）为历史保留，但已不在 UI 中使用。

#### 其他组件目录

| 目录 | 说明 |
|------|------|
| `agent/` | Agent 头像、配置面板、揭秘弹窗 |
| `audio/` | 语音按钮（speech-button）、TTS 配置弹窗 |
| `bookshelf/` | 书架卡片（bookshelf-card）、分类 tabs、错题卡片、错题内容 |
| `canvas/` | 画布工具栏 |
| `document-preview/` | 文档预览（doc-parser、pptx-preview） |
| `generation/` | 生成进度条、大纲编辑器 |
| `knowledge/` | 知识库文档查看器、管理面板、搜索结果 |
| `profile/` | 用户画像图表（雷达图） |
| `roundtable/` | 圆桌讨论：音频指示器、讲稿覆盖层、常量 |
| `sidebar/` | 全局侧边栏导航 |
| `whiteboard/` | 白板画布（whiteboard-canvas）、白板历史 |

### 5.4 `lib/` — 业务核心

#### `lib/action/`

| 文件 | 说明 |
|------|------|
| `engine.ts` | 场景动作执行引擎（speech、spotlight、laser、play_video、highlight 等）|

#### `lib/agents/` — 多 Agent 协作系统

| 文件 | 说明 |
|------|------|
| `types.ts` | Agent 工作流阶段定义 |
| `orchestrator.ts` | 主协调器：按 6 阶段流水线调度各 agent |
| `profile-agent.ts` | 学习者画像 Agent |
| `retrieval-agent.ts` | 知识检索 Agent |
| `path-planning-agent.ts` | 学习路径规划 Agent |
| `resource-agents.ts` | 资源生成 Agent |
| `review-agent.ts` | 审阅 Agent |
| `evaluation-agent.ts` | 评估 Agent |

工作流阶段：**profile → retrieval → planning → resource-generation → review → evaluation**

#### `lib/ai/`

| 文件 | 说明 |
|------|------|
| `thinking-context.ts` | AsyncLocalStorage 传递推理参数，支持 OpenAI-compatible provider |

Provider 定义（12 个）：OpenAI / Anthropic / Google / GLM / Qwen / DeepSeek / Kimi / MiniMax / SiliconFlow / Doubao / Grok / Ollama

#### `lib/api/` — Stage API 封装层

| 文件 | 说明 |
|------|------|
| `stage-api.ts` | 主 API |
| `stage-api-canvas.ts` | 画布操作 |
| `stage-api-element.ts` | 元素操作 |
| `stage-api-mode.ts` | 模式操作 |
| `stage-api-navigation.ts` | 导航操作 |
| `stage-api-scene.ts` | 场景操作 |
| `stage-api-whiteboard.ts` | 白板操作 |
| `stage-api-defaults.ts` | 默认值 |
| `stage-api-types.ts` | 类型 |

#### `lib/audio/` — TTS / ASR 适配

| 文件 | 说明 |
|------|------|
| `tts-providers.ts` | TTS Provider 注册：OpenAI / Azure / GLM / Qwen / Doubao / ElevenLabs / MiniMax / Browser Native |
| `asr-providers.ts` | ASR Provider 注册：OpenAI Whisper / Browser Native / Qwen |
| `voice-resolver.ts` | Voice 解析逻辑 |
| `tts-utils.ts` | TTS 工具函数 |
| `use-tts-preview.ts` | TTS 预览 Hook |
| `browser-tts-preview.ts` | 浏览器 TTS 预览 |
| `azure.json` | Azure TTS 配置数据 |

#### `lib/buffer/`

| 文件 | 说明 |
|------|------|
| `stream-buffer.ts` | 统一流缓冲节奏层。含字符级打字机效果、动作延迟、TTS 保持、flush、pause/resume、drain promise |

#### `lib/generation/` — 课程生成流水线

| 文件 | 说明 |
|------|------|
| `generation-pipeline.ts` | 主生成 pipeline |
| `pipeline-runner.ts` | Pipeline 执行器（多阶段并行生成） |
| `pipeline-types.ts` | Pipeline 类型定义 |
| `prompt-formatters.ts` | Prompt 格式化工具（buildLanguageText、formatTeacherPersona、formatElementsForPrompt 等） |

#### `lib/export/` — 导出功能

| 文件 | 说明 |
|------|------|
| `use-export-pptx.ts` | PPTX 导出 Hook |
| `use-export-classroom.ts` | 课堂 ZIP 导出 Hook |
| `classroom-zip-types.ts` | ZIP 导出类型 |
| `classroom-zip-utils.ts` | ZIP 导出工具 |
| `html-parser/` | 自定义 HTML 解析器（lexer → parser → stringify，用于 PPTX 导出） |
| `latex-to-omml.ts` | LaTeX → OMML 公式转换 |
| `svg2base64.ts` | SVG → Base64 |
| `svg-arc-to-cubic-bezier.d.ts` | SVG 弧线转贝塞尔曲线类型声明 |

#### `lib/knowledge-base/` — 知识库核心

| 文件 | 说明 |
|------|------|
| `service.ts` | 知识库服务主入口 |
| `concept-terms.ts` | 概念术语提取 |
| `tokenize.ts` | 分词 |
| `pdf.ts` | PDF 处理 |
| `pdf-crawler.ts` | PDF 爬虫 |
| `constants.ts` | 知识库常量 |
| `types.ts` | 知识库类型 |

#### `lib/media/` — 图片/视频生成

| 文件 | 说明 |
|------|------|
| `image-providers.ts` | 图片 Provider 注册（seedream / qwen-image / nano-banana / minimax-image / grok-image） |
| `video-providers.ts` | 视频 Provider 注册（seedance / kling / veo / sora / minimax-video / grok-video） |
| `types.ts` | 媒体类型定义 |
| `adapters/` | 各 Provider 适配器：grok-image、grok-video、kling、minimax-image、minimax-video、nano-banana、qwen-image、seedance、seedream、veo |

#### `lib/orchestration/` — Agent 编排层

| 文件 | 说明 |
|------|------|
| `ai-sdk-adapter.ts` | AI SDK 与 LangGraph 适配层 |
| `tool-schemas.ts` | 工具 Schema 定义 |
| `types.ts` | 编排类型 |
| `registry/types.ts` | Agent 注册表类型 |
| `summarizers/conversation-summary.ts` | 对话总结 |
| `summarizers/message-converter.ts` | 消息转换 |
| `summarizers/peer-context.ts` | Peers 上下文构建 |
| `summarizers/whiteboard-ledger.ts` | 白板记账本 |

#### `lib/pbl/` — PBL 教学系统

| 文件 | 说明 |
|------|------|
| `generate-pbl.ts` | PBL 异步 pipeline 生成主逻辑 |
| `pbl-system-prompt.ts` | PBL 系统提示词 |
| `types.ts` | PBL 类型 |
| `mcp/agent-mcp.ts` | MCP Agent 工具 |
| `mcp/issueboard-mcp.ts` | MCP IssueBoard 工具 |
| `mcp/mode-mcp.ts` | MCP Mode 工具 |
| `mcp/project-mcp.ts` | MCP Project 工具 |
| `mcp/agent-templates.ts` | Agent 角色模板 |

#### `lib/pdf/` — PDF 解析

| 文件 | 说明 |
|------|------|
| `pdf-providers.ts` | PDF Provider 注册（unpdf / mineru / mineru-cloud） |
| `mineru-parser.ts` | MinerU 解析器 |
| `mineru-cloud.ts` | MinerU Cloud API |
| `constants.ts` | PDF Provider 常量 |
| `types.ts` | PDF 类型 |

#### `lib/playback/` — 课堂播放引擎

| 文件 | 说明 |
|------|------|
| `index.ts` | PlaybackEngine：节奏控制、场景推进 |
| `derived-state.ts` | 派生状态计算 |
| `types.ts` | 播放类型 |

#### `lib/rag/` — RAG 系统

| 文件 | 说明 |
|------|------|
| `indexer.ts` | 向量索引构建 |
| `retriever.ts` | 检索器 |
| `smart-retriever.ts` | 智能检索器（混合策略） |
| `embedding/providers.ts` | Embedding Provider（OpenAI / SiliconFlow / Ollama / DashScope / Jina / 自定义） |
| `embedding/client.ts` | Embedding 客户端 |
| `embedding/types.ts` | Embedding 类型 |
| `embedding/validation.ts` | Embedding 验证 |
| `embedding/adapters/base.ts` | Adapter 基类 |
| `embedding/adapters/openai-compat.ts` | OpenAI 兼容 adapter |
| `vector-store/local-store.ts` | 本地向量存储（JSON 文件） |
| `vector-store/types.ts` | 向量存储类型 |

#### `lib/server/` — 服务端业务编排

| 文件 | 说明 |
|------|------|
| `auth-utils.ts` | JWT 创建与验证（jose HS256）、bcrypt 密码哈希 |
| `user-store.ts` | 文件型用户存储，读写 `.data/users.json` |
| `classroom-generation.ts` | 课堂生成输入类型与编排 |
| `classroom-job-runner.ts` | 后台 job 执行器（Next.js `after()`） |
| `classroom-job-store.ts` | In-memory job 存储 |
| `classroom-storage.ts` | 服务端课堂持久化 |
| `classroom-media-generation.ts` | 异步媒体生成（图片/视频/TTS） |
| `resolve-model.ts` | 从环境变量解析模型配置 |
| `provider-config.ts` | 服务端 Provider 配置 |
| `api-response.ts` | 标准化 API 响应工具 |
| `proxy-fetch.ts` | 代理请求（带超时和错误处理） |
| `ssrf-guard.ts` | SSRF 防护 |
| `search-query-builder.ts` | Web Search 查询构建 |

#### `lib/store/` — Zustand 状态管理

| 文件 | 持久化方式 | 说明 |
|------|-----------|------|
| `stage.ts` | IndexedDB | 课堂级核心 store：stage/scenes/mode/outlines/generation |
| `auth.ts` | localStorage | 认证态：token/user/login/register/logout/fetchUser |
| `settings.ts` | localStorage | 全局设置：LLM/TTS/ASR/PDF/Image/Video/WebSearch/Embedding Provider 配置、布局偏好 |
| `ui.ts` | 内存 | UI 状态：设置弹窗开关 |
| `user-profile.ts` | localStorage（per-user） | 用户画像：8 维度雷达图、昵称、头像、学习总结 |
| `canvas.ts` | 内存 | 画布/幻灯片编辑状态 |
| `snapshot.ts` | IndexedDB | 撤销/重做快照 |
| `media-generation.ts` | 内存 | 媒体生成任务追踪 |
| `bookshelf-favorites.ts` | IndexedDB | 书架收藏 |
| `keyboard.ts` | 内存 | 键盘快捷键 |
| `whiteboard-history.ts` | 内存 | 白板历史 |
| `widget-iframe.ts` | 内存 | Widget iframe 状态 |
| `settings-validation.ts` | — | 纯函数：设置验证工具 |

所有 store 使用 `zustand/middleware/persist`。

#### `lib/types/` — 跨层共享类型

| 文件 | 说明 |
|------|------|
| `stage.ts` | Stage、Scene、SceneContent（Slide/Quiz/Interactive/PBL）、QuizQuestion |
| `generation.ts` | UserRequirements、SceneOutline、GenerationSession、PdfImage |
| `chat.ts` | ChatSession、DirectorState 聊天类型 |
| `action.ts` | Action 类型（speech、spotlight、laser、highlight 等） |
| `slides.ts` | PPTElement、Slide、SlideTheme、Element 类型 |
| `settings.ts` | SettingsSection、ProviderSettings、EditingModel |
| `provider.ts` | ProviderId、ProviderConfig、ModelInfo、ModelConfig、ThinkingConfig |
| `student-profile.ts` | 8 维度学习画像类型 |
| `widgets.ts` | Widget 类型与配置 |
| `export.ts` | 导出类型 |
| `edit.ts` | 编辑操作类型 |
| `roundtable.ts` | 圆桌讨论类型 |
| `web-search.ts` | Web Search 类型 |
| `pdf.ts` | PDF 类型 |

#### `lib/utils/` — 工具函数与存储

| 文件 | 说明 |
|------|------|
| `database.ts` | **Dexie 数据库入口**：`MAIC-Database` v14，14 张表（stages、scenes、audioFiles、imageFiles、snapshots、chatSessions、playbackState、stageOutlines、mediaFiles、generatedAgents、bookshelf、categories、accessHistory、wrongQuestions） |
| `stage-storage.ts` | 课堂 Scope 数据 IndexedDB CRUD |
| `chat-storage.ts` | 聊天会话 IndexedDB CRUD |
| `playback-storage.ts` | 播放状态 IndexedDB CRUD |
| `image-storage.ts` | 图片数据 IndexedDB CRUD |
| `access-history.ts` | 访问历史 IndexedDB CRUD |
| `wrong-questions-storage.ts` | 错题数据 IndexedDB CRUD |
| `slide-thumbnail.ts` | 幻灯片缩略图生成 |
| `model-config.ts` | 获取当前模型配置 |
| `user-context.ts` | 用户上下文构建 |
| `cn.ts` | className 拼接工具 |
| `create-selectors.ts` | Zustand selector 工厂 |
| `geometry.ts` | 几何计算 |
| `element.ts` / `element-fingerprint.ts` | 元素操作、指纹 |
| `emitter.ts` | 事件发射器 |
| `iframe.ts` | iframe 工具 |
| `audio-player.ts` | 音频播放管理 |

#### 其他 `lib/` 目录

| 目录/文件 | 说明 |
|-----------|------|
| `chat/action-translations.ts` | 聊天动作翻译 |
| `classroom/complete-summary.ts` | 课堂完成总结 |
| `constants/agent-defaults.ts` | Agent 默认值 |
| `constants/generation.ts` | 生成常量 |
| `contexts/media-stage-context.tsx` | 媒体生成阶段 React Context |
| `contexts/scene-context.tsx` | 场景 React Context |
| `document-preview/doc-parser.ts` | 文档解析 |
| `document-preview/pptx-parser.ts` | PPTX 解析 |
| `hooks/use-audio-recorder.ts` | 音频录制 Hook |
| `hooks/use-browser-asr.ts` | 浏览器 ASR Hook |
| `hooks/use-browser-tts.ts` | 浏览器 TTS Hook |
| `hooks/use-canvas-operations.ts` | 画布操作 Hook |
| `hooks/use-discussion-tts.ts` | 讨论 TTS Hook |
| `hooks/use-history-snapshot.ts` | 历史快照 Hook |
| `hooks/use-i18n.tsx` | i18n Provider + Hook |
| `hooks/use-order-element.ts` | 元素排序 Hook |
| `hooks/use-slide-background-style.ts` | 幻灯片背景样式 Hook |
| `hooks/use-streaming-text.ts` | 流式文本渲染 Hook |
| `hooks/use-theme.tsx` | 主题（light/dark/system）Hook + Provider |
| `i18n/config.ts` | i18next 配置 |
| `i18n/locales.ts` | 支持的语言列表和默认 locale |
| `i18n/types.ts` | i18n 类型 |
| `i18n/locales/` | 7 种语言文件（zh-CN / zh-TW / en-US / ja-JP / ru-RU / ar-SA / pt-BR） |
| `import/use-import-classroom.ts` | 课堂导入 Hook |
| `logger.ts` | 日志工具 |
| `profile/auto-refresh.ts` | 用户画像自动刷新 |
| `profile/markdown-sync.ts` | 画像 Markdown 同步 |
| `prompts/index.ts` | Prompt ID 常量 |
| `prompts/loader.ts` | Prompt 模板加载与变量插值 |
| `prompts/types.ts` | Prompt 类型 |
| `prompts/snippets/` | Prompt 片段（action-types、element-types、image-instructions、json-output-rules、media-safety-guidelines、speech-guidelines、whiteboard-reference 等 11 个） |
| `prompts/templates/` | Prompt 模板（requirements-to-outlines、slide-content、slide-actions、quiz-content、quiz-actions、interactive-outlines、interactive-actions、code-content、diagram-content、game-content、simulation-content、visualization3d-content、widget-teacher-actions、pbl-design、pbl-actions、director、agent-system、web-search-query-rewrite——共 19 套，每套含 system.md + user.md） |
| `prosemirror/` | ProseMirror 编辑器配置：schema（marks、nodes）、plugins（inputrules、keymap、placeholder）、commands（replaceText、setListStyle、setTextAlign、setTextIndent、toggleList） |
| `quiz/grading.ts` | 测验自动批改 |
| `quiz/persistence.ts` | 测验结果持久化 |
| `storage/index.ts` + `types.ts` | 存储 Provider 抽象层 |
| `web-search/` | Web Search Provider 适配（tavily、baidu、bocha、brave）+ 格式化 + 工具函数 |

### 5.5 其他目录

#### `packages/` — Workspace 内部包

| 目录 | 说明 |
|------|------|
| `packages/mathml2omml/` | MathML → OMML 公式转换（~25 个源文件），用于 PPTX 导出时数学公式渲染 |
| `packages/pptxgenjs/` | PPTX 生成 SDK fork（~10 个源文件），含图表/媒体/表格/XML 生成 |

#### `public/` — 静态资源

| 路径 | 内容 |
|------|------|
| `public/avatars/` | 31 个头像文件（SVG + PNG）：assist、builder、coder、creative、curious、dreamer、explorer、learner、reader、scholar、student1-3、teacher、thinker、user、clown 等 |
| `public/logos/` | 27 个 Provider Logo：azure、baidu、bailian、bocha、brave、browser、claude、deepseek、doubao、elevenlabs、gemini、glm、grok、hunyuan、kimi、kling、lemonade、mineru、minimax、ollama、openai、openrouter、qwen、siliconflow、tavily、unpdf、xiaomi、voxcpm |
| `public/logo-horizontal.png` | 应用 Logo |
| `public/character.png` | 角色图 |
| `public/carousel/` | 首页轮播截图（4 张） |

#### `rag/` — 本地知识库资源

| 路径 | 说明 |
|------|------|
| `rag/build-index.ts` | 索引构建脚本 |
| `rag/retriever.ts` | 检索器 |
| `rag/index/` | 向量索引（index.json + metadata.json） |
| `rag/pdfs/` | PDF 语料（~30 个文件，含 HuggingFace 文档 + AI 课程 PDF） |
| `rag/知识库知识/核心知识/` | 中文知识文档 |
| `rag/知识库知识/重点能力/` | 中文知识文档 |
| `rag/知识库知识/实战专题/` | 中文知识文档 |
| `rag/*.json` | 知识库数据文件 |

#### `configs/` — 配置常量

| 文件 | 说明 |
|------|------|
| `animation.ts` | 动画配置 |
| `chart.ts` | 图表配置 |
| `element.ts` | 元素配置 |
| `font.ts` | 字体配置 |
| `hotkey.ts` | 快捷键配置 |
| `image-clip.ts` | 图片裁剪配置 |
| `latex.ts` | LaTeX 配置 |
| `lines.ts` | 线条样式配置 |
| `mime.ts` | MIME 类型 |
| `shapes.ts` | 形状配置 |
| `storage.ts` | 存储配置 |
| `symbol.ts` | 符号配置 |
| `theme.ts` | 主题配置 |

#### `tests/` — 单元测试

| 文件 | 说明 |
|------|------|
| `setup-env.ts` | 测试环境配置 |
| `agents/path-planning-agent.test.ts` | 学习路径 Agent |
| `agents/profile-agent.test.ts` | 画像 Agent |
| `agents/review-agent.test.ts` | 审阅 Agent |
| `ai/minimax-provider.test.ts` | MiniMax Provider |
| `audio/minimax-tts-models.test.ts` | MiniMax TTS |
| `export/classroom-zip.test.ts` | 课堂 ZIP 导出 |
| `knowledge-base/` | 知识库测试（retriever、service、course-structure、personalized-recommendation） |
| `prompts/loader.test.ts` | Prompt 加载器 |
| `prompts/templates.test.ts` | Prompt 模板 |
| `server/` | 服务端测试（agent-routes、classroom-agent-mode、knowledge-routes、provider-config、security-headers、ssrf-guard） |
| `settings/custom-provider-baseurl.test.ts` | 自定义 Provider BaseURL |
| `store/settings-validation.test.ts` | 设置验证 |
| `store/settings-server-sync.test.ts` | 服务端同步（37 个测试用例） |

#### `e2e/` — Playwright 端到端测试

| 文件 | 说明 |
|------|------|
| `fixtures/base.ts` | E2E 基础配置 |
| `fixtures/mock-api.ts` | API Mock 工具 |
| `fixtures/test-data/` | 测试数据（scene-actions、scene-content、scene-outlines、settings） |
| `pages/` | Page Object（classroom、generation-preview、home） |
| `tests/` | 测试用例（classroom-interaction、full-happy-path、generation-flow、home-to-generation） |

#### `eval/` — 评估实验

| 子目录 | 说明 |
|--------|------|
| `outline-language/` | 大纲语言评估：runner、judge、reporter、scenarios |
| `whiteboard-layout/` | 白板布局评估：runner、capture、scorer、state-manager、reporter、6 个场景 |
| `shared/` | 共享工具：markdown-report、resolve-model、run-dir |

#### 其他

| 目录 | 说明 |
|------|------|
| `scripts/crawler/` | PDF 爬虫脚本（Python） |
| `data/` / `.data/` | 运行时数据（users.json） |
| `assets/` | Demo 素材（GIF、PNG） |
| `skills/openmaic/` | Claude Code 技能定义 |
| `docs/` | 设计文档 |

## 6. 三条核心业务链路

### A. 课程生成链路

**入口**：`app/page.tsx` → `app/generation-preview/page.tsx`

**服务端**：`app/api/generate-classroom/route.ts` → `lib/server/classroom-job-runner.ts`

**大致流程**：

1. 首页收集需求（文本 + PDF 上传 + 知识库匹配）
2. 写入 `sessionStorage`，跳转 `generation-preview`
3. `generation-preview` 发起 `/api/generate-classroom`（带 headers：`x-image-generation-enabled`、`x-video-generation-enabled` 等）
4. API 创建异步 job（`classroom-job-runner`），返回 jobId
5. 后台执行：生成大纲 → 并行生成场景（内容 + 动作/讲稿 + 媒体 + TTS）→ 持久化
6. 前端轮询 `/api/generate-classroom/[jobId]`，完成后进入 `classroom/[id]`

**关键文件**：`lib/generation/generation-pipeline.ts`、`lib/generation/pipeline-runner.ts`、`lib/server/classroom-media-generation.ts`、`lib/media/media-orchestrator.ts`

### B. 课堂播放与互动链路

**入口**：`app/classroom/[id]/page.tsx` → `components/stage.tsx`

**大致流程**：

1. 从 IndexedDB / sessionStorage 读取 stage、scenes、chats
2. `Stage` 组件统一管理场景切换、播放状态、讨论状态、白板状态、聊天区状态
3. `PlaybackEngine`（`lib/playback/index.ts`）控制讲解播放节奏
4. `StreamBuffer`（`lib/buffer/stream-buffer.ts`）控制打字机效果和讲稿节奏
5. `ActionEngine`（`lib/action/engine.ts`）执行 spotlight/laser/highlight 等动作
6. `ChatArea`（`components/chat/chat-area.tsx`）显示讲稿笔记、发起对话
7. `SceneRenderer`（`components/stage/scene-renderer.tsx`）按类型渲染场景

**核心三件套**：`lib/types/stage.ts` → `lib/store/stage.ts` → `components/stage.tsx`

### C. Agent 聊天编排链路

**入口**：`app/api/chat/route.ts`

**核心模块**：`lib/orchestration/`（ai-sdk-adapter、tool-schemas、summarizers）+ `lib/agents/`（6 agent）

**特点**：

- 无状态 SSE 聊天：客户端每次把完整消息 + storeState 一并传给后端
- 后端用 LangGraph director graph 决定下一个 agent、何时 cue user、何时结束
- 结果以 SSE 增量事件流回前端
- 多 Agent 按 **profile → retrieval → planning → resource-generation → review → evaluation** 流水线协作

## 7. 数据与状态存储

### 运行时状态

- Zustand 管理（13+ stores，均 persist）
- `lib/store/stage.ts` 是课堂核心 store（IndexedDB）
- `lib/store/auth.ts` 是认证 store（localStorage）
- `lib/store/settings.ts` 是设置 store（localStorage）

### 本地持久化

- Dexie / IndexedDB：`MAIC-Database` v14
- 入口：`lib/utils/database.ts`
- 14 张表：stages、scenes、audioFiles、imageFiles、snapshots、chatSessions、playbackState、stageOutlines、mediaFiles、generatedAgents、bookshelf、categories、accessHistory、wrongQuestions
- 所有表含 `userId` 字段，多账号隔离

### 三层存储模型

| 层级 | 存储 | 用途 |
|------|------|------|
| 即时状态 | Zustand | 编辑/播放中的实时状态 |
| 本地缓存 | IndexedDB | 本地恢复、离线缓存 |
| 服务端存储 | `lib/server/classroom-storage.ts` | 生成完成后可分享的课堂 |

## 8. 认证体系

| 层级 | 说明 |
|------|------|
| 前端页面 | `app/login/` + `app/register/`（左侧 character-animation + 右侧表单） |
| 客户端守卫 | `components/auth/protected-route.tsx`、`components/auth/auth-provider.tsx` |
| 服务端守卫 | `middleware.ts`：JWT 验证 `auth_token` Cookie（jose HS256，7 天）+ 可选 ACCESS_CODE（HMAC） |
| API 层 | `app/api/auth/`：login、register、logout、me、avatar |
| 业务层 | `lib/server/auth-utils.ts`（JWT + bcrypt）、`lib/server/user-store.ts`（文件型 `.data/users.json`） |
| 状态层 | `lib/store/auth.ts`（persist localStorage） |

## 9. Provider 与配置体系

项目通过环境变量（`.env.example`）配置各类 Provider，支持 12 种 LLM Provider：

- **LLM**：`lib/ai/providers.ts` | API: `app/api/verify-model/route.ts` | 配置: `lib/server/resolve-model.ts`
- **图片生成**：`lib/media/image-providers.ts` + `adapters/` | API: `app/api/verify-image-provider/route.ts`
- **视频生成**：`lib/media/video-providers.ts` + `adapters/` | API: `app/api/verify-video-provider/route.ts`
- **TTS**：`lib/audio/tts-providers.ts` | API: `app/api/azure-voices/route.ts`
- **ASR**：`lib/audio/asr-providers.ts` | API: `app/api/transcription/route.ts`
- **PDF**：`lib/pdf/` | API: `app/api/parse-pdf/route.ts`、`app/api/verify-pdf-provider/route.ts`
- **Web Search**：`lib/web-search/` | API: `app/api/web-search/route.ts`
- **Embedding**：`lib/rag/embedding/providers.ts`
- **Provider 列表**：`app/api/server-providers/route.ts`

## 10. PBL 教学系统

- `lib/pbl/generate-pbl.ts` — 异步 pipeline 生成 PBL 场景
- `lib/pbl/pbl-system-prompt.ts` — PBL 系统提示词
- `lib/pbl/mcp/` — MCP 工具集（agent-mcp / issueboard-mcp / mode-mcp / project-mcp）+ agent 模板
- `app/api/pbl/chat/route.ts` — PBL 聊天 SSE
- `components/scene-renderers/pbl-renderer.tsx` — PBL 主渲染器
- `components/scene-renderers/pbl/` — 子组件（chat-panel / guide / issueboard-panel / role-selection / workspace）

## 11. 国际化

- 框架：i18next + react-i18next
- 支持语言：zh-CN / zh-TW / en-US / ja-JP / ru-RU / ar-SA / pt-BR（7 种）
- 动态加载：`i18next-resources-to-backend`
- 配置：`lib/i18n/config.ts` + `lib/i18n/locales.ts`
- 语言文件：`lib/i18n/locales/` 下 7 个 JSON
- 切换入口：`components/language-switcher.tsx`

## 12. 渲染层注意事项

修改 UI 时最需谨慎的四块：

1. **`components/stage.tsx`** — 课堂总控，状态耦合最高
2. **`components/slide-renderer/`** — 幻灯片/画布系统，~70 个文件，联动复杂
3. **`lib/types/stage.ts`** — 类型结构决定了渲染/播放/导出逻辑
4. **`lib/store/stage.ts`** — 课堂核心 store

通常一个小改动会跨越 `lib/types/*` → `lib/store/*` → `components/stage*` → 导出/播放/生成至少一层。

## 13. 测试

| 命令 | 说明 |
|------|------|
| `pnpm test` | Vitest 单元测试（`tests/`） |
| `pnpm test:e2e` | Playwright E2E（`e2e/`） |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier |
| `pnpm eval:whiteboard` | 白板布局评估 |
| `pnpm eval:outline-language` | 大纲语言评估 |

## 14. 典型请求链路

### 课堂生成

`用户输入需求` → `POST /api/generate-classroom` → `classroom-job-runner` → `outline-generator` → `scene-generator（并行）` → `classroom-storage` → `前端轮询 jobId` → `进入 classroom/[id]`

### 聊天（SSE）

`POST /api/chat` → `stateless-generate` → `director-graph（LangGraph）` → `SSE 增量事件流` → `StreamBuffer 节奏控制` → `ChatArea 渲染`

## 15. 对后续维护最重要的判断

- 单仓全栈 AI 应用，不是纯前端项目
- 真正的业务骨架在 `lib/`，不在 `app/api/`
- 课堂页是最复杂的运行时区域：`Stage` → `SceneRenderer` → `SlideRenderer`
- 课程生成和课堂聊天是两套不同但有关联的 AI 链路
- 本地 IndexedDB 持久化是产品体验的重要组成，不是边角功能
- `lib/types/stage.ts` + `lib/store/stage.ts` + `components/stage.tsx` = 课堂域核心三件套
- 认证：JWT（jose）+ bcrypt + httpOnly Cookie + 文件型用户存储
- 多 Agent 系统按 6 阶段流水线：profile → retrieval → planning → resource-generation → review → evaluation
- PBL 是独立子系统，有 MCP 工具集和渲染器
- 国际化：i18next 7 种语言动态加载
- 主题：next-themes light/dark/system
- Tailwind CSS v4 CSS-based 配置，无 `tailwind.config.ts`
- `lib/ai/thinking-context.ts` 的 AsyncLocalStorage 是 LLM 调用的关键装饰

## 16. 一句话总结

一个用 Next.js 16 App Router 承载的 AI 互动课堂系统（pnpm monorepo），前端靠 Zustand + IndexedDB（Dexie v14）管理课堂状态，服务端靠 `lib/server` 和 `lib/orchestration` 跑课程生成（异步 job + 轮询）与 Agent 编排（无状态 SSE + LangGraph director graph），渲染核心在 `Stage` + Scene Renderers（quiz/PBL/interactive）+ Slide Renderer（ProseMirror + ECharts），多 Agent 系统在 `lib/agents/` 按 6 阶段流水线协作，PBL 在 `lib/pbl/` 通过 MCP 工具集支持项目式学习，JWT 认证在 `middleware.ts` + `app/api/auth/` 提供用户体系，i18next 支持 7 种语言，next-themes 支持 light/dark/system 主题。
