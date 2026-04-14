# 全面优化计划

## 背景

对照当前所有代码，按优先级分 3 批实施优化，覆盖 UX、视觉、功能三个维度。

---

## P0 — 核心 UX 交互（最高优先级）

### 1. SearchBar textarea 自动伸缩（chat 模式）
- **现状**：chat 模式 `rows={1}` 固定单行，长消息看不到全文
- **方案**：使用 `onInput` 事件动态设置 `scrollHeight` 高度，最小 1 行，最大 6 行
- **文件**：`src/components/SearchBar.tsx`

### 2. 停止生成按钮
- **现状**：AI 生成过程中无法中断
- **方案**：`isLoading` 时把 Send 按钮改成 Stop 图标，点击调用 `cancel()`；Index.tsx 需从 `useAIChat` 拿到 `cancel` 并传给 SearchBar
- **文件**：`src/hooks/useAIChat.ts`（已有 `cancel`）、`src/components/SearchBar.tsx`、`src/pages/Index.tsx`

### 3. 联网搜索进度提示
- **现状**：开启联网后 AI 等待时只显示通用"仙师感应中"点点动画，用户不知道在搜索
- **方案**：在 edge function 里在搜索完成后发 `event: search_started` → 在 `onmessage` 捕获，把等待提示从通用"思考中"改为"正在联网搜索..."，搜索结果到来后恢复正常
- **更简单方案**：前端在 `webSearchEnabled && isWaitingForContent` 时直接显示"正在联网搜索..."
- **文件**：`src/components/ChatMessage.tsx`

### 4. 回到底部按钮
- **现状**：用户向上滚动查看历史消息后，新消息到来无法提示
- **方案**：监听消息区 scroll 事件，不在底部时显示悬浮"↓"按钮，点击 `scrollToBottom()`
- **文件**：`src/pages/Index.tsx`

---

## P1 — 消息功能增强（次高优先级）

### 5. 复制消息按钮
- **现状**：AI 回复无法快捷复制
- **方案**：在 ChatMessage 组件的 assistant 消息右上角加 Copy 图标按钮，hover 显示，点击后图标切换为 CheckCheck 并 2s 后复原
- **文件**：`src/components/ChatMessage.tsx`

### 6. 重新生成按钮
- **现状**：无法重试最后一条 AI 回复
- **方案**：最后一条 assistant 消息（非 streaming）显示 RotateCcw 按钮，点击触发重新发送上一条 user 消息
- 需要 Index.tsx 把 `handleSubmit` + `messages` 传入 ChatMessage，或通过回调 `onRegenerate` 传递
- **文件**：`src/components/ChatMessage.tsx`、`src/pages/Index.tsx`

---

## P2 — 视觉与暗色模式完善

### 7. 暗色模式验证与修复
- **现状**：目前没有暗色模式切换开关；`LanguageSwitcher` 旁边可加 ThemeToggle 按钮
- **方案**：新增 `src/components/ThemeToggle.tsx`（Moon/Sun 图标），用 `document.documentElement.classList.toggle('dark')` + `localStorage` 持久化；加入 NavigationSidebar footer
- **文件**：`src/components/ThemeToggle.tsx`（新建）、`src/components/NavigationSidebar.tsx`

### 8. 首页推荐问题优化
- **现状**：SuggestedPrompts 的 4 个 tags 只是分类标签，与下方问题内容重复；点击 tag 会触发问题
- **方案**：Tag 仅做视觉分类，点击后高亮该 tag 并过滤下方问题（每个 tag 对应 4 个问题），变为内容导航而非直接提交
- **文件**：`src/components/SuggestedPrompts.tsx`、`src/i18n/locales/zh-CN.json`、`src/i18n/locales/en-US.json`

### 9. 联网搜索结果来源卡片美化
- **现状**：SourceCard 布局紧凑，snippet 内容较长时显示不够直观
- **方案**：加上 favicon 图标（`https://www.google.com/s2/favicons?domain=xxx`），截断 snippet 为 1 行，整体更紧凑
- **文件**：`src/components/ChatMessage.tsx`

---

## 实施顺序

| 批次 | 内容 | 文件 |
|------|------|------|
| 批次1 | P0：textarea 自动伸缩 + 停止按钮 + 联网提示 + 回到底部 | SearchBar, ChatMessage, Index.tsx |
| 批次2 | P1：复制按钮 + 重新生成 | ChatMessage, Index.tsx |
| 批次3 | P2：ThemeToggle + SourceCard favicon + SuggestedPrompts 优化 | ThemeToggle(新), NavigationSidebar, ChatMessage, SuggestedPrompts |

## 验证

- Lint 0 错误，build 成功
- 所有改动推送 GitHub
- 测试：chat 模式输入长文本是否自动伸缩、点击 Stop 是否中断、联网开启时是否显示"搜索中"提示、向上滚动后是否出现回底部按钮、复制按钮是否正常、暗色模式切换是否持久化
