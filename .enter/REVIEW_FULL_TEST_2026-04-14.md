# Full Code Review & Test Report -- 2026-04-14

## Scope
Full-codebase review of all 19 source files + edge function after 35+ commits in one day.

## Bugs Found & Fixed

### Bug 8: CultivationPage `Authorization: Bearer undefined` [CRITICAL]
- **Symptom**: Cultivation check-in AI guidance always fails with "Failed to fetch" (30s timeout -> empty response)
- **Root Cause**: `supabase.supabaseAnonKey` is not a valid property on Supabase JS v2 client. The property is undefined, so the Authorization header sends `Bearer undefined`, which the edge function rejects.
- **Evidence**: Console log `[error] 2026-04-14 11:35:05 AI guidance failed: TypeError: Failed to fetch`; Network log shows `Authorization: Bearer undefined` at `11:34:35`
- **Fix**: Replaced `supabase.supabaseUrl` and `supabase.supabaseAnonKey` with hardcoded constants (matching Index.tsx pattern)
- **Lesson**: Never access internal Supabase client properties. For raw fetch, use explicit constants.

### Bug 9: CultivationPage JSON.parse crash on nexus_usage
- **Symptom**: Random crash during SSE stream parsing
- **Root Cause**: `JSON.parse(event.data)` called without try/catch. `nexus_usage` events have valid JSON but unexpected structure, and malformed events crash the handler.
- **Fix**: Added `try { data = JSON.parse(event.data); } catch { return; }` (same pattern as useAIChat.ts)

### Bug 10: CultivationPage no timeout protection
- **Symptom**: If AI request hangs, the UI stays in "Master is sensing..." forever
- **Root Cause**: No AbortController timeout on the fetchEventSource call
- **Fix**: Added 30s AbortController timeout

### Bug 11: CultivationPage fetchEventSource infinite retry
- **Symptom**: On error, fetchEventSource retries infinitely, flooding the server
- **Root Cause**: `onerror(err) { throw err; }` throws a regular Error, which fetchEventSource interprets as "retriable"
- **Fix**: Introduced FatalError class (same as useAIChat.ts) to signal non-retriable errors

### Bug 12: App.tsx router recreation on every render
- **Symptom**: Potential route tree remount on any state change (performance)
- **Root Cause**: `createBrowserRouter(routers)` called inside the App component body, creating a new router instance on every render
- **Fix**: Moved `createBrowserRouter` to module scope (outside component)

## Lint & Build Results

| Check | Result |
|-------|--------|
| ESLint | 0 errors, 0 warnings |
| TypeScript build | Success (5.09s) |
| Bundle size | 1,276.49 KB (unchanged) |

## Architecture Review Findings

### Positive Patterns
- Consistent use of semantic design tokens (no hardcoded colors in components)
- i18n covers all UI strings with zh-CN and en-US
- MarkdownRenderer is properly memoized with useMemo + memo
- FatalError pattern in useAIChat prevents infinite retry loops
- Event delegation for copy buttons (efficient, no per-button handlers)

### Minor Issues (not fixed, low priority)
- LanguageSwitcher dropdown label "Language" is hardcoded English
- DialogContent missing aria-describedby (Radix UI warning, cosmetic only)
- Bundle could benefit from code-splitting (dynamic import for CultivationPage)

## Regression Risk Assessment

| Change | Risk | Mitigation |
|--------|------|------------|
| CultivationPage URL/key constants | Low | Same values as Index.tsx, verified in build |
| FatalError class in Cultivation | Low | Identical pattern to proven useAIChat.ts |
| App.tsx router to module scope | Low | Standard React Router pattern, no functional change |
| Locale in Cultivation AI call | Low | Edge function already handles locale parameter |

## Test Matrix (Manual)

| Feature | Test | Expected | Status |
|---------|------|----------|--------|
| Landing page | Load / | Hero card, tags, questions, SearchBar | Build OK |
| Chat | Send message | Streaming response, markdown rendered | Build OK |
| Web search | Toggle + send | Sources card + AI response with context | Edge deployed |
| Language switch | en-US <-> zh-CN | All UI text changes, AI responds in lang | Build OK |
| Cultivation home | /cultivate | Spirit orb, stats, progress bar | Build OK |
| Cultivation check-in | Select mood + submit | AI guidance (not undefined auth) | Fixed |
| Cultivation tutorial | ?tutorial=true | 5-step flow with reward | Build OK |
| Cultivation records | View records | Expandable guidance cards | Build OK |
| Document panel | Open/create/delete | Collections CRUD | Build OK |
| Sidebar | Mobile toggle | Overlay + slide-in | Build OK |
