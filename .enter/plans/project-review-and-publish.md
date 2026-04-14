# Plan: Landing Page Redesign (Reference: 飞书知识问答 Style)

## Context
User provided a reference screenshot of 飞书知识问答's landing page. The goal is to adopt its clean, spacious, card-based design style while keeping our existing functionality.

## Key Design Changes (from reference image)

### 1. SearchBar Redesign (`src/components/SearchBar.tsx`)
- **Card-style container**: Rounded white card with subtle shadow
- **Textarea area**: Clean, separated from toolbar
- **Bottom toolbar row**: Separated with a subtle border
  - Left side: `+` circle button (doc panel), Globe "联网搜索" pill toggle
  - Right side: `...` circle button (options), Send circle button (filled)
- Props: add `webSearchEnabled`, `onWebSearchToggle`, `onDocPanelOpen`

### 2. Landing Page Layout (`src/pages/Index.tsx`)
- **Centered hero**: Logo icon → Title → Subtitle (more spacious)
- **Remove floating status badges** for web search / collection (integrated into search bar)
- **Pass webSearch/doc props** to SearchBar instead of separate indicators
- **Keep hamburger menu** for mobile sidebar access

### 3. SuggestedPrompts Redesign (`src/components/SuggestedPrompts.tsx`)
- **2-column card layout** (like reference):
  - Left card: "你可能感兴趣" with 3 suggestion rows (icon + text + arrow)
  - Right card: "探索更多" with 3 more rows
- Each row is clickable, clean text with arrow indicator
- Simpler than current 6-card masonry grid

### 4. Design Tokens (`src/index.css`)
- Add softer accent color tokens
- Add card-toolbar-specific shadow tokens

## Files to Modify
1. `src/components/SearchBar.tsx` - Full redesign with toolbar
2. `src/pages/Index.tsx` - Cleaner layout, pass props to SearchBar
3. `src/components/SuggestedPrompts.tsx` - 2-column compact card layout
4. `src/index.css` - New tokens for softer shadows/accents

## What Stays the Same
- NavigationSidebar (left sidebar with all nav)
- Chat interface (only landing page changes)
- All backend/AI functionality
- i18n translations (reuse existing keys)
- Dark mode support

## Verification
- Landing page matches reference style: centered hero + card search + 2-col suggestions
- Web search toggle works inside search bar toolbar
- Mobile responsive layout preserved
- Chat mode unaffected
