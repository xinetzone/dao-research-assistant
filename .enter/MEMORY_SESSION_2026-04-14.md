# Session Memory -- 2026-04-14

## Project: dao-research-assistant (xinetzone/dao-research-assistant)

## Session Summary
Full-day session with 16+ user requests spanning repository management, bug fixes, UI redesign, Markdown rendering, documentation, web search fix, locale fix, and comprehensive testing.

## Chronological Commits (35+ total today)

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
- `[latest]` Fix 4 critical bugs found in full-code review (see Bug History)

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

### 3. Web Search Architecture (rebuilt)
- **Edge function**: DuckDuckGo HTML scraping with 8s timeout, results injected as system context
- **SSE**: Custom `search_results` event sent before AI stream for source card display
- **Frontend**: FatalError class prevents fetchEventSource auto-retry; 60s/30s timeouts

### 4. Locale-Aware AI Responses
- Frontend passes `i18n.language` to edge function as `locale` parameter
- Edge function adds `"You MUST respond in English."` (or Chinese) to system prompt
- Applied to both main chat (useAIChat) and cultivation guidance (CultivationPage)

### 5. Dynamic Colors in Cultivation
- Cannot use Tailwind template literals (`bg-${color}`)
- All realm-based colors use `style={{ color: currentRealm.color }}`

## Bug History (cumulative)

| # | Bug | Root Cause | Fix | Commit |
|---|-----|-----------|-----|--------|
| 1 | Stream timeout | Edge function had no timeout | Added layered AbortController timeouts | Earlier |
| 2 | Stale props name | `onCollectionSelect` vs `onSelectCollection` | Corrected prop name | 9fe38b9 |
| 3 | Duplicate DocumentPanel | Two instances in Index.tsx | Removed duplicate | 9fe38b9 |
| 4 | Duplicate ChatMessageProps | Interface defined twice | Removed duplicate | 9fe38b9 |
| 5 | Tailwind dynamic color | Template literals not compiled | Switched to inline styles | 585c591 |
| 6 | Web search freezing | Edge function just passed flag through (API doesn't support it) + fetchEventSource auto-retry | Rebuilt with DuckDuckGo scraping + FatalError class | 2d033d4 |
| 7 | AI always Chinese | No language instruction sent to AI | Pass locale to edge function, add language system prompt | 5cd2c33 |
| 8 | **Cultivation `Bearer undefined`** | `supabase.supabaseAnonKey` not a valid property | Use hardcoded constants directly | [latest] |
| 9 | **Cultivation JSON.parse crash** | `nexus_usage` SSE events not valid message JSON | Added try/catch around JSON.parse | [latest] |
| 10 | **Cultivation no timeout** | fetchEventSource hangs forever on failure | Added 30s AbortController timeout | [latest] |
| 11 | **Cultivation auto-retry** | `onerror` throws plain Error -> infinite retry | Use FatalError class | [latest] |
| 12 | **App.tsx router recreation** | `createBrowserRouter` called inside component | Moved to module scope | [latest] |

## Critical Lesson: supabase client property access

The Supabase JS v2 client object does NOT expose `supabaseUrl` or `supabaseAnonKey` as reliable public properties. Access patterns:
- **Wrong**: `supabase.supabaseUrl`, `supabase.supabaseAnonKey` -> may be undefined
- **Correct for raw fetch**: Import/define constants directly
- **Correct for supabase**: Use `supabase.functions.invoke()` (but doesn't support SSE)

When using `fetchEventSource` for streaming, always:
1. Use hardcoded URL/key constants
2. Wrap in `FatalError` to prevent auto-retry
3. Add `try/catch` around `JSON.parse` in `onmessage`
4. Add `AbortController` with timeout
5. Add `openWhenHidden: true` for background tab support

## File Inventory (key files)

| File | Purpose | Last Modified |
|------|---------|---------------|
| src/index.css | Unified warm theme tokens + 7 custom CSS systems | 80d154d |
| src/pages/Index.tsx | Hero card + chat view | 5cd2c33 |
| src/pages/CultivationPage.tsx | 5 views: home/checkin/result/records/tutorial | [latest] |
| src/App.tsx | Router + providers (router now module-scoped) | [latest] |
| src/components/MarkdownRenderer.tsx | marked + hljs + DOMPurify | aed65f2 |
| src/components/SearchBar.tsx | Textarea + toolbar (web/docs/send) | 5313f49 |
| src/components/SuggestedPrompts.tsx | 4 tags + 4 question pills (2-col grid) | 5313f49 |
| src/components/NavigationSidebar.tsx | Sidebar nav (BookOpen icon) | 5313f49 |
| src/components/ChatMessage.tsx | User (text) + AI (Markdown) messages | 592ca8b |
| src/hooks/useAIChat.ts | SSE streaming with FatalError + timeout | 5cd2c33 |
| src/hooks/useCultivation.ts | localStorage state management | 585c591 |
| src/i18n/locales/zh-CN.json | Dao-themed Chinese translations | 9fe38b9 |
| src/i18n/locales/en-US.json | Dao-themed English translations | 9fe38b9 |
| supabase/functions/ai-chat-*/index.ts | AI chat + DuckDuckGo web search + locale | 5cd2c33 |

## CSS Class Systems in index.css

1. **dao-card / dao-tape**: Sketch-border card + tape decoration
2. **dao-tag**: Yellow pill button (feature categories)
3. **dao-question**: Rounded question card (2-col grid)
4. **dao-float-square**: Floating decoration squares (4 positions)
5. **dao-markdown**: Full prose styling (headings, lists, code, tables, quotes)
6. **cult-***: Warm theme cultivation (card-glow, progress, mood-card, btn-glow, stat, record)
7. **hljs-***: Syntax highlight color overrides (light + dark)

## Known Limitations
- Preview cache can be 2-5 minutes behind code changes
- Bundle size ~1277KB (highlight.js is largest contributor)
- Cultivation data is localStorage only (no cloud sync)
- Web search uses DuckDuckGo HTML scraping (8s timeout, max 5 results)
- LanguageSwitcher dropdown label "Language" is hardcoded English (minor)
