# Session Memory -- 2026-04-14

## Project: dao-research-assistant (xinetzone/dao-research-assistant)

## Session Summary
Full-day session with 20+ user requests spanning repository management, bug fixes, UI redesign, Markdown rendering, documentation, web search fix, locale fix, comprehensive code review, and UX optimization.

## Chronological Commits (40+ total today)

### Phase 1: Foundation & Bug Fixes (00:00-07:45)
- Cultivation system, responsive UI, navigation sidebar, cultivation guide tutorial
- AI chat web search, README, LICENSE, .gitignore
- Git push guides and troubleshooting docs
- Stream timeout fix V1 & V2 (added AbortController timeouts to edge functions)
- Daodejing quote correction: "non-constant Dao" -> "non-eternal Dao" (silk text)

### Phase 2: UI Redesign (09:47-11:03)
- `9fe38b9` Chinese scholarly aesthetic (warm cream + cinnabar red + sketch cards)
- `592ca8b` Markdown rendering (react-markdown + remark-gfm + rehype-highlight)
- `585c591` Cultivation page polish (glass-morphism, spirit orb, custom progress)
- `aed65f2` Switch to marked (react-markdown -> marked, -250KB bundle)
- `5313f49` Layout consistency (2-col questions, lighter SearchBar, icon unification)

### Phase 3: Theme Unification & Bug Fixes (11:03-11:50)
- `80d154d` Unify Cultivation to warm scholarly theme (removed dark cosmic)
- `2d033d4` **Critical**: Rebuilt edge function with actual DuckDuckGo web search + frontend timeout/FatalError
- `5cd2c33` Pass i18n.language to edge function for locale-aware AI responses
- `86d994a` Fix 5 critical bugs from full code review (see Bug History)

### Phase 4: Web Search Deep Fix & UX Optimization (11:50-12:30)
- `dbe4049` Rebuild web search with 3-layer strategy (SearXNG → DDG HTML → DDG Lite)
  - Root cause: DuckDuckGo HTML returns empty in Deno runtime (bot detection)
  - AI was responding "I can't search" because search results were always empty
  - Fix: SearXNG JSON API as primary (4 public instances, 6s each), DDG as fallback
  - System prompt now explicitly tells AI "you HAVE search results, do NOT say you can't search"
- `ce8682c` Comprehensive UX optimization (9 files changed):
  - SearchBar textarea auto-resize (1-6 rows)
  - Stop generation button (red Square, replaces Send when isLoading)
  - Web search progress indicator: "Searching the web..." + Search icon (not generic dots)
  - Scroll-to-bottom button (fixed position, appears >300px from bottom)
  - Copy button on AI messages (hover reveal, CheckCheck 2s confirm)
  - Regenerate button on last AI message
  - Dark mode toggle in sidebar (Moon/Sun, localStorage persistence)
  - Source cards with favicon (Google S2 API)
  - SuggestedPrompts: tags now filter questions (2 per category, click to filter/reset)
  - Theme utility extracted to src/lib/theme.ts

## Key Architecture Decisions

### 1. Unified Warm Theme (changed from dual)
- **Before**: Scholarly warm (Index/Chat) + Cosmic dark (Cultivation)
- **After**: Single warm cream scholarly theme for all pages
- Shared: design tokens (--primary, --foreground), i18n, MarkdownRenderer
- Cultivation retains realm-specific accent colors via inline styles

### 2. Markdown Stack: marked + highlight.js + DOMPurify
- Rejected react-markdown (too heavy, +250KB)
- Custom renderer with: code copy button (event delegation), syntax highlight, XSS protection
- Works via .dao-markdown CSS class system

### 3. Web Search Architecture (3-layer fallback)
- **Strategy 1**: SearXNG JSON API (4 public instances: search.sapti.me, searx.tiekoetter.com, search.bus-hit.me, searx.be) - 6s timeout each
- **Strategy 2**: DuckDuckGo HTML scraping (html.duckduckgo.com) - 8s timeout
- **Strategy 3**: DuckDuckGo Lite (lite.duckduckgo.com) - 8s timeout
- System prompt: explicit "you HAVE search results" + "do NOT say you can't search"
- Frontend: FatalError prevents fetchEventSource auto-retry; 60s/30s timeouts
- search_results SSE event emitted before AI stream for source card display

### 4. Locale-Aware AI Responses
- Frontend passes `i18n.language` to edge function as `locale` parameter
- Edge function adds `"You MUST respond in English."` (or Chinese) to system prompt
- Applied to both main chat (useAIChat) and cultivation guidance (CultivationPage)

### 5. Dynamic Colors in Cultivation
- Cannot use Tailwind template literals (`bg-${color}`)
- All realm-based colors use `style={{ color: currentRealm.color }}`

### 6. Theme Toggle
- src/lib/theme.ts: `getStoredTheme()`, `applyTheme()`, `initTheme()`
- ThemeToggle component in sidebar footer (Moon/Sun icon)
- initTheme() called at module scope in Index.tsx for instant apply on load
- localStorage key: "theme", values: "light" | "dark"

## Bug History (cumulative)

