# 侧边栏加宽并添加 Tooltip 方案

## 问题
1. 侧边栏太窄（当前 `w-20` = 80px），图标显得拥挤
2. 鼠标悬停图标时无法显示文字说明（虽然使用了 `title` 属性，但浏览器原生的 title 提示延迟长、样式不可控）

## 解决方案

### 1. 加宽侧边栏
将侧边栏宽度从 `w-20`（80px）调整为 `w-52`（208px），让图标有足够的空间并可以在展开时显示文字标签。

### 2. 使用 Tooltip 组件替换 `title` 属性
使用项目已有的 `@/components/ui/tooltip` 组件，在鼠标悬停时显示精美的 Tooltip 提示。

### 具体修改文件
- `components/sidebar/sidebar.tsx`

### 具体修改内容

1. **导入 Tooltip 组件**
   - 添加 `import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';`

2. **加宽侧边栏容器**
   - 将 `<aside>` 的 `w-20` 改为 `w-52`

3. **Logo 区域加宽**
   - 将 Logo 容器从 `size-12` 调整为合适宽度

4. **导航按钮增加文字标签 + Tooltip**
   - 按钮宽度从 `w-12` 改为 `w-full px-3`
   - 使用 `Tooltip` 包裹每个按钮
   - 按钮内同时显示图标和文字标签（文字在悬停时更美观）
   - 将 `title={item.label}` 替换为 Tooltip 组件

5. **调整按钮布局**
   - 按钮改为 `flex items-center gap-3` 布局，图标和文字水平排列
   - 文字标签使用 `truncate` 防止超长文字溢出

### 预期效果
- 侧边栏宽度从 80px 增加到 208px
- 图标居中显示，鼠标悬停时显示优雅的 Tooltip 动画提示
- 按钮悬停时有缩放和背景色变化效果
