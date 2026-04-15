# Plan: 帛书老子注读 阅读界面

## Context
The `docs/帛书老子注读/` directory contains 82 Markdown files (81 chapters + index) generated from the PDF. The user wants a reading interface integrated into the React app.

## Technical Challenge
Vite only serves `public/` as static HTTP assets. The markdown files are in `docs/` (project root). Solutions:
- **Chosen**: Copy to `public/docs/帛书老子注读/` + `fetch()` on demand → lazy loading, no bundle bloat

## What Changes

### 1. `public/docs/帛书老子注读/` (copy at build time)
- Copy all 82 .md files there so Vite serves them as static assets
- Shell command: `cp -r docs/帛书老子注读 public/docs/`

### 2. `src/data/daodejing-index.ts` (new)
Static TypeScript array of all 81 chapters:
```typescript
export interface DaodejingChapter {
  num: number;        // 1–81
  cn: string;         // 一、二十…
  section: '德经' | '道经';
  title: string;      // 道、德是这样沦丧的
  todayChapter: string; // 38 (今本章号)
  file: string;       // 德经/001_一.md
}
export const DAODEJING_CHAPTERS: DaodejingChapter[] = [...];
```
Build this once from the index.md in a Python script. Totals 81 entries.

### 3. `src/pages/DaodejingPage.tsx` (new)
Two-panel layout:
- **Desktop** (lg+): fixed 260px left TOC sidebar + scrollable content on right
- **Mobile**: full-width content, TOC in Sheet/drawer toggled by button

TOC sidebar:
- 德经/道经 section headers
- Chapter list: `第N章 · title` rows, selected state highlighted
- Current chapter highlighted with primary color

Content panel:
- Header: chapter number + title + 今本对应章 badge
- Prev/Next chapter navigation buttons
- Markdown rendered via existing `<MarkdownRenderer>` component
- Empty state when no chapter selected (show intro)

State: `selectedChapter: DaodejingChapter | null`, `content: string`, `loading: boolean`

Fetch: `fetch(\`/docs/帛书老子注读/${chapter.file}\`)` on chapter select.

### 4. `src/router.tsx` (modify)
Add route: `{ path: "/daodejing", name: "daodejing", element: <DaodejingPage /> }`

### 5. `src/components/NavigationSidebar.tsx` (modify)
Add nav item between 修行打卡 and 修炼指南:
```tsx
<Button onClick={() => { navigate("/daodejing"); onClose(); }}>
  <ScrollText className="h-4 w-4" />
  <span>帛书老子</span>
</Button>
```

## Files Modified
- `src/data/daodejing-index.ts` — NEW, static chapter metadata
- `src/pages/DaodejingPage.tsx` — NEW, reading page
- `src/router.tsx` — add route
- `src/components/NavigationSidebar.tsx` — add nav item
- `public/docs/帛书老子注读/` — copied markdown files (81+1)

## Reused Patterns
- `MarkdownRenderer` component for content rendering
- `Sheet` + `SheetContent` from shadcn for mobile TOC drawer
- `ScrollArea` for TOC list
- Same page layout pattern as `CultivationPage.tsx`
- Design tokens from `index.css` (primary = rust red, accent = warm yellow)

## Verification
1. Navigate to `/daodejing` via sidebar nav
2. TOC lists all 81 chapters in 德经/道经 sections
3. Click chapter → content renders correctly via MarkdownRenderer
4. Prev/Next navigation works
5. Mobile: TOC drawer opens/closes
6. Dark mode works
