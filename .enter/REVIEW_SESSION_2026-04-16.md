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
| 删功能必查引用 | 删除组件的同时必须 `grep` 搜索该 import 是否还被其他地方使用 |

---

## 补充：下午场（v0.8.2）

### 新增 Commits

| Commit | 内容 |
|--------|------|
| `206cdc8` | v0.8.2：移除侧边栏"修炼指南"按钮（已整合至修行打卡） |
| `8f5e445` | hotfix：补回 `BookOpen` 导入（侧边栏帛书老子按钮仍在使用） |

### 问题详情

**移除修炼指南按钮（v0.8.2）**

- `NavigationSidebar.tsx`：删除修炼指南 `<Button>` 块 + `Badge` import + `useCultivation` hook 调用
- **失误**：同时误删了 `BookOpen` import，而 `BookOpen` 还被第 49 行的"帛书老子"导航按钮使用
- **错误表现**：`ReferenceError: BookOpen is not defined` → React Router ErrorBoundary 整页崩溃
- **修复**：`hotfix` 补回 `BookOpen` 至 lucide-react import

### 测试结果

| 测试项 | 结果 |
|--------|------|
| `BookOpen is not defined` 崩溃 | ✅ 已修复，lint 无错 |
| `/daodejing/49` `<p>` 嵌套警告 | ✅ 为 v0.7.3 之前的旧错误，当前代码已使用 `<div>` |
| 联网搜索（DDG）| ✅ 正常返回真实 URL 结果 |
| CJK 粗体渲染 | ✅ `preprocessMarkdown` 正确转换 `<strong>` |
| 侧边栏 | ✅ 仅保留：帛书老子 / 修行打卡，无重复入口 |

### 当前版本

```
latest: v0.8.2（本地 git + GitHub 均同步）
```

---

## 补充：晚场（v0.8.3 — 文档上下文 Bug 修复）

### 本轮任务清单

| # | 任务 | 结果 |
|---|------|------|
| 1 | 删除 GitHub 无效标签 v1.0.0 / v1.1.0 | ✅ |
| 2 | 测试"文档"组件是否真正注入上下文 | ✅ 功能链路完整，但发现 2 个 Bug |
| 3 | Bug 修复：MAX_SYSTEM_LENGTH 20k→200k | ✅ v0.8.3 |
| 4 | Bug 修复：用户文档标签错误 | ✅ v0.8.3 |
| 5 | github-tag 函数新增 delete 支持 | ✅ |

---

### 任务 1 — 删除 GitHub 无效标签

**背景**：v1.0.0 / v1.1.0 是上轮批量重建标签时提前打上的，代码实际只到 v0.8.x，标签误导用户。

**操作**：
1. 发现 `github-tag` 函数不支持 delete，请求返回 500
2. 新建 `github-delete-tags` 边缘函数，专门处理 DELETE `/git/refs/tags/{name}`
3. 调用成功：`{'results': [{'tag':'v1.0.0','status':'deleted'},{'tag':'v1.1.0','status':'deleted'}]}`
4. 同步删除本地 git 标签：`git tag -d v1.0.0 v1.1.0`

**顺带改进**：同时更新 `github-tag` 函数支持 `action: delete`，但发现 Supabase 边缘函数有**部署缓存问题**——重新部署后旧代码仍在运行（缺少 `v: 2` 标识），最终用新函数名绕过。

---

### 任务 2 — 文档组件上下文注入测试

**完整链路验证**：

```
DocumentPanel（上传/URL）
  → useDocumentCollections.getCollectionContext()   ← 组装文档内容
    → Index.tsx sendMessage(..., docContext)
      → useAIChat.ts DAOYAN_SYSTEM_WITH_DOCS(docContext) → system 字段
        → ai-chat 边缘函数  ← 注入到 Claude 系统提示
```

测试 `fetch-url-content` 函数：抓取 Wikipedia 页面返回 **50,035 字符** ✅

**发现 Bug 1（高危）**：
- `MAX_SYSTEM_LENGTH = 20000`
- 基础系统提示（含帛书语料）已占 ~12,000 chars
- 可用文档空间仅剩 ~8,000 chars
- Wikipedia 50,035 chars → **必定 400 报错**

**发现 Bug 2（中危）**：
- `DAOYAN_SYSTEM_WITH_DOCS` 标签写的是 "当前阅读章节（最高优先级 — 直接来自帛书老子注读原文）"
- 这个标签设计给 DaodejingPage 章节上下文用
- 用户上传的外部文档使用同一函数，AI 会误以为内容是帛书章节

---

### 任务 3 & 4 — v0.8.3 双 Bug 修复

**Fix 1** — `supabase/functions/ai-chat-167c2bc1450e/index.ts`：
```typescript
// 修改前
const MAX_SYSTEM_LENGTH = 20000;
// 修改后
const MAX_SYSTEM_LENGTH = 200000;  // raised to support large user document contexts
```

**Fix 2** — `src/data/system-prompt.ts`，新增专用函数：
```typescript
/** 用户通过"文档"功能上传的外部参考资料 */
export const DAOYAN_SYSTEM_WITH_USER_DOCS = (documentContext: string) =>
  `${DAOYAN_SYSTEM_PROMPT}

## 用户上传的参考文档（最高优先级）
用户已上传以下外部资料作为本次对话的参考上下文。请优先基于这些文档内容回答问题，同时可结合帛书老子的智慧加以阐发：

${documentContext}`;
```

**Fix 3** — `src/hooks/useAIChat.ts`：
```typescript
// 修改前：DAOYAN_SYSTEM_WITH_DOCS(documentContext)
// 修改后：DAOYAN_SYSTEM_WITH_USER_DOCS(documentContext)
```

---

### 新增经验与教训

| 经验 | 说明 |
|------|------|
| Supabase 函数部署缓存 | 重新部署后可能仍运行旧版本，用新函数名绕过是可靠方法 |
| 安全上限需考虑实际用途 | `MAX_SYSTEM_LENGTH=20000` 对"文档上下文"场景完全不够，设置时须结合最坏场景（大型网页） |
| 标签语义隔离 | 同一函数不应混用于语义不同的场景（帛书章节 ≠ 用户外部文档），需分别命名 |
| 功能测试要真实执行 | 代码链路看起来通，但不实际测试边界值（大文档）不会发现 400 bug |

---

### 当前版本

```
latest: v0.8.3（本地 git + GitHub 均同步）
GitHub Tags: v0.6.2 ~ v0.8.3（共 16 个注释标签，v1.0.0/v1.1.0 已删除）
```
