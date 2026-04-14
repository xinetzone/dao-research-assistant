# 计划：将联网搜索开关移入搜索框

## 背景

用户截图显示：
- **绿色框 1**（侧边栏）：导航栏里有"搜索网页"按钮（带"已启用"标签）
- **绿色框 2**（主区域）：搜索框上方有独立的"启用联网搜索"浮动按钮
- **红色框**：搜索框右侧发送按钮左边的空白区域

用户希望：将两个绿色框合并成一个 Globe 图标开关按钮，嵌入到搜索框内部（红色框位置）。

---

## 修改方案

### 1. `src/components/SearchBar.tsx`

**目标**：在搜索框底部工具栏添加 Globe 切换开关

新增 props：
```typescript
interface SearchBarProps {
  onSubmit: (query: string) => void;
  isLoading?: boolean;
  placeholder: string;
  variant?: "landing" | "chat";
  webSearchEnabled?: boolean;         // 新增
  onWebSearchToggle?: () => void;     // 新增
}
```

UI 变化：将 textarea 放在独立行，底部增加一个工具栏行，工具栏左侧放 Globe 开关按钮（文字+图标），右侧放发送按钮（原位置的绝对定位改为 flex 布局）。

```
┌────────────────────────────────────────┐
│ 输入文字...                             │
│ ─────────────────────────────────────  │
│ [Globe 联网搜索] (切换)   [→ 发送]     │
└────────────────────────────────────────┘
```

Globe 按钮样式：
- 关闭：ghost 样式，文字"联网搜索" / "Web Search"，灰色
- 开启：primary/10 背景，主色文字，文字"联网搜索 ✓"，有视觉高亮

### 2. `src/pages/Index.tsx`

**目标**：将 webSearch 相关 props 传入 SearchBar，移除旧的功能入口

- 给两处 `<SearchBar>` 都传入 `webSearchEnabled` 和 `onWebSearchToggle`
- 删除主区域顶部独立的"启用联网搜索"浮动按钮（第 112-119 行）

### 3. `src/components/NavigationSidebar.tsx`

**目标**：移除"搜索网页"导航项及相关 props

- 删除 `webSearchEnabled` prop
- 删除 `onWebSearchToggle` prop  
- 删除"搜索网页"按钮（第 122-137 行）
- 更新接口类型定义

---

## 关键文件

| 文件 | 修改内容 |
|------|---------|
| `src/components/SearchBar.tsx` | 添加 Globe 开关按钮，重构底部布局 |
| `src/pages/Index.tsx` | 传递 webSearch props，删除旧浮动按钮 |
| `src/components/NavigationSidebar.tsx` | 移除搜索网页导航项和相关 props |

---

## 验证

1. 搜索框底部出现 Globe 图标 + "联网搜索"文字按钮
2. 点击开关后按钮高亮/暗淡切换
3. 侧边栏无"搜索网页"项
4. 主区域无独立"启用联网搜索"浮动按钮
5. 提交查询时 webSearchEnabled 状态仍正确传递给 AI
