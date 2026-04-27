# 书架页面重构方案

## 当前状态
- `app/bookshelf/page.tsx`：硬编码 4 本模拟书籍（高等数学、大学物理、普通化学、大学英语）
- `app/page.tsx`：有"最近课堂"功能（`HomeClassroomShowcase` 组件），展示 IndexedDB 中的课堂列表
- `lib/utils/stage-storage.ts`：课堂数据存储在 IndexedDB，提供 `listStages`、`getFirstSlideByStages`、`deleteStageData`、`renameStage` 等方法
- `lib/utils/database.ts`：Dexie IndexedDB 定义
- 无文件上传功能，无分类功能

## 修改内容

### 1. 数据库层改造

**修改文件**：`lib/utils/database.ts`
- 新增 `BookshelfItem` 表类型（存储上传的文档/分类信息）
- 新增 Version 10 schema：`bookshelf: 'id, type, category, createdAt'`
- 类型定义：
  ```typescript
  export interface BookshelfRecord {
    id: string; // Primary key (UUID)
    title: string; // Display name
    type: 'classroom' | 'document'; // 课堂（来自 AI 生成）或文档（用户上传）
    stageId?: string; // 如果是课堂类型，关联 stage id
    fileName?: string; // 如果是文档，原始文件名
    fileType?: string; // pdf, zip, etc.
    fileSize?: number; // bytes
    blobKey?: string; // IndexedDB 中 blob 的 key
    category: string; // 分类标签
    createdAt: number;
    updatedAt: number;
  }
  ```

**新文件**：`lib/utils/bookshelf-storage.ts`
- `saveBookshelfItem(item: BookshelfRecord)` — 保存/更新文档记录
- `deleteBookshelfItem(id: string)` — 删除记录及关联 blob
- `listBookshelfItems(type?: 'classroom' | 'document')` — 列出所有条目，支持按类型筛选
- `storeDocumentBlob(key: string, file: File)` — 存储文件 blob 到 imageFiles 表
- `getDocumentBlob(key: string)` — 获取文件 blob
- `listCategories()` — 列出所有分类
- `addCategory(name: string)` / `removeCategory(name: string)` — 管理分类

### 2. 从首页迁移"最近课堂"到书架

**修改文件**：`app/page.tsx`
- 移除 `HomeClassroomShowcase` 组件的引入和使用
- 移除课堂加载、删除、重命名等相关逻辑（state + handler + useEffect）
- 移除 `HomeClassroomShowcase` 相关 import

**修改文件**：`app/bookshelf/page.tsx`
- 完全重构页面
- 使用 `listStages` + `getFirstSlideByStages` 读取课堂数据
- 使用 `listBookshelfItems` 读取文档数据
- 复用 `HomeClassroomShowcase` 中的 `ClassroomFeatureCard` 组件（或提取到共享组件）

### 3. 新增书架组件

**新文件**：`components/bookshelf/bookshelf-tabs.tsx`
- 分类 Tab 栏组件：`全部` | `课堂` | `文档` | `分类管理`
- 参考第二张图的 Tab 设计（蓝色下划线高亮当前选中）

**新文件**：`components/bookshelf/bookshelf-card.tsx`
- 统一的卡片组件，支持两种模式：
  - **课堂卡片**：显示缩略图、幻灯片数量、创建时间、操作（打开/重命名/删除）
  - **文档卡片**：显示文件图标、文件名、文件大小、上传时间、操作（打开/删除）

**新文件**：`components/bookshelf/bookshelf-upload.tsx`
- 文件上传组件
- 支持拖拽上传 + 点击选择
- 支持 PDF、ZIP 等格式
- 上传后自动存储到 IndexedDB 并创建记录
- 选择分类标签

**新文件**：`components/bookshelf/bookshelf-empty.tsx`
- 空状态组件（参考第二张图）
- 居中显示大加号按钮 "添加文档到书架"
- 虚线边框

### 4. 书架页面布局

```
[侧边栏]
  书架页面
    ┌─────────────────────────────────────────┐
    │  书架                                    │
    │  管理你的学习资料和课程                   │
    └─────────────────────────────────────────┘
    ─────────────────────────────────────────
    │  [🔍 搜索]    [+ 添加资料]    [分类 ▼]    │
    │  [全部] [课堂] [文档] [分组]              │
    └─────────────────────────────────────────┘
    
    有内容时 → 卡片网格（2-3 列响应式）
    无内容时 → 空状态引导组件
```

### 5. 首页改动

**修改文件**：`app/page.tsx`
- 移除"最近课堂"展示区
- 保留输入框和生成按钮等核心功能
- 移除不再使用的 state/handler

### 6. 修改文件清单

| 操作 | 文件路径 | 说明 |
|------|---------|------|
| 修改 | `lib/utils/database.ts` | 新增 bookshelf 表和类型定义 |
| 新增 | `lib/utils/bookshelf-storage.ts` | 书架存储管理逻辑 |
| 修改 | `app/bookshelf/page.tsx` | 完全重构 |
| 修改 | `app/page.tsx` | 移除最近课堂展示 |
| 新增 | `components/bookshelf/bookshelf-tabs.tsx` | 分类 Tab |
| 新增 | `components/bookshelf/bookshelf-card.tsx` | 统一卡片 |
| 新增 | `components/bookshelf/bookshelf-upload.tsx` | 文件上传 |
| 新增 | `components/bookshelf/bookshelf-empty.tsx` | 空状态 |
