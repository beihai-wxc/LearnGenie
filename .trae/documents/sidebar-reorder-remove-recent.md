# 侧边栏顺序调整与删除"最近的课堂"

## 当前状态
`components/sidebar/sidebar.tsx` 中的 `sidebarItems` 数组顺序：
1. 学生肖像 (/profile)
2. 最近的课堂 (#home-showcase)
3. 书架 (/bookshelf)
4. 今天学点什么 (/today)

## 修改内容

### 修改文件：`components/sidebar/sidebar.tsx`

1. 删除 `sidebarItems` 数组中 `id: 'recent'` 的条目（"最近的课堂"）
2. 调整剩余条目顺序为：
   - 今天学点什么 (/today)
   - 学生肖像 (/profile)
   - 书架 (/bookshelf)

3. 同时删除不再使用的 `Clock` 图标 import（来自 `lucide-react`）

## 预期效果
侧边栏从上到下显示三个按钮：
1. 今天学点什么
2. 学生肖像
3. 书架
