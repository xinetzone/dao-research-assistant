# 道衍 — Session Review 2026-04-16

## 概览

| 项目 | 内容 |
|------|------|
| **日期** | 2026-04-16 |
| **Commits** | 5 个（ea8c40b … 579f223） |
| **涉及文件** | 6 个文件 |
| **Tags（本地）** | v0.7.8 · v0.7.9 · v0.8.0 · v0.8.1 |
| **Tags（GitHub）** | v0.6.2 → v0.8.1 · v1.0.0 · v1.1.0（共 15 个补建） |

---

## 任务一 — Git 注释标签重建（轻量→注释）

### 背景
用户发现 GitHub Tags 页面每个标签的描述全是空白，原因是历史上一直用 `git tag v0.x.x`（轻量标签，无消息），GitHub 显示为空。

### 修复
1. 批量删除本地 + 远端的所有 11 个轻量标签
2. 用 `git tag -a v0.x.x -m "..."` 重建为注释标签
3. `git push origin --tags` 推送（当时 origin 为本地 `/workspace/center`）

### 结论
轻量标签 = 只是指向 commit 的指针，无独立对象；
注释标签 = 独立 tag 对象，有消息、有作者、有时间戳，GitHub 展示说明文字。

---

## 任务二 — 移除侧边栏联网搜索按钮 (v0.7.8)

### 背景
导航栏有一个 Globe「搜索网页」按钮，与对话框 SearchBar 中的「联网」按钮功能重复。

### 修改文件
- `src/components/NavigationSidebar.tsx`：删除 Globe 按钮及 `webSearchEnabled`/`onWebSearchToggle` props
- `src/pages/Index.tsx`：删除向 NavigationSidebar 传递的两个 props

### 注意
`webSearchEnabled` 状态本身保留（对话框 SearchBar 仍使用），只删除侧边栏的按钮。

---

## 任务三 — 修复联网搜索无结果问题 (v0.7.9)

### 测试过程
1. 直接 curl 调用 `web-search` 独立边缘函数 → 有结果（DuckDuckGo HTML 解析成功）
2. 调用 `ai-chat` 主函数（`enable_web_search: true`）→ 无结果，系统日志 `"web search attempted but returned no results"`

### 根因分析

| 问题 | 详情 |
|------|------|
| SearXNG 公共实例失效 | 4 个实例全被屏蔽/限速，超时 24 秒无结果 |
| DDG HTML 解析器正则不匹配 | 旧代码按 `class="result__body"` 分割，实际 HTML 用 `<div class="result...">` 块 |
| URL 提取错误 | DDG 返回重定向链接 `//duckduckgo.com/l/?uddg=...`，未解码为真实 URL |

### 修复（`supabase/functions/ai-chat-167c2bc1450e/index.ts`）
- 完全移除 SearXNG 策略（4 个超时调用 = 性能黑洞）
- 重写 `duckduckgoSearch()`：用 `/<div class="result[^"]*">/gi` 正则匹配结果块（与独立函数保持一致）
- 修复 URL 提取：`rawHref.match(/uddg=([^&"]+)/)` → `decodeURIComponent()` → 真实 URL
- 保留 `duckduckgoLiteSearch()` 作为 fallback

### 验证
查询「特朗普2026年最新政策」→ 返回 BBC 中文等真实网页，`search_results` SSE event 正常触发。

---

## 任务四 — 修复 `**粗体**` 不渲染问题 (v0.8.0)

### 症状
AI 回复中 `**帛书第78章（今本第34章）**说：` 显示原始 `**` 字符，不渲染为粗体。

### 根因（CommonMark 规范边界检测）

**右侧限定符判定规则：**
- 规则 (a)：前一字符不是 Unicode 标点 → RIGHT-FLANKING ✓
- 规则 (b)：前一字符是 Unicode 标点 AND 后一字符是空白或标点 → RIGHT-FLANKING ✓

`）**说：` 中：
- `）`（U+FF09）= Unicode 标点（规则 a 失败）
- `说`（CJK 汉字）= 非空白非标点（规则 b 也失败）
- → **不构成右侧限定符** → 粗体不渲染

