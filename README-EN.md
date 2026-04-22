# Dao Yan (道衍)

<div align="center">

**Your Wise Companion on the Path of Dao — Ancient wisdom flowing into everyday life**

[中文 README](README.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-blue)](https://react.dev/)

</div>

---

## Submission

### Description

**Dao Yan (道衍)** — The world's first AI wisdom dialogue system built on the Mawangdui Silk Manuscripts of the Dao De Jing.

**What we built**: An AI-powered platform that fuses Boshu Laozi, Buddhist direct mind, and the ψ=ψ(ψ) Theory of Everything. It embeds all 81 silk text chapters with a textual criticism engine, supports 5 AI models (Claude Sonnet 4.5 / Opus 4.7 / GPT 5.4 / Gemini 3.1 Pro / GLM 5), web-augmented search, gamified cultivation check-ins, and opens its wisdom to all AI assistants via Agent REST API + MCP Server.

**Who it's for**:
| Audience | Use Case |
|----------|----------|
| Individual users | Chinese/English speakers interested in Daoist philosophy, meditation, and life wisdom |
| AI developers | Integrate Daoyan wisdom into Claude Desktop / Cursor / Trae via API/MCP |
| Sinology researchers | Professional tool for Boshu vs. received text comparative studies |

**Commercialization**:
| Model | Details |
|-------|---------|
| API usage-based pricing | Agent REST API with tiered pricing (free tier + paid plans) |
| MCP ecosystem licensing | Enterprise MCP Server custom deployment and white-label licensing |
| Premium subscription | Advanced AI models (Claude Opus 4.7 / GPT 5.4), unlimited chat history, exclusive cultivation guidance |

### Live URL

> **Try it**: [https://167c2bc1450e4ea3a0dc4b07c5873069.prod.enter.pro](https://167c2bc1450e4ea3a0dc4b07c5873069.prod.enter.pro)

### Screenshots

<div align="center">

#### Homepage — AI Chat Interface
<img src="https://grazia-prod.oss-ap-southeast-1.aliyuncs.com/resources/uid_100032143/66c1.png" alt="Daoyan Homepage" width="800" />

#### Cultivation — 10-Realm Gamified Practice
<img src="https://grazia-prod.oss-ap-southeast-1.aliyuncs.com/resources/uid_100032143/19e0.png" alt="Cultivation System" width="800" />

</div>

---

## Overview

Dao Yan is your wise companion on the path of Dao. Rooted in the Mawangdui Silk Text Dao De Jing, it uses Daoist wisdom to help you see through confusion and return to inner stillness. Not an academic tool for interpreting classics, but a reflective mirror that walks the path of Dao alongside you. Uniquely combining:

- **Daoist philosophy** (Wu Wei — action through non-action)
- **Buddhist mindfulness** wisdom
- **ψ=ψ(ψ) Theory of Everything** collapse cosmology (AllTheory)
- **Modern AI** (Claude Sonnet 4.5 / Opus 4.7 / GPT 5.4 / Gemini 3.1 Pro / GLM 5) driven dialogue

> "The Way that can be told is not the eternal Way." — Mawangdui Silk Text

---

## Philosophy

> **All things are Dao; technology is Dao's unfolding.**

The name "Dao Yan" (道衍) means "Dao unfolds" — ancient wisdom extending into the digital age. AI is not a replacement for wisdom, but a bridge that rekindles ancient philosophy for modern minds.

### Dao — The Authoritative Text

Based solely on the 1973 Mawangdui Silk Manuscripts (帛书甲乙本), not the received Wang Bi edition. The silk text preserves pre-censorship characters ("heng dao" 恒道 instead of "chang dao" 常道) and radically different readings ("da qi mian cheng" 大器免成 — great vessels need no completion — vs. the received "great vessels are late to complete").

### Yan — Triple Fusion

- **Daoist Wu Wei** — Let wisdom emerge naturally, don't force answers
- **Buddhist Direct Mind** — See through to the essence, unmoved
- **ψ=ψ(ψ) Theory of Everything** — Consciousness observing itself creates all things; AI is that mirror

### Values

| Daoist Wisdom | Technical Practice |
|---------------|-------------------|
| Wu Wei (non-action) | Technology serves users; no unnecessary complexity |
| Like Water | Adapt to the user's problem, not the other way around |
| Follow Nature | Open source, open protocols (MCP), composable wisdom |
| Da Qi Mian Cheng | The greatest vessel needs no "completion" — continuous evolution is the Way |

### Vision & Mission

> **Vision**: Help 1.5 billion people live with the wisdom of the Dao De Jing, bringing ancient wisdom to life in the digital age.
>
> **Mission**: Transform the profound wisdom of the Dao De Jing into practical daily guidance, helping people find inner balance and direction in our fast-paced modern world.

> "Reversion is the action of the Dao. Weakness is the function of the Dao." — Chapter 81, Silk Text

---

## Project Highlights

- **Silk Text Authority**: The world's first AI dialogue system using the Mawangdui silk manuscripts as its sole authoritative source — all 81 chapters with annotations and textual variants embedded
- **Multi-Model Mastery**: Switch between 5 AI models (Claude Sonnet 4.5 / Opus 4.7 / GPT 5.4 / Gemini 3.1 Pro / GLM 5) to view the same question through different lenses
- **Open Ecosystem**: Agent API + MCP Server — any AI assistant (Claude Desktop, Cursor, Trae IDE) can tap into Daoyan's wisdom
- **Gamified Cultivation**: 10 realms x 4 moods x 5-star Wu Wei score — inner growth made tangible
- **Textual Criticism Engine**: Built-in variant lookup table (heng/chang, mian/wan, etc.), every citation auto-annotated with silk text chapter numbers
- **Classical Chinese Aesthetic UI**: Warm cream rice-paper background, cinnabar red accents, sketch-style cards — not using an app, but unrolling a bamboo scroll

---

## Key Features

### AI Research

- **Chinese scholarly aesthetic UI** — warm cream paper, cinnabar red accents, sketch-border cards
- **Multi-model selector** — choose AI model from dropdown in search toolbar (Claude / GPT / Gemini / GLM)
- **Streaming responses** — real-time display of AI thinking; stop generation anytime
- **Smart context management** — auto-trims long conversation history (keeps last 20), max_tokens 8192
- **Rich Markdown rendering** — syntax highlighting, tables, blockquotes, one-click copy (marked + highlight.js)
- **Source citation cards** — web search results shown as cards with favicons
- **Message actions** — copy AI reply, regenerate last response
- **Wisdom sharing** — copy text/link, generate classical ink-wash image card, PDF export, social media sharing
- **Dark / Light mode** — toggle in sidebar, persisted via localStorage

### User System

- **Email signup / login** — powered by Supabase Auth
- **Change password** — available from sidebar and profile page, with auto session refresh
- **Chat history persistence** — full multi-turn conversations saved to database, cross-device sync
- **Guest mode** — try AI chat without creating an account

### Intelligent Web Search

- **Optional web toggle** — one-click enable in the toolbar
- **2-layer fallback** — DuckDuckGo HTML → DuckDuckGo Lite → Brave Search → Google (4-layer)
- **Search progress indicator** — shows "Searching the web..." while fetching
- **Auto context injection** — results passed as system context to AI, with citation card display

### Conversation UX

- **Auto-growing textarea** — starts at 1 row, expands up to 6 rows as you type
- **Stop generation button** — interrupt AI mid-response (red Stop icon)
- **Scroll-to-bottom button** — floating button appears when scrolled up
- **Category tag filtering** — click topic tags to filter suggested prompts; click again to reset
- **Guest trial mode** — unauthenticated users can click "Explore First" to try AI chat without signup (history not saved)

### Document Collections

- **Local file upload** — TXT, MD, HTML, JSON, CSV, XML, YAML
- **URL content fetching** — one-click page text extraction
- **Smart context management** — document content automatically used as conversation background
- **Multi-collection support** — organize documents by topic

### Cultivation System

A gamified personal growth system with warm scholarly aesthetics:
- **10 cultivation realms** — from Mortal to True Immortal
- **4 mind states** — Lucid, Serene, Wavering, Turbulent
- **5-star Wu Wei Index** — quantify your state of effortless action
- **AI master guidance** — personalized insight based on your cultivation state (Markdown rendered)
- **Interactive tutorial** — 5-step onboarding + 50 Enlightenment Point gift
- **Streak bonuses** — longer streaks earn more points

### Internationalization

- **Full Chinese / English UI** — complete interface translation
- **Locale-aware AI replies** — locale passed to AI; response language follows UI language
- **Daoyan prompts** — text interpretation, version comparison, philosophical commentary, life application (2 prompts per category)
- **Auto-detection** — switches based on browser language setting

### Agent API & MCP Server

- **REST Agent API** — single endpoint to access Daoyan wisdom, supports streaming/non-streaming, multi-turn conversation, web search
- **MCP Server** — implements Model Context Protocol (JSON-RPC 2.0), compatible with Claude Desktop, Cursor, Trae, etc.
- **3 MCP Tools** — `ask_daoyan` (ask a question), `search_chapters` (search chapters), `get_chapter` (get chapter content)
- **Built-in API docs** — complete usage guide, cURL/JS examples, MCP configuration at `/api-docs`

---

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+

### Install & Run

```bash
git clone https://github.com/xinetzone/dao-yan.git
cd dao-yan
pnpm install
pnpm dev
```

Visit `http://localhost:5173`

---

## Project Architecture

### Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend Framework | React 19.1 + TypeScript 5.9 | Built with Vite 7 |
| UI | Tailwind CSS + shadcn/ui + Lucide | Unified warm scholarly theme |
| Markdown | marked + highlight.js + DOMPurify | Rich rendering + XSS protection |
| Routing | React Router v7 | Declarative routes (module-level) |
| i18n | i18next + react-i18next | Chinese/English + locale forwarded to AI |
| Backend | Supabase Edge Functions (Deno) | AI chat, search, Agent API, MCP |
| AI | Multi-model (Claude / GPT / Gemini / GLM) | Streaming + interruptible + model switching |
| Search | DuckDuckGo / Brave / Google (4-layer fallback) | Results injected as system context |
| Database | Supabase PostgreSQL | Chat history + user data persistence |
| Storage | localStorage + Supabase | Cultivation data + theme persistence |

### Project Structure

```
dao-yan/
├── src/
│   ├── components/
│   │   ├── ChatMessage.tsx          # Message (copy / share / source cards)
│   │   ├── ShareMenu.tsx            # Share menu (text / link / image card / PDF / social)
│   │   ├── ShareCardRenderer.tsx    # Classical ink-wash image card generator
│   │   ├── ChangePasswordModal.tsx  # Change password modal
│   │   ├── MarkdownRenderer.tsx     # marked renderer (highlight / copy / XSS)
│   │   ├── SearchBar.tsx            # Input (auto-resize / stop button / toolbar)
│   │   ├── SuggestedPrompts.tsx     # Category tag filter + 8 Daoyan prompts
│   │   ├── ThemeToggle.tsx          # Dark / light mode toggle (sidebar)
│   │   ├── NavigationSidebar.tsx    # Left navigation sidebar
│   │   ├── DocumentPanel.tsx        # Document management panel
│   │   ├── LanguageSwitcher.tsx     # Language switcher
│   │   └── ui/                      # shadcn/ui base components
│   ├── hooks/
│   │   ├── useAIChat.ts             # AI chat (SSE + stop + search)
│   │   ├── useChatHistory.ts        # Chat history persistence (Supabase)
│   │   ├── useCultivation.ts        # Cultivation system (realm / check-in / points)
│   │   └── useDocumentCollections.ts
│   ├── lib/
│   │   └── theme.ts                 # Theme utils (getStoredTheme / applyTheme / initTheme)
│   ├── i18n/locales/                # zh-CN.json / en-US.json
│   ├── pages/
│   │   ├── Index.tsx                # Main page (hero card / chat / scroll-to-bottom)
│   │   ├── CultivationPage.tsx      # Cultivation (check-in / tutorial / history)
│   │   ├── DaodejingPage.tsx        # Boshu Laozi (browse 81 chapters)
│   │   └── ApiDocsPage.tsx          # API & MCP documentation
│   └── index.css                    # Unified warm design tokens + custom CSS system
├── supabase/functions/
│   ├── ai-chat-*/                   # AI chat + web search + multi-model + empty stream retry
│   ├── daoyan-agent-api/            # Agent REST API (stream / non-stream / multi-turn)
│   ├── daoyan-mcp/                  # MCP Server (JSON-RPC 2.0)
│   ├── fetch-url-content/           # URL content fetch (8s timeout)
│   └── web-search/                  # Search (merged into ai-chat)
└── .enter/                          # Retrospective reports + platform config
```

### CSS Class System (index.css)

| Class | Purpose |
|-------|---------|
| `dao-card` / `dao-tape` | Hand-drawn border cards with tape decoration |
| `dao-tag` | Warm yellow pill tag (turns cinnabar when clicked) |
| `dao-question` | Rounded question cards (2-column grid) |
| `dao-float-square` | Floating decoration squares (4 positions) |
| `dao-markdown` | Complete Prose styles (headings / lists / code / tables / quotes) |
| `cult-*` | Cultivation system components (progress bar / mood card / glowing button / stats) |
| `hljs-*` | Syntax highlighting color overrides (light + dark mode) |

---

## Integrate with Trae IDE

[Trae](https://www.trae.ai/) is an AI IDE from ByteDance that natively supports the MCP protocol. You can use Daoyan in Trae in just 3 steps:

### 1. Create Configuration File

Create `.trae/mcp.json` in your project root (or user-level `~/.trae/`):

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

> **Get Anon Key**: Visit the [API & MCP docs](/api-docs) page in the app for the complete configuration (including the actual key).

### 2. Restart Trae

After saving the file, restart Trae IDE. The `daoyan` server with 3 tools will appear in the MCP panel.

### 3. Start Using

Ask directly in your Trae conversation and it will be called automatically:

- _"Ask Daoyan, how to understand Wu Wei?"_ → calls `ask_daoyan`
- _"Search for chapters about water in the silk text"_ → calls `search_chapters`
- _"Get the content of chapter 52"_ → calls `get_chapter`

> For more IDE configurations (Cursor / Claude Desktop) and REST API documentation, see the [`/api-docs`](https://167c2bc1450e4ea3a0dc4b07c5873069-latest.preview.enter.pro/api-docs) page.

---

## Cultivation System

### 10 Realms

| Realm | Points | Meaning |
|-------|--------|---------|
| Mortal | 0 | Yet to begin the path |
| Qi Refining | 50 | First gathering of energy |
| Foundation | 200 | Roots taking hold |
| Golden Core | 600 | Core crystallized |
| Nascent Soul | 1,500 | Soul form emerging |
| Spirit Unification | 4,000 | Spirit and mind as one |
| Body Integration | 12,000 | Heaven and human united |
| Great Vehicle | 40,000 | The Great Way revealed |
| Tribulation | 120,000 | Surviving heaven's trials |
| True Immortal | 360,000 | Beyond the cycle of rebirth |

### Points Formula

```
Total = Base 10
      + Mind state bonus (3–15)
      + Wu Wei Index × 4 (0–20)
      + Dao field resonance 10
      + Heart-words bonus (0–8)
      + Streak days × 2 (max 20)
```

---

## Development

```bash
pnpm install    # Install dependencies
pnpm dev        # Start dev server
pnpm lint       # ESLint check (0 errors target)
pnpm build      # Production build
```

---

## Security

- **Centralized credentials** — `src/config.ts` as single source of truth
- **Edge function validation** — model allowlist, message count/length limits, search query sanitization
- **XSS protection** — DOMPurify with FORBID_TAGS, FORBID_ATTR, URI scheme allowlist
- **Security headers** — X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy
- **URL validation** — document URLs must use http:// or https://

---

## Acknowledgements

- [React](https://react.dev/) / [TypeScript](https://www.typescriptlang.org/) / [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/) / [shadcn/ui](https://ui.shadcn.com/) / [Lucide](https://lucide.dev/)
- [marked](https://marked.js.org/) / [highlight.js](https://highlightjs.org/) / [DOMPurify](https://github.com/cure53/DOMPurify)
- [SearXNG](https://searxng.org/) / [DuckDuckGo](https://duckduckgo.com/)
- [i18next](https://www.i18next.com/) / [Anthropic Claude](https://www.anthropic.com/)

---

## License

MIT — see [LICENSE](LICENSE)

---

<div align="center">

*May you walk the path of Dao with clarity, and return to the stillness within.*

</div>
