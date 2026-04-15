# 全面复盘报告 — 道衍项目 2026-04-15

## 一、项目概览

**道衍（Dao Yan）**：一款结合传统道家智慧与现代 ψ=ψ(ψ) 万物理论的中文 AI 哲学助手
- GitHub: `xinetzone/dao-yan`
- 技术栈: React + Vite + TypeScript + Tailwind + Supabase Edge Functions
- 核心功能: AI 问答（道家知识库）、修行打卡、修炼指南、多语言（中/英）

---

## 二、本日完成工作（Phase 8–11）

### Phase 8 — 品牌词统一：仙师点拨 → 道衍回响

| 位置 | 旧文本 | 新文本 |
|---|---|---|
| AI system prompt | 你是一位高阶仙师 | 你是道衍，一面智慧镜子 |
| Loading 状态 | 仙师正在感应天机 | 道衍正在感应 |
| 结果标题 | 仙师点拨 / Master's Wisdom | 道衍回响 / Dao Yan's Reflection |
| 记录列表 | 查看点拨 / View Guidance | 查看回响 / View Reflection |
| 修行打卡说明 | 仙师给予专属点拨 | 道衍给予智慧回响 |

**文件**: `src/pages/CultivationPage.tsx`, `src/i18n/locales/zh-CN.json`

---

### Phase 9 — GitHub 推送基础设施

**根本问题**: Enter Pro workspace 无法直连外部 GitHub（git remote 仅指向内部 origin）

**解决方案**: 两个 Supabase Edge Functions

```
github-push: POST {owner,repo,branch,message,files[]}
  → 批量创建 blob(×10) → tree → commit → update ref

github-tag:  POST {owner,repo,tag,message,sha?}
  → 读 heads/main SHA → 创建 annotated tag
```

**关键技术点**:
- `git ls-files -z` 必须用 `-z`（null 分隔），否则中文文件名反斜杠转义，`os.path.exists` 失败
- Supabase URL: `spb-t4nnhrh7ch7j2940.supabase.opentrust.net`（非 kdbfhymnwktrmlftjnmx.supabase.co）
- `requests` 模块每次会话需重新 `pip install`（环境不持久）

---

### Phase 10 — 复制按钮 iframe 兼容修复

**根本原因**: 在 Perplexity iframe 内，`navigator.clipboard.writeText()` 被 Permission Policy 阻断

**修复**: `src/lib/utils.ts` 新增 `copyToClipboard(text)`:
```typescript
// 1. 先尝试 navigator.clipboard（现代浏览器）
// 2. fallback: position:fixed textarea + document.execCommand('copy')
```
**同步更新**: `ChatMessage.tsx`（已有自己的 fallback）、`MarkdownRenderer.tsx`（改用 copyToClipboard）

---

### Phase 11 — 帛书老子注读 PDF → 82 Markdown 文件

**来源**: PDF 297页，4.1MB，OSS key `resources/uid_100032143/2883.pdf`
**CDN URL**: `https://cdn.enter.pro/resources/uid_100032143/2883.pdf`

**章节检测三次迭代**:

| 版本 | 方法 | 结果 | 问题 |
|---|---|---|---|
| v1 | `re.finditer(r'（.+?）（今\d+章）')` 全文 | 51章 | TOC 假阳性 |
| v2 | 从第12页起限定 | 74章 | 整十章（20/30…80）跨页拆行漏检 |
| v3 | `re.finditer(cn+'、')` + 200字内确认`帛书版` | **81章 ✅** | — |

**根本原因**: 整十章节恰好在 PDF 新页面顶部，行结构 `二十、标题（今57\n章）`，`章）`跨行

**输出**:
```
docs/帛书老子注读/
├── index.md          ← 双表格索引（德经+道经）
├── 德经/001_一.md … 044_四十四.md   (44章)
└── 道经/045_四十五.md … 081_八十一.md (37章)
```

---

### Phase 12 — 持久化脚本（本次新增）

**背景**: Enter Pro workspace 每次对话重置到 `9fbb29c`，工作内容丢失

**解决**: 将所有工作存为项目内可执行脚本：

| 文件 | 功能 | 用法 |
|---|---|---|
| `scripts/restore.sh` | 一键恢复全部变更 | `bash scripts/restore.sh` |
| `scripts/github-push.py` | 推送全量文件到 GitHub | `python3 scripts/github-push.py [msg]` |
| `scripts/github-tag.py` | 在 GitHub 创建 tag | `python3 scripts/github-tag.py v0.3.0 [msg]` |
| `scripts/pdf2md.py` | PDF → 82 Markdown | `python3 scripts/pdf2md.py` |

---

## 三、完整变更文件清单

| 文件 | 类型 | 内容 |
|---|---|---|
| `src/lib/utils.ts` | 修改 | `copyToClipboard()` iframe-safe 工具函数 |
| `src/components/MarkdownRenderer.tsx` | 修改 | 使用 `copyToClipboard()` |
| `src/components/ChatMessage.tsx` | 未改 | 已有自己的 fallback |
| `src/pages/CultivationPage.tsx` | 修改 | 仙师 → 道衍品牌词 × 5处 |
| `src/i18n/locales/zh-CN.json` | 修改 | 品牌词同步 |
| `supabase/functions/github-push/index.ts` | 新建 | Edge Function |
| `supabase/functions/github-tag/index.ts` | 新建 | Edge Function |
| `scripts/restore.sh` | 新建 | 一键恢复 |
| `scripts/github-push.py` | 新建 | GitHub 推送 |
| `scripts/github-tag.py` | 新建 | GitHub Tag |
| `scripts/pdf2md.py` | 新建 | PDF 转 Markdown |
| `docs/帛书老子注读/index.md` | 新建 | 章节索引 |
| `docs/帛书老子注读/德经/*.md` | 新建 | 44章 |
| `docs/帛书老子注读/道经/*.md` | 新建 | 37章 |
| `.enter/MEMORY_SESSION_2026-04-14.md` | 更新 | Phase 8-11 |
| `.enter/REVIEW_SESSION_2026-04-15B.md` | 新建 | 复盘报告B |
| `.enter/REVIEW_SESSION_2026-04-15C.md` | 新建 | 本文件（全面复盘）|

---

## 四、技术积累（防坑清单）

| 坑 | 原因 | 解决 |
|---|---|---|
| `read_remote_file` PDF 报错 | pdfcpu 不支持 SMask | 改用 PyMuPDF，从 cdn.enter.pro 下载 |
| git ls-files 中文乱码 | 默认反斜杠转义 | 加 `-z` 参数 |
| GitHub push Supabase URL 错误 | 两个 URL 混用 | 用 `spb-t4nnhrh7ch7j2940.supabase.opentrust.net` |
| requests 每次不可用 | pip 环境不持久 | 脚本开头加 auto-install |
| 整十章节漏检 | 跨页拆行 | 改为子串搜索 + 近距确认 |
| clipboard 在 iframe 失效 | Permission Policy | 双重 fallback（clipboard + execCommand）|
| workspace 每次回滚 | Enter Pro 平台行为 | 所有变更存为脚本，`bash scripts/restore.sh` |

---

## 五、当前项目状态

- **GitHub**: `xinetzone/dao-yan` main 分支 217+ 文件
- **Git log HEAD**: Phase 12 restore scripts commit
- **待做**: 无明确遗留任务
- **可选**: 将 `docs/帛书老子注读/` 内容集成到 App 文档面板 UI

---

*本报告由道衍 AI 自动生成 — 2026-04-15*