同理：`。**是以` 也失败（`。` 是标点，`是` 是 CJK 字母）。

### 修复（`src/components/MarkdownRenderer.tsx`）
```typescript
// 预处理函数：在 md.render() 之前转换 **text** → <strong>text</strong>
function preprocessMarkdown(content: string): string {
  const PLACEHOLDER = "\uE001"; // 私用区 Unicode，不会出现在正常文本中
  const saved: string[] = [];
  let idx = 0;

  // 1. 提取代码块（用占位符保护，防止代码内的 ** 被处理）
  let text = content
    .replace(/```[\s\S]*?```/g, m => { saved.push(m); return `${PLACEHOLDER}${idx++}${PLACEHOLDER}`; })
    .replace(/`[^`\n]+`/g,      m => { saved.push(m); return `${PLACEHOLDER}${idx++}${PLACEHOLDER}`; });

  // 2. 将 **text** 转为 <strong>text</strong>（完全绕过 CommonMark 边界检测）
  text = text.replace(/\*\*([^*\n]+?)\*\*/g, (_, inner) => `<strong>${inner}</strong>`);

  // 3. 恢复代码块
  return text.replace(new RegExp(`${PLACEHOLDER}(\\d+)${PLACEHOLDER}`, "g"),
    (_, i) => saved[parseInt(i)]);
}
```
配合 `html: true`（markdown-it 配置），DOMPurify 允许 `<strong>` 标签。

---

## 任务五 — 建议问题替换为数学相关 (v0.8.1)

| 文件 | 修改前 | 修改后 |
|------|--------|--------|
| `zh-CN.json` | 帛书版与通行本有何不同？ | 如何用老子智慧学好数学？ |
| `en-US.json` | How does the Mawangdui Silk Text differ... | How can Laozi's wisdom help me learn mathematics? |

---

## 任务六 — GitHub Tags 同步

### 问题根因
项目 `origin` 远端始终指向 `/workspace/center`（本地裸仓库），`git push origin` 从未推送到 GitHub。
GitHub 仓库（`xinetzone/dao-yan`）停留在 v0.6.1（`e2c6c650`），与本地 v0.8.1 完全独立的两套 git 历史。

### 修复步骤

1. **推送核心源码**（25 个文件，1 次 API 调用）
   - 通过 `github-push` 边缘函数创建 commit `932048f6`
   
2. **推送 81 章文档**（3 批次 × 30 文件）
   - Batch 1 (1-30): `45d3b4b1`
   - Batch 2 (31-60): `ef580ce9`
   - Batch 3 (61-82): `98b63427` ← 最终 HEAD

3. **创建 15 个注释标签**（通过 `github-tag` 边缘函数）
   - v0.6.2 → v0.8.1 + v1.0.0 + v1.1.0
   - 全部指向最终 HEAD `98b63427`，带中文说明消息

### 结果
GitHub Tags 页面现在显示完整标签列表（共 20 个），每个标签带有说明文字。

---

## 当前版本状态

```
本地 git（/workspace/center）:
  HEAD: 579f223 (v0.8.1)
  Tags: v0.6.2 → v0.8.1 + v1.x（注释标签）

GitHub（xinetzone/dao-yan）:
  HEAD: 98b63427 (docs: sync 帛书老子注读 batch 3)
  Tags: v0.5.0 → v0.8.1 + v1.x（共 20 个，注释标签）
  代码状态：与本地 v0.8.1 一致
```

---

## 经验与教训

| 经验 | 说明 |
|------|------|
| 轻量 vs 注释标签 | `git tag` = 轻量（无消息）；`git tag -a -m` = 注释（有消息，GitHub 展示） |
| CommonMark CJK 边界 | `**text[CJK标点]**[CJK字母]` → 闭合 `**` 不构成右侧限定符 → 预处理转 HTML 是最可靠修复 |
| SearXNG 公共实例 | 不可靠（经常被封），应直接用 DuckDuckGo HTML 解析 |
| 本地 git ≠ GitHub | 通过 `github-push` 边缘函数推送文件不更新 git 历史，两者是独立树 |
| ESLint no-control-regex | 正则中不能用 `\x01` 等控制字符，改用 Unicode 私用区 `\uE001` |
