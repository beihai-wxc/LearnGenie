# LearnGenie

AI 互动课堂生成系统 —— 输入主题或上传资料，一键生成包含幻灯片、测验、互动实验、PBL 项目的完整课堂，多 Agent 协作授课。

## 功能特点

- **一键生成课堂**：输入主题描述或上传 PDF 资料，自动生成结构化课堂（大纲 → 场景内容 → 讲稿动作 → 媒体资源）
- **多 Agent 协作教学**：AI 教师与 AI 同学分工协作，支持讲解、讨论、追问、圆桌对话
- **多形态场景**：幻灯片、测验、交互式可视化（模拟/图表/代码/游戏/3D）、PBL 项目式学习
- **多媒体生成**：课堂配图自动生成、视频生成、TTS 语音合成（支持多种 Provider）
- **知识库检索（RAG）**：向量搜索 + 概念术语匹配，支持上传文档入库、自动关联课堂
- **白板与公式**：支持公式（LaTeX）、图表（ECharts）、代码块、形状、表格等内容表达
- **历史课堂管理**：书架收藏、分组管理、错题本
- **用户画像**：8 维度学习能力评估雷达图，个性化学习路径推荐
- **PPTX / ZIP 导出**：课堂内容导出为 PPTX 或 HTML ZIP 包
- **多语言支持**：中文、English、日本語、Русский、العربية 等 7 种语言
- **多模型支持**：可接入 OpenAI、Anthropic、Google、DeepSeek、Qwen、GLM、Kimi、MiniMax、Doubao、Grok、Ollama 等 12 种 LLM Provider

## 本地启动

### 环境要求

- Node.js >= 20
- pnpm（推荐通过 Corepack 使用）

### 安装依赖

```bash
corepack pnpm install
```

### 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`，至少配置一个 LLM Provider 的 API Key：

```bash
# 示例：使用 OpenAI
OPENAI_API_KEY=sk-xxx

# 或使用其他 Provider，参考 .env.example 中的完整列表
```

未配置 Provider 时仅能启动页面，无法生成课堂内容。

### 启动开发服务器

```bash
corepack pnpm dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
corepack pnpm build
corepack pnpm start
```

## 项目结构

```
app/             页面路由 + API Route（Next.js App Router）
├── api/         服务端 API（聊天、生成、认证、知识库、媒体等）
├── classroom/   课堂播放页
├── generation-preview/ 生成进度页
├── bookshelf/   历史课堂
├── knowledge/   知识库
├── profile/     用户画像
└── ...
components/      前端 UI 组件（auth、chat、stage、slide-renderer 等）
lib/             业务核心（生成流水线、Agent 编排、存储、工具函数）
packages/        内部 workspace 包（mathml2omml、pptxgenjs）
configs/         配置常量（图表、字体、主题、快捷键等）
tests/           单元测试（Vitest）
e2e/             端到端测试（Playwright）
eval/            评估实验脚本
rag/             本地知识库资源与索引
```

详细架构与文件说明见 [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)。

## 可用命令

| 命令 | 说明 |
|------|------|
| `corepack pnpm dev` | 启动开发服务器 |
| `corepack pnpm build` | 生产构建 |
| `corepack pnpm start` | 启动生产服务 |
| `corepack pnpm test` | 运行单元测试 |
| `corepack pnpm test:e2e` | 运行 E2E 测试 |
| `corepack pnpm lint` | 代码检查 |
| `corepack pnpm format` | 代码格式化 |
| `corepack pnpm rag:build-index` | 重建知识库向量索引 |

## 技术栈

- **框架**：Next.js 16 + React 19 + TypeScript
- **状态管理**：Zustand（persist 中间件）
- **本地存储**：Dexie / IndexedDB
- **AI**：Vercel AI SDK + LangGraph + LangChain
- **UI**：Tailwind CSS v4 + Radix UI + motion（framer-motion）
- **图表**：ECharts
- **富文本**：ProseMirror
- **认证**：JWT（jose）+ bcrypt
- **国际化**：i18next
- **测试**：Vitest + Playwright
- **包管理**：pnpm workspace

## 许可证

AGPL-3.0
