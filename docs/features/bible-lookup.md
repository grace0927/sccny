# Bible Lookup (Enhanced)

## Overview

Enhance the existing Bible lookup tool at `/tools/bible`. Currently a basic search form that opens results in a popup window. The enhanced version adds inline results, multiple Bible versions, parallel Chinese/English view, chapter browsing, and verse sharing.

## Current State

- Basic search form at `app/[locale]/tools/bible/page.tsx`
- Opens results in a popup window via `window.open()`
- Result page fetches from external API (`bible.fhl.net`)
- Minimal UI with just a search input

## Enhanced Functionality

### Inline Search Results
- Show results on the same page below the search input (no popup window)
- Display verse text with book, chapter, and verse numbers
- Highlight search matches

### Multiple Bible Versions
- Chinese Union Version (CUV / 和合本) — current
- English Standard Version (ESV)
- New International Version (NIV)
- King James Version (KJV)
- Version selector dropdown

### Parallel View
- Side-by-side Chinese + English display
- Synced scrolling between the two columns
- Toggle between parallel and single-version view

### Chapter Browsing
- Navigate by Book > Chapter > Verse
- Sidebar with all 66 books organized by Old/New Testament
- Chapter list when a book is selected
- Full chapter reading view with verse numbers
- Previous/next chapter navigation

### Bookmarks (requires auth)
- Save favorite verses to personal collection
- View saved bookmarks in member corner
- Tag/categorize bookmarks

### Verse Actions
- Copy verse to clipboard with reference formatting
- Share verse as styled image (for social media)
- Direct link to specific verse

## Components

| Component | Purpose |
|-----------|---------|
| `BibleSearch` | Enhanced search with version selector and book name auto-complete |
| `BibleReader` | Chapter-by-chapter reading view with verse highlighting |
| `BibleParallelView` | Side-by-side Chinese/English display |
| `BibleBookNav` | Book/chapter navigation sidebar (OT/NT sections) |
| `VerseCard` | Styled verse display with copy/share actions |
| `VerseShareImage` | Canvas-based verse image generator |
| `BibleVersionSelector` | Dropdown to choose Bible version |
| `BookmarkButton` | Save/unsave verse bookmark |

## Pages

| Route | Description |
|-------|-------------|
| `app/[locale]/tools/bible/page.tsx` | Enhanced search + results (replaces current) |
| `app/[locale]/tools/bible/[book]/[chapter]/page.tsx` | Chapter reading view |

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/tools/bible/search` | Search verses (proxy to Bible API) |
| `GET` | `/api/tools/bible/[book]/[chapter]` | Fetch full chapter |
| `GET` | `/api/tools/bible/books` | List all books with chapter counts |
| `POST` | `/api/member/me/bookmarks` | Save bookmark (auth required) |
| `GET` | `/api/member/me/bookmarks` | List saved bookmarks |
| `DELETE` | `/api/member/me/bookmarks/[id]` | Remove bookmark |

## Data Source Options

### Option A: External API (current approach, enhanced)
- Continue using `bible.fhl.net` for Chinese text
- Add ESV API (`api.esv.org`) for English text
- Proxy through Next.js API routes to handle CORS and caching

### Option B: Local Database (recommended for reliability)
- Import CUV and one English version into PostgreSQL
- Prisma model for Bible verses
- Instant responses, no external dependency
- ~31,000 verses per version

```prisma
model BibleVerse {
  id       String @id @default(cuid())
  version  String // "CUV", "ESV", etc.
  book     String // "Genesis", "创世记"
  bookNum  Int    // 1-66
  chapter  Int
  verse    Int
  text     String @db.Text

  @@unique([version, bookNum, chapter, verse])
  @@index([version, bookNum, chapter])
  @@map("bible_verses")
}
```

## Query Parameters (GET /api/tools/bible/search)

```typescript
BibleSearchQuerySchema {
  q: string           // search query (e.g. "Eph 2:1" or keyword)
  version: string     // "CUV" | "ESV" | "NIV" | "KJV"
  mode?: string       // "reference" | "keyword" (auto-detected)
}
```

## i18n Keys

Expand existing `"Tools.bible"` namespace with:
- Version names, book names (en/zh), navigation labels
- Copy/share action labels, bookmark labels
- Chapter/verse labels

## Dependencies

- Existing: `dark-blue`, `zod`, `axios`
- Optional new: `html2canvas` or `@napi-rs/canvas` for verse image generation
- If using local DB: Prisma model + seed script with Bible text data
