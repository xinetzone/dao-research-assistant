# Session Memory -- 2026-04-14

## Project: 道衍 (dao-yan / xinetzone/dao-yan)

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

### Phase 6: 品牌重命名 道研助手 → 道衍 (2026-04-15 02:00–02:52)
- `26b679e` feat: 全站 4 处名称 → 道衍（zh-CN.json, en-US.json, index.html）
- `ae6aada` fix: landing.subtitle → 陪你问道的智慧伙伴
- `1ad325e` fix: SearchBar placeholder 向大师兄提问 → 向道衍提问
- `a14fc18` docs: README clone URLs dao-research-assistant → dao-yan
- `fa9217e` refactor: 全项目批量替换（21 files, 0 残留）; 道衍/dao-yan/README-EN 各处
- `7ed671a` docs: README 副标题 + 简介改写为道衍定位语
- `bc40a40` docs: 新建 README-EN.md（228 行完整英文文档）

### Phase 7: AllTheory ψ=ψ(ψ) 替换量子场论 (2026-04-15 02:48–02:52)
- `a81696c` refactor: 3 files 5 locations — 量子场论 → ψ=ψ(ψ)万物理论（zh-CN + en-US + CultivationPage）
- `cd7a1b5` docs: README.md 中英文 量子场论 → ψ=ψ(ψ)万物理论
- `49a6d8d` User edit: README 微调


- `ccb192d` Retrospect + update README + session memory (all phases documented)
- `1d6bd2f` Security hardening (9 files, based on external security report):
  - S1: `src/config.ts` new — single source for SUPABASE_URL, SUPABASE_ANON_KEY, AI_CHAT_ENDPOINT, MAX_MESSAGE_LENGTH, ALLOWED_URL_SCHEMES
  - S1: `useAIChat.ts` — removed `supabaseUrl`/`supabaseAnonKey` params, imports from config
  - S1: `Index.tsx` / `CultivationPage.tsx` — hardcoded constants removed, use config
  - S1: `.env.example` — documents credential pattern for new devs
  - S2: Edge function `ai-chat-167c2bc1450e` — model allowlist (7 IDs), MAX_MESSAGES=50, MAX_MESSAGE_LENGTH=10000, MAX_SYSTEM_LENGTH=5000, MAX_SEARCH_QUERY_LENGTH=500, security headers (X-Content-Type-Options/X-Frame-Options/X-XSS-Protection/Referrer-Policy), `errorResponse()` helper
  - S3: `MarkdownRenderer.tsx` — DOMPurify FORBID_TAGS, FORBID_ATTR (all event handlers), ALLOWED_URI_REGEXP (http/https/mailto only), FORCE_BODY
  - S3: `DocumentPanel.tsx` — URL validation (must start http:// or https://, uses `new URL()` parse + scheme check)
  - S4: `SearchBar.tsx` — char counter when >80% of limit, red destructive at limit, submit blocked
- `c9d4c95` Accessibility fix: suppress `aria-describedby` warnings in 3 dialog components
  - `command.tsx` CommandDialog's DialogContent
  - `DocumentPanel.tsx` SheetContent (has SheetTitle but no SheetDescription)
  - `sidebar.tsx` mobile sidebar SheetContent
  - Pattern: `aria-describedby={undefined}` (Radix UI recommended)
- Full test verified: lint 0 errors, build clean, web search 200 OK, locale passed, no Bearer undefined

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
| 15 | `aria-describedby` warning | Radix UI requires description or explicit `aria-describedby={undefined}` for all Dialog/Sheet | Added `aria-describedby={undefined}` to CommandDialog, DocumentPanel SheetContent, sidebar mobile SheetContent | c9d4c95 |

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

### Security Hardening Pattern
- Centralize all runtime constants in `src/config.ts`; never duplicate URL/key across files
- Supabase anon key is **intentionally public** (by Supabase design); security is enforced by RLS
- DOMPurify needs both FORBID_TAGS + FORBID_ATTR + ALLOWED_URI_REGEXP for real XSS protection
- Edge function input validation: always validate message count, length, model allowlist
- Security response headers go on **every** non-OPTIONS response (not just error responses)
- `errorResponse()` helper pattern: centralize JSON 4xx response construction

### Radix UI Accessibility
- Every Dialog/Sheet/AlertDialog content needs either:
  - A visible `<Description>` component, OR
  - `aria-describedby={undefined}` on the content component to suppress warning
- `AlertDialogContent` with `AlertDialogDescription` is correct ✅
- `SheetContent` without `SheetDescription` needs `aria-describedby={undefined}`
- `CommandDialog`'s inner `DialogContent` needs `aria-describedby={undefined}`

## File Inventory (key files)

| File | Purpose | Last Modified |
|------|---------|---------------|
| src/index.css | Unified warm theme tokens + 7 custom CSS systems | 80d154d |
| src/config.ts | **NEW** — Runtime constants hub: URL, anon key, endpoints, limits | 1d6bd2f |
| src/lib/theme.ts | Theme utility (getStoredTheme, applyTheme, initTheme) | ce8682c |
| src/pages/Index.tsx | Hero card + chat view + scroll/cancel/regenerate | 1d6bd2f |
| src/pages/CultivationPage.tsx | 5 views: home/checkin/result/records/tutorial | 1d6bd2f |
| src/App.tsx | Router + providers (router now module-scoped) | 86d994a |
| src/components/MarkdownRenderer.tsx | marked + hljs + DOMPurify (with security FORBID rules) | 1d6bd2f |
| src/components/SearchBar.tsx | Auto-resize textarea + stop button + char limit counter | 1d6bd2f |
| src/components/DocumentPanel.tsx | Doc collections + URL validation + aria fix | c9d4c95 |
| src/components/SuggestedPrompts.tsx | 4 category tags (filter) + 8 questions (2 per category) | ce8682c |
| src/components/NavigationSidebar.tsx | Sidebar nav + ThemeToggle | ce8682c |
| src/components/ChatMessage.tsx | Copy + Regenerate + Search progress + Source cards | ce8682c |
| src/components/ThemeToggle.tsx | Dark/Light mode toggle (localStorage) | ce8682c |
| src/components/ui/command.tsx | CommandDialog — aria-describedby fix | c9d4c95 |
| src/components/ui/sidebar.tsx | Mobile sidebar SheetContent — aria-describedby fix | c9d4c95 |
| src/hooks/useAIChat.ts | SSE streaming + cancel + FatalError + timeout (no params) | 1d6bd2f |
| src/hooks/useCultivation.ts | localStorage state management | 585c591 |
| src/i18n/locales/zh-CN.json | Dao-themed Chinese translations | ce8682c |
| src/i18n/locales/en-US.json | Dao-themed English translations | a81696c |
| supabase/functions/ai-chat-*/index.ts | AI chat + web search + locale + security validation | 1d6bd2f |
| .env.example | **NEW** — Documents credential pattern | 1d6bd2f |
| README-EN.md | **NEW** — 完整英文文档 (228 lines, 道衍品牌 + AllTheory) | bc40a40 |

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
- Bundle size ~1295KB (highlight.js is largest contributor, could lazy-load)
- Cultivation data is localStorage only (no cloud sync)
- Web search SearXNG instances may be intermittently unavailable (4 instances provide redundancy)
- Dark mode applies globally but some custom CSS class colors may need dark: variants review
- LanguageSwitcher dropdown label "Language" is hardcoded English (minor)
- Web search timeout is 60s (SearXNG 4 × 6s + DDG fallbacks); slow on all-fail scenarios
