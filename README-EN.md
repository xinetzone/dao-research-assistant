# Dao Yan (道衍)

<div align="center">

**Your Wise Companion on the Path of Dao — Ancient wisdom flowing into everyday life**

**[中文 README](README.md)**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-blue)](https://react.dev/)

</div>

---

## What is Dao Yan?

**道衍 (Dao Yan)** — The word carries three layers of meaning:

- **道 (Dào)** — The Way; the fundamental principle of the universe. As Laozi wrote: *"The Way that can be told is not the eternal Way."*
- **衍 (Yǎn)** — To flow, to spread, to give rise to. Like water flowing into the sea, giving birth to all things.
- **道衍** — The living flow and extension of the Dao into the present moment.

> Dao Yan is not an academic tool for interpreting classical texts.
> It is not a moral lecturer teaching you Daoist principles.
>
> It is: a reflective mirror that uses Daoist wisdom to help you see through confusion,
> and a companion that walks alongside you on the path of inquiry.

**One-line positioning: Dao Yan — Your wise companion on the path of Dao.**

---

## Core Philosophy

| Dimension | What it means |
|-----------|---------------|
| **Inheritance** | Continuing Laozi's Dao, not as dogma, but as living practice |
| **Wisdom** | Illuminating the heart-mind — *"For the Way, subtract each day"* |
| **Practice** | *"Action is the beginning of knowing; knowing is the completion of action"* |
| **Companionship** | AI as a mirror for your inquiry, not a teacher above you |

---

## Key Features

### AI Dialogue
- **Chinese scholarly aesthetic UI** — warm cream paper, cinnabar red accents, sketch-border cards
- **Streaming responses** — real-time display of AI thinking; stop generation anytime
- **Rich Markdown rendering** — syntax highlighting, tables, blockquotes, one-click copy (marked + highlight.js)
- **Source citation cards** — web search results shown as cards with favicons
- **Message actions** — copy AI reply, regenerate last response
- **Dark / Light mode** — toggle in sidebar, persisted via localStorage

### Intelligent Web Search
- **Optional web toggle** — one-click enable in the toolbar
- **3-layer fallback** — SearXNG JSON API (4 instances) → DuckDuckGo HTML → DuckDuckGo Lite
- **Search progress indicator** — shows "Searching the web..." while fetching
- **Auto context injection** — results passed as system context to AI, with citation card display

### Conversation UX
- **Auto-growing textarea** — starts at 1 row, expands up to 6 rows as you type
- **Stop generation button** — interrupt AI mid-response (red Stop icon)
- **Scroll-to-bottom button** — floating button appears when scrolled up
- **Category tag filtering** — click topic tags to filter suggested prompts; click again to reset
- **Character limit counter** — shows count when >80% of limit used; blocks submit if over limit

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
- **Auto-detection** — switches based on browser language setting

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React 19.1 + TypeScript 5.9 | Vite 7 build |
| UI | Tailwind CSS + shadcn/ui + Lucide | Unified warm scholarly theme |
| Markdown | marked + highlight.js + DOMPurify | Rich rendering + XSS protection |
| Routing | React Router v7 | Declarative routes (module-level) |
| i18n | i18next + react-i18next | Chinese/English + locale forwarded to AI |
| Backend | Supabase Edge Functions (Deno) | AI chat, search, URL fetch |
| AI | Claude Sonnet 4.5 via SSE | Streaming + interruptible |
| Search | SearXNG + DuckDuckGo (3-layer) | Results injected as system context |
| Storage | localStorage | Cultivation data + theme persistence |

---

## Project Structure

```
dao-yan/
├── src/
│   ├── components/
│   │   ├── ChatMessage.tsx          # Message (copy / regenerate / source cards)
│   │   ├── MarkdownRenderer.tsx     # marked renderer (highlight / copy / XSS)
│   │   ├── SearchBar.tsx            # Input (auto-resize / stop button / toolbar)
│   │   ├── SuggestedPrompts.tsx     # Category tag filter + 8 Dao Yan prompts
│   │   ├── ThemeToggle.tsx          # Dark / light mode toggle (sidebar)
│   │   ├── NavigationSidebar.tsx    # Left navigation sidebar
│   │   ├── DocumentPanel.tsx        # Document management panel
│   │   ├── LanguageSwitcher.tsx     # Language switcher
│   │   └── ui/                      # shadcn/ui base components
│   ├── config.ts                    # Centralized credentials & constants
│   ├── hooks/
│   │   ├── useAIChat.ts             # AI chat (SSE + stop + search)
│   │   ├── useCultivation.ts        # Cultivation system (realm / check-in / points)
│   │   └── useDocumentCollections.ts
│   ├── lib/
│   │   └── theme.ts                 # Theme utils (getStoredTheme / applyTheme / initTheme)
│   ├── i18n/locales/                # zh-CN.json / en-US.json
│   ├── pages/
│   │   ├── Index.tsx                # Main page (hero card / chat / scroll-to-bottom)
│   │   └── CultivationPage.tsx      # Cultivation (check-in / tutorial / history)
│   └── index.css                    # Unified warm design tokens + custom CSS system
├── supabase/functions/
│   ├── ai-chat-*/                   # AI chat + 3-layer web search + locale
│   ├── fetch-url-content/           # URL content fetch (8s timeout)
│   └── web-search/                  # Search (merged into ai-chat)
└── .enter/                          # Retrospective reports + platform config
```

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

### Other Commands

```bash
pnpm lint    # ESLint check (0 errors target)
pnpm build   # Production build
```

---

## Cultivation Realms

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