| # | Bug | Root Cause | Fix | Commit |
|---|-----|-----------|-----|--------|
| 1 | Stream timeout | Edge function had no timeout | Added layered AbortController timeouts | Earlier |
| 2 | Stale props name | `onCollectionSelect` vs `onSelectCollection` | Corrected prop name | 9fe38b9 |
| 3 | Duplicate DocumentPanel | Two instances in Index.tsx | Removed duplicate | 9fe38b9 |
| 4 | Duplicate ChatMessageProps | Interface defined twice | Removed duplicate | 9fe38b9 |
| 5 | Tailwind dynamic color | Template literals not compiled | Switched to inline styles | 585c591 |
| 6 | Web search freezing | Edge function just passed flag through + fetchEventSource auto-retry | DuckDuckGo scraping + FatalError class | 2d033d4 |
| 7 | AI always Chinese | No language instruction sent to AI | Pass locale to edge function | 5cd2c33 |
| 8 | Cultivation `Bearer undefined` | `supabase.supabaseAnonKey` not a valid property | Hardcoded constants | 86d994a |
| 9 | Cultivation JSON.parse crash | `nexus_usage` SSE events crash JSON.parse | try/catch around JSON.parse | 86d994a |
| 10 | Cultivation no timeout | fetchEventSource hangs forever | 30s AbortController timeout | 86d994a |
| 11 | Cultivation auto-retry | `onerror` throws plain Error -> infinite retry | FatalError class | 86d994a |
| 12 | App.tsx router recreation | `createBrowserRouter` inside component | Moved to module scope | 86d994a |
| 13 | Web search empty results | DuckDuckGo HTML blocked in Deno runtime | SearXNG JSON API as primary strategy | dbe4049 |
| 14 | AI says "can't search" | No prompt telling AI it HAS results | Explicit system prompt instruction | dbe4049 |

## Critical Lessons

### Supabase JS v2 Client Property Access
The client does NOT expose `supabaseUrl` or `supabaseAnonKey` as reliable public properties.
- **Wrong**: `supabase.supabaseUrl`, `supabase.supabaseAnonKey` -> may be undefined
- **Correct**: Import/define hardcoded URL/key constants for raw fetch

### fetchEventSource Pattern (MUST follow all 5)
1. Use hardcoded URL/key constants (not supabase client properties)
2. Wrap error in `FatalError` class to prevent auto-retry
3. Add `try/catch` around `JSON.parse` in `onmessage`
4. Add `AbortController` with timeout (30s normal, 60s web search)
5. Add `openWhenHidden: true` for background tab support

### Web Search in Deno Edge Runtime
- DuckDuckGo HTML (`html.duckduckgo.com`) is blocked/returns empty pages in Deno runtime
- Use SearXNG JSON API as primary (returns structured JSON, no bot detection)
- Always have 2+ fallback strategies
- When search fails, still tell AI to acknowledge failure (don't just silently skip)

### React Router
- `createBrowserRouter(routes)` must be defined at MODULE scope, not inside a component
- Defining inside component causes full remount on every state change

## File Inventory (key files)

| File | Purpose | Last Modified |
|------|---------|---------------|
| src/index.css | Unified warm theme tokens + 7 custom CSS systems | 80d154d |
| src/lib/theme.ts | Theme utility (getStoredTheme, applyTheme, initTheme) | ce8682c |
| src/pages/Index.tsx | Hero card + chat view + scroll/cancel/regenerate | ce8682c |
| src/pages/CultivationPage.tsx | 5 views: home/checkin/result/records/tutorial | 86d994a |
| src/App.tsx | Router + providers (router now module-scoped) | 86d994a |
| src/components/MarkdownRenderer.tsx | marked + hljs + DOMPurify | aed65f2 |
| src/components/SearchBar.tsx | Auto-resize textarea + stop button + toolbar | ce8682c |
| src/components/SuggestedPrompts.tsx | 4 category tags (filter) + 8 questions (2 per category) | ce8682c |
| src/components/NavigationSidebar.tsx | Sidebar nav + ThemeToggle | ce8682c |
| src/components/ChatMessage.tsx | Copy + Regenerate + Search progress + Source cards | ce8682c |
| src/components/ThemeToggle.tsx | Dark/Light mode toggle (localStorage) | ce8682c |
| src/hooks/useAIChat.ts | SSE streaming + cancel + FatalError + timeout | 5cd2c33 |
| src/hooks/useCultivation.ts | localStorage state management | 585c591 |
| src/i18n/locales/zh-CN.json | Dao-themed Chinese translations (4 categories x 2 questions) | ce8682c |
| src/i18n/locales/en-US.json | Dao-themed English translations (4 categories x 2 questions) | ce8682c |
| supabase/functions/ai-chat-*/index.ts | AI chat + 3-layer web search + locale | dbe4049 |

## CSS Class Systems in index.css

1. **dao-card / dao-tape**: Sketch-border card + tape decoration
2. **dao-tag**: Yellow pill button (feature categories, active state uses primary color)
3. **dao-question**: Rounded question card (2-col grid)
4. **dao-float-square**: Floating decoration squares (4 positions)
5. **dao-markdown**: Full prose styling (headings, lists, code, tables, quotes)
6. **cult-***: Warm theme cultivation (card-glow, progress, mood-card, btn-glow, stat, record)
7. **hljs-***: Syntax highlight color overrides (light + dark)

## Known Limitations
- Preview cache can be 2-5 minutes behind code changes
- Bundle size ~1277KB (highlight.js is largest contributor, could lazy-load)
- Cultivation data is localStorage only (no cloud sync)
- Web search SearXNG instances may be intermittently unavailable (4 instances provide redundancy)
- Dark mode applies globally but some custom CSS class colors may need dark: variants review
- LanguageSwitcher dropdown label "Language" is hardcoded English (minor)
