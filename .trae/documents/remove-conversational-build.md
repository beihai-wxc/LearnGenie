# 去除学生肖像页面中的"对话式构建"模块

## 当前状态
`app/profile/page.tsx` 包含左右两栏布局：
- 左侧：对话式构建（对话历史 + 聊天输入框 + 引导问题）
- 右侧：学习能力雷达图 + 8个维度卡片

## 修改内容

### 修改文件：`app/profile/page.tsx`

1. **删除对话式构建相关的 import**
   - 移除 `ProfileChatInput` 的 import
   - 移除 `ProfileConversationHistory` 的 import
   - 移除 `useState, useCallback, useEffect`（如不再需要）
   - 移除 `Bot, User` 的 import
   - 移除 `useSettingsStore` 的 import（不再需要模型配置）
   - 移除 `getCurrentModelConfig` 的 import
   - 移除 `toast` 的 import

2. **删除对话式构建相关的 state 和 handler**
   - 移除 `isExtracting`、`isResetting` 状态
   - 移除 `handleSend` 函数（对话发送逻辑）
   - 移除 `handleReset` 函数
   - 移除 `conversationCount`、`updatedAt`、`conversationHistory` 等 conversation 相关 store 的引用
   - 移除 `addConversationEntry`、`clearConversationHistory`、`incrementConversationCount` 等 store 方法的引用
   - 移除 `modelConfig` 的引用
   - 移除 `conversationEndRef`
   - 移除 `useEffect` 中对 conversationHistory 的滚动效果

3. **移除左侧对话式构建面板**
   - 删除整个 `lg:col-span-1` 的左侧 div（包含对话历史、聊天输入框）
   - 将右侧内容从 `lg:col-span-2` 改为全宽布局

4. **移除重置画像按钮**
   - 删除 Header 中的"重置画像"按钮及相关逻辑

5. **简化页面描述**
   - 将"通过自然语言对话，AI 自动构建你的多维度学习画像"改为更简洁的描述，如"AI 根据你的学习行为，展示你的多维度学习画像"

### 保留内容
- 侧边栏
- 页面标题"学生肖像"
- 学习能力雷达图
- 8个维度卡片（知识基础、认知风格、易错点偏好、学习节奏、兴趣方向、元认知策略、情感动机、交互偏好）

## 预期效果
学生肖像页面只显示：
- 顶部标题和副标题
- 学习能力雷达图（全宽）
- 8个维度卡片（2列布局）

不再显示对话式构建面板和重置按钮。
