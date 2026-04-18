# 道衍 (Dao Yan)

<div align="center">

**陪你问道的智慧伙伴 — 让古老道法，衍化于今日生活**

**[English README](README-EN.md) | [中文](#chinese)**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-blue)](https://react.dev/)

</div>

---

<a id="chinese"></a>

## 项目简介

道衍，陪你问道的智慧伙伴。以帛书版《道德经》为根基，在你困惑时用道家智慧照见本质，在你焦虑时陪你回归内心清明。不是解读经典的学术工具，而是与你一起问道、在修行中体悟的智慧镜子。独特融合：

- **帛书版《道德经》** 的无为而治哲学
- **佛家禅修** 的直心与如如不动智慧
- **ψ=ψ(ψ) 万物理论** 的崩塌宇宙观（AllTheory）
- **多模型 AI** 驱动的智能对话（Claude Sonnet 4.5 / Opus 4.7 / GPT 5.4 / Gemini 3.1 Pro / GLM 5）

### 核心理念

> "道，可道也，非恒道也。" — 帛书版《道德经》

---

## 核心特性

### AI 深度研究
- **中国古典学术风 UI** — 暖米色宣纸底、朱红强调色、手绘风卡片
- **多模型切换** — 搜索栏下拉选择 AI 模型（Claude / GPT / Gemini / GLM）
- **流式响应** — 实时显示 AI 思考过程，支持中途停止生成
- **智能上下文管理** — 自动裁剪过长对话历史（保留最近 20 条），max_tokens 8192
- **Markdown 富文本渲染** — 代码高亮、表格、引用、一键复制（基于 marked + highlight.js）
- **来源引用** — 联网搜索结果以带 favicon 的卡片形式展示
- **消息操作** — 复制 AI 回复、重新生成最后一条回复
- **深/浅色模式** — 侧边栏一键切换，localStorage 持久化

### 智能联网搜索
- **可选联网** — 搜索栏工具栏一键启用
- **双层容错搜索** — DuckDuckGo HTML → DuckDuckGo Lite
- **搜索进度反馈** — 联网时显示"正在联网搜索..."进度提示
- **自动内容注入** — 搜索结果作为 system context 传递给 AI，附引用卡片展示

### 对话增强
- **输入框自动伸缩** — 1 行起步，随输入内容增高至最多 6 行
- **停止生成按钮** — AI 回复过程中可随时中断（红色 Stop 图标）
- **回到底部按钮** — 向上滚动时出现悬浮按钮，一键跳到最新消息
- **分类问题过滤** — 点击话题标签过滤展示对应问题，再次点击复位

### 文档集合系统
- **本地文件上传** — 支持 TXT、MD、HTML、JSON、CSV、XML、YAML
- **网址内容抓取** — 一键获取网页文本
- **智能上下文管理** — 文档内容自动作为对话背景
- **多集合支持** — 分类管理不同主题的文档

### 修炼打卡系统
个人成长游戏化系统，暖色学术主题风格：
- **10 个修炼境界** — 从凡人到真仙的进阶之路
- **4 种心境状态** — 通透、宁静、波动、纷乱
- **5 星无为指数** — 量化你的无为境界
- **AI 仙师指导** — 基于修行状态的个性化点拨（Markdown 渲染）
- **新手教程** — 5 步互动引导 + 50 悟道点礼包
- **连续打卡奖励** — 连续天数越多奖励越高

### 国际化
- **中英文双语** — 完整界面翻译
- **语言感知 AI 回复** — 自动将 locale 传递给 AI，回复语言跟随界面语言
- **道衍提示词** — 原文解读、版本对比、思想阐发、生活应用（每类 2 题）
- **自动检测** — 根据浏览器语言自动切换

### Agent API & MCP Server
- **REST Agent API** — 一个接口即可接入道衍智慧，支持流式/非流式、多轮对话、联网搜索
- **MCP Server** — 实现 Model Context Protocol (JSON-RPC 2.0)，兼容 Claude Desktop、Cursor、Trae 等
- **3 个 MCP 工具** — `ask_daoyan`（提问）、`search_chapters`（搜索章节）、`get_chapter`（获取章节）
- **API 文档页** — 内置完整使用指南、cURL/JS 示例、MCP 配置方法（`/api-docs`）

---

## 快速开始

### 前置要求

- Node.js 18+
- pnpm 8+

### 安装

```bash
git clone https://github.com/xinetzone/dao-yan.git
cd dao-yan
pnpm install
pnpm dev
```

访问 `http://localhost:5173`

---

## 项目架构

### 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | React 19.1 + TypeScript 5.9 | Vite 7 构建 |
| UI | Tailwind CSS + shadcn/ui + Lucide | 统一暖色学术主题 |
| Markdown | marked + highlight.js + DOMPurify | 富文本渲染 + XSS 防护 |
| 路由 | React Router v7 | 声明式路由（模块级定义） |
| 国际化 | i18next + react-i18next | 中英双语 + locale 传 AI |
| 后端 | Supabase Edge Functions (Deno) | AI 聊天、搜索、Agent API、MCP |
| AI | 多模型（Claude / GPT / Gemini / GLM） | 流式响应 + 可中断 + 模型切换 |
| 搜索 | DuckDuckGo（双层容错） | 结果注入 system context |
| 存储 | localStorage | 修炼数据 + 深色模式持久化 |

### 目录结构

```
dao-yan/
├── src/
│   ├── components/
│   │   ├── ChatMessage.tsx          # 消息组件（复制/重生成/来源卡片）
│   │   ├── MarkdownRenderer.tsx     # marked 渲染器（高亮/复制/XSS）
│   │   ├── SearchBar.tsx            # 搜索栏（自动伸缩/停止按钮/工具栏）
│   │   ├── SuggestedPrompts.tsx     # 分类标签过滤 + 8 个道衍问题
│   │   ├── ThemeToggle.tsx          # 深/浅色模式切换（侧边栏）
│   │   ├── NavigationSidebar.tsx    # 左侧导航栏
│   │   ├── DocumentPanel.tsx        # 文档管理面板
│   │   ├── LanguageSwitcher.tsx     # 语言切换器
│   │   └── ui/                      # shadcn/ui 基础组件
│   ├── hooks/
│   │   ├── useAIChat.ts             # AI 聊天（SSE + 停止 + 搜索）
│   │   ├── useCultivation.ts        # 修炼系统（境界/打卡/积分）
│   │   └── useDocumentCollections.ts
│   ├── lib/
│   │   └── theme.ts                 # 主题工具（getStoredTheme/applyTheme/initTheme）
│   ├── i18n/locales/                # zh-CN.json / en-US.json
│   ├── pages/
│   │   ├── Index.tsx                # 主页（英雄卡/聊天/滚动到底）
│   │   ├── CultivationPage.tsx      # 修炼（打卡/教程/记录）
│   │   ├── DaodejingPage.tsx        # 帛书老子（81 章浏览）
│   │   └── ApiDocsPage.tsx          # API & MCP 文档页
│   └── index.css                    # 统一暖色设计令牌 + 自定义 CSS 系统
├── supabase/functions/
│   ├── ai-chat-*/                   # AI 聊天 + 联网搜索 + 多模型 + 空流重试
│   ├── daoyan-agent-api/            # Agent REST API（流式/非流式/多轮）
│   ├── daoyan-mcp/                  # MCP Server（JSON-RPC 2.0）
│   ├── fetch-url-content/           # URL 内容抓取（8s 超时）
│   └── web-search/                  # 搜索（已并入 ai-chat）
└── .enter/                          # 复盘报告 + 平台配置
```

### CSS 类系统（index.css）

| 类名 | 用途 |
|------|------|
| `dao-card` / `dao-tape` | 手绘粗边框卡片 + 胶带装饰 |
| `dao-tag` | 暖黄药丸标签（点击选中变朱红） |
| `dao-question` | 圆角问题卡片（2 列网格） |
| `dao-float-square` | 浮动装饰方块（4 个位置） |
| `dao-markdown` | 全套 Prose 样式（标题/列表/代码/表格/引用） |
| `cult-*` | 修炼系统组件（进度条/心境卡/按钮发光/统计） |
| `hljs-*` | 代码高亮颜色覆盖（浅色 + 深色） |

---

## 接入 Trae IDE

[Trae](https://www.trae.ai/) 是字节跳动出品的 AI IDE，原生支持 MCP 协议。只需 3 步即可在 Trae 中使用道衍：

### 1. 创建配置文件

在项目根目录（或用户级 `~/.trae/`）创建 `.trae/mcp.json`：

```json
{
  "mcpServers": {
    "daoyan": {
      "url": "https://spb-t4nnhrh7ch7j2940.supabase.opentrust.net/functions/v1/daoyan-mcp",
      "headers": {
        "Authorization": "Bearer <YOUR_ANON_KEY>"
      }
    }
  }
}
```

> **获取 Anon Key**：访问应用内 [API & MCP 文档页](/api-docs) 查看完整配置（含真实 key）。

### 2. 重启 Trae

保存文件后重启 Trae IDE，MCP 面板中会出现 `daoyan` 服务器及 3 个工具。

### 3. 开始使用

在 Trae 对话中直接提问即可自动调用：

- _"帮我问问道衍，如何理解无为而治？"_ → 调用 `ask_daoyan`
- _"搜索帛书中关于水的章节"_ → 调用 `search_chapters`
- _"获取帛书第52章内容"_ → 调用 `get_chapter`

> 更多 IDE 配置（Cursor / Claude Desktop）及 REST API 文档详见 [`/api-docs`](https://167c2bc1450e4ea3a0dc4b07c5873069-latest.preview.enter.pro/api-docs) 页面。

---

## 修炼系统

### 10 个境界

| 境界 | 悟道点 | 含义 |
|------|--------|------|
| 凡人 | 0 | 尚未修行 |
| 炼气 | 50 | 初凝灵气 |
| 筑基 | 200 | 根基渐稳 |
| 金丹 | 600 | 凝结金丹 |
| 元婴 | 1,500 | 元婴初成 |
| 化神 | 4,000 | 神魂归一 |
| 合体 | 12,000 | 天人合一 |
| 大乘 | 40,000 | 大道现前 |
| 渡劫 | 120,000 | 历尽天劫 |
| 真仙 | 360,000 | 超脱轮回 |

### 积分计算

```
总积分 = 基础 10 点
       + 心境奖励 (3-15)
       + 无为指数 × 4 (0-20)
       + 道场感应 10 点
       + 心言奖励 (0-8)
       + 连续天数 × 2 (最高 20)
```

---

## 开发

```bash
pnpm install    # 安装依赖
pnpm dev        # 开发服务器
pnpm lint       # 代码检查（ESLint 0 错误）
pnpm build      # 生产构建
```

---

## 开源协议

MIT License — 详见 [LICENSE](LICENSE)

---

## 致谢

- [React](https://react.dev/) / [TypeScript](https://www.typescriptlang.org/) / [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/) / [shadcn/ui](https://ui.shadcn.com/) / [Lucide](https://lucide.dev/)
- [marked](https://marked.js.org/) / [highlight.js](https://highlightjs.org/) / [DOMPurify](https://github.com/cure53/DOMPurify)
- [SearXNG](https://searxng.org/) / [DuckDuckGo](https://duckduckgo.com/)
- [i18next](https://www.i18next.com/) / [Anthropic Claude](https://www.anthropic.com/)

---

<div align="center">

**愿你在修炼之路上，证得本心，逍遥自在**

</div>

---

<a id="english"></a>

# Dao Yan (道衍)

**Your Wise Companion on the Path of Dao — Ancient wisdom flowing into everyday life**

## Overview

Dao Yan is your wise companion on the path of Dao. Rooted in the Mawangdui Silk Text Dao De Jing, it uses Daoist wisdom to help you see through confusion and return to inner stillness. Not an academic tool for interpreting classics, but a reflective mirror that walks the path of Dao alongside you. Uniquely combining:

- **Daoist philosophy** (Wu Wei — action through non-action)
- **Buddhist mindfulness** wisdom
- **ψ=ψ(ψ) Theory of Everything** collapse cosmology (AllTheory)
- **Modern AI** (Claude Sonnet 4.5 / Opus 4.7 / GPT 5.4 / Gemini 3.1 Pro / GLM 5) driven dialogue

> "The Way that can be told is not the eternal Way." — Mawangdui Silk Text

## Key Features

**AI Research**
- Chinese scholarly aesthetic UI (warm cream paper, cinnabar red, sketch-border cards)
- Multi-model selector (Claude / GPT / Gemini / GLM) in the search toolbar
- Streaming responses with real-time thinking display; stop anytime
- Smart context management — auto-trims long history (keeps last 20), max_tokens 8192
- Markdown rendering with syntax highlight, copy buttons, tables (marked + highlight.js)
- Source citation cards with favicons from web search results
- Copy & regenerate buttons on AI messages

**Web Search**
- One-click web toggle in toolbar
- 2-layer fallback: DuckDuckGo HTML → DuckDuckGo Lite
- Search progress indicator while fetching
- Results injected as system context with source citation cards

**Chat UX**
- Auto-growing textarea (1–6 rows)
- Stop generation button during streaming
- Scroll-to-bottom button when scrolled up
- Category tag filtering for suggested prompts

**Document Collections**
- File upload (TXT, MD, HTML, JSON, CSV, XML, YAML)
- URL content fetching
- Multi-collection management with context activation

**Cultivation System**
- 10 cultivation realms (Mortal → True Immortal)
- Daily check-in with mood tracking & Wu Wei score
- AI master guidance per session (Markdown rendered)
- Interactive 5-step tutorial + welcome gift

**Internationalization**
- Full Chinese/English UI with locale-aware AI responses
- Browser language auto-detection

**Agent API & MCP Server**
- REST Agent API — single endpoint to access Daoyan wisdom (stream/non-stream, multi-turn, web search)
- MCP Server — Model Context Protocol (JSON-RPC 2.0), compatible with Claude Desktop, Cursor, Trae, etc.
- 3 MCP Tools — `ask_daoyan`, `search_chapters`, `get_chapter`
- Built-in API docs page at `/api-docs` with cURL/JS examples and MCP configs

## Tech Stack

React 19.1 + TypeScript 5.9 + Vite 7 · Tailwind CSS + shadcn/ui · marked + highlight.js · React Router v7 · i18next · Supabase Edge Functions (Deno) · Multi-model AI (Claude / GPT / Gemini / GLM) SSE · MCP Server

## Quick Start

```bash
git clone https://github.com/xinetzone/dao-yan.git
cd dao-yan
pnpm install && pnpm dev
```

## License

MIT
