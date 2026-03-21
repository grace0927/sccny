# Google Slides Automation in Admin PPT Tool

## Context

The church currently uses a 5-step manual workflow to produce Sunday worship presentations:
1. Parse a service email to extract details
2. Fill a Google Sheet (`summary` tab) with the data
3. Run an Apps Script to copy the slide template and fill placeholders
4. Manually copy hymn slides from a hymn bank presentation
5. Delete unused slides

The goal is to automate all 5 steps inside the existing SCCNY admin web app, eliminating manual Sheet editing, script triggering, and slide copying.

**Output**: Google Slides (via Google Slides API, not PPTX)
**Worship order parsing**: Rule-based client-side parsing of structured Chinese worship order text → pre-filled form → admin confirms → generate (no AI API needed)
**Hymn slides**: Copy visual appearance from the hymn bank (thumbnail images)
**Slide naming**: Coming Sunday date in `YYYYMMDD` format
**Output folder**: Shared Drive folder `1nL4Cgb7DoPb_K7CxhHdjcGMIX0q079Ob`

---

## Architecture

### New library: `apps/sccny/src/lib/google-slides.ts`

Central module for all Google Slides + Sheets API operations. Extends the existing service account pattern from `lib/google-drive.ts`.

Key functions:
- `getGoogleAuth()` — auth with scopes: `drive`, `presentations`, `spreadsheets.readonly`
- `copyTemplatePresentation(title, folderId)` — Drive API `files.copy` with `parents` set to output folder
- `discoverPlaceholders(presentationId)` — reads all `{CELL_REF}` patterns from slides
- `replacePlaceholders(presentationId, map: Record<string, string>)` — Slides API `batchUpdate` with `replaceAllText` for each placeholder
- `handleCommunionSlides(presentationId, hasCommunion)` — delete communion slides or reorder benediction (mirrors Apps Script logic)
- `addScriptureSlides(presentationId, passages, insertIndex)` — reads `bibleData` tab via Sheets API, paginates verse text (≤240 chars Chinese / ≤630 chars English per slide), inserts via `createSlide` + `insertText`
- `findHymnSlides(hymnBankId, hymnTitle)` — searches hymn bank slides for ones whose text matches the hymn title; returns page object IDs
- `insertHymnSlideThumbnails(presentationId, hymnBankId, hymns, insertIndex)` — for each hymn slide in the bank: calls `presentations.pages.getThumbnail` (size: LARGE), inserts a new slide in target with the thumbnail as full-bleed background image

### New parser: `apps/sccny/src/lib/parse-worship-order.ts`

Client-safe (no server deps) rule-based parser. Processes each non-empty line of the worship order text:

| Prefix | Extraction |
|--------|-----------|
| `诗歌：` / `回应诗歌：` | Hymn number (first token after `：`) + title (rest) |
| `经文：` | Scripture reading reference |
| `金句：` | Memory verse reference |
| `主日证道题目：` | Sermon title (text inside `"..."`) + speaker (text after closing `"`, trimmed) |
| `宣召：` | Call to worship scripture ref |
| `认罪祷告：` | Confession prayer scripture ref |
| `宣告赦免：` | Assurance scripture ref |

Returns a typed `WorshipOrderData` object.

### New API endpoint

**`POST /api/tools/ppt/generate-slides/route.ts`**
- Input: Full form payload (parsed `WorshipOrderData` + confirmed hymn DB IDs)
- Steps:
  1. Compute coming Sunday date → title in `YYYYMMDD` format
  2. Copy template into shared folder `1nL4Cgb7DoPb_K7CxhHdjcGMIX0q079Ob` (Drive API `files.copy` with `parents`)
  3. Map form fields → `{CELL_REF}` placeholder values (hardcoded mapping discovered from template)
  4. `replacePlaceholders()` — batch replace all `{CELL_REF}` occurrences
  5. `handleCommunionSlides()` — conditional slide delete/reorder
  6. `addScriptureSlides()` — insert verse slides from `bibleData` Sheet tab
  7. `insertHymnSlideThumbnails()` — insert hymn image slides from hymn bank
  8. Return `{ presentationUrl, presentationId }` (folder sharing handles access — no extra permission needed)
- Permission: `ppt.generate`
- Writes audit log entry

### New UI page: `apps/sccny/src/app/[locale]/tools/ppt/page.tsx`

Two-step flow:

**Step 1 — Enter worship order text**
- Textarea pre-filled with the standard worship order template:
  ```
  序乐 Prelude  会众静默（9:57 - 10:00am)
  宣召：诗篇51
  诗歌：12 你真伟大
  会众祷告
  认罪祷告：诗篇32：5
  宣告赦免：罗马书8：1-2
  诗歌：173 宝血活泉
  经文：哥林多前书第五章
  金句：帖撒罗尼迦前书4：3-5
  主日证道题目： "证道题目"   讲员姓名牧师
  回应诗歌：441 洁净我
  欢迎与报告
  奉献与奉献祷告
  结束祷告与祝福
  赞美诗
  ```
- Admin edits the text for this Sunday (hymn numbers/titles, sermon title, speaker, scripture refs)
- "Parse & Preview" button → client-side rule-based parsing (no API call)
- Advances to Step 2

**Step 2 — Review & generate**
- Summary of parsed fields: sermon title, speaker, hymns, scriptures, communion toggle
- Editable overrides for any field the parser got wrong
- "Generate Slides" button → POST `/api/tools/ppt/generate-slides`
- Loading state with progress ("Copying template…", "Adding scripture…", "Adding hymns…")
- On success: link to the generated Google Slides presentation in the shared Drive folder
- "Start over" button

### New UI components (in `src/components/tools/ppt/`)
- `WorshipTextInput.tsx` — textarea with pre-filled template + "Parse & Preview" button
- `WorshipOrderReviewForm.tsx` — parsed field review with editable overrides
- `SlideGenerationResult.tsx` — link + status

---

## External Resources

| Resource | ID |
|----------|-----|
| Google Slides template | `13Z5PyfuQF0eK9w3rz_HzkMzyI9pb2RQlLIxpxsbJ1wU` |
| Hymn bank presentation | `1ET2pr9ruOua8G7jd5oa8Jan0EylaRTUrJ-max48TdOY` |
| Bible data Google Sheet | `1EobG4Pvb8QS7UcmWzrv-aBnSmeZBpgn6_x7nPlHqvY0` |
| Output Drive folder | `1nL4Cgb7DoPb_K7CxhHdjcGMIX0q079Ob` |
| Apps Script (reference) | https://github.com/grace0927/slide-generator/blob/main/SheetData2Slides.gs |

## Environment Variables

Add to `turbo.json` (env section) and `.env.local`:
```
GOOGLE_SLIDES_TEMPLATE_ID=13Z5PyfuQF0eK9w3rz_HzkMzyI9pb2RQlLIxpxsbJ1wU
GOOGLE_HYMN_BANK_ID=1ET2pr9ruOua8G7jd5oa8Jan0EylaRTUrJ-max48TdOY
GOOGLE_BIBLE_SHEET_ID=1EobG4Pvb8QS7UcmWzrv-aBnSmeZBpgn6_x7nPlHqvY0
GOOGLE_SLIDES_OUTPUT_FOLDER_ID=1nL4Cgb7DoPb_K7CxhHdjcGMIX0q079Ob
```

The existing `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` is reused. One-time manual setup required:
- Service account granted **Viewer** on: template presentation, hymn bank presentation, Bible Sheet
- Service account granted **Editor** on: output Drive folder `1nL4Cgb7DoPb_K7CxhHdjcGMIX0q079Ob`

`googleapis@^171.4.0` is already installed in `apps/sccny/package.json` — no new packages needed.

---

## Critical Files

| File | Action |
|------|--------|
| `src/lib/google-slides.ts` | **Create** — Slides + Sheets API module |
| `src/lib/parse-worship-order.ts` | **Create** — client-safe rule-based parser |
| `src/app/api/tools/ppt/generate-slides/route.ts` | **Create** — slide generation endpoint |
| `src/app/[locale]/tools/ppt/page.tsx` | **Create** — 2-step UI page (currently empty dir) |
| `src/components/tools/ppt/WorshipTextInput.tsx` | **Create** |
| `src/components/tools/ppt/WorshipOrderReviewForm.tsx` | **Create** |
| `src/components/tools/ppt/SlideGenerationResult.tsx` | **Create** |
| `src/lib/google-drive.ts` | **Reference** — reuse auth pattern |
| `src/lib/admin-auth.ts` | **Reference** — `requirePermission('ppt.generate')` |
| `src/lib/audit.ts` | **Reference** — log generate action |
| `src/messages/en.json` + `zh.json` | **Modify** — add `PptGeneration` translation keys |
| `turbo.json` | **Modify** — add 4 new env vars |

---

## Key Implementation Notes

### Placeholder mapping (do first during implementation)

At the start of implementation, read the template presentation via Slides API to list all `{CELL_REF}` patterns, then read the Google Sheet's `summary` tab to see what each cell contains. Build a hardcoded constant:
```ts
const buildPlaceholderMap = (data: WorshipOrderData): Record<string, string> => ({
  '{A1}': data.date,
  '{B3}': data.sermonTitle,
  // ... filled in after discovery
});
```

### Scripture data (Sheets API)

The `bibleData` tab has:
- Column B: Chinese verse text (one row per verse number)
- Column C: English verse text

The `summary!A42:I{n}` rows (one per scripture passage) provide:
- Col A (index 0): isMemoryVerse flag
- Col B (index 1): Chinese book name
- Col D (index 3): chapter number
- Col E (index 4): start verse
- Col F (index 5): end verse
- Col G (index 6): bibleData start row
- Col H (index 7): bibleData end row
- Col I (index 8): English book name

Replicate `findOneVerse()` from the Apps Script in TypeScript. Chinese char limit per slide: 240; English: 630.

### Hymn slide thumbnails

```
GET https://slides.googleapis.com/v1/presentations/{hymnBankId}/pages/{pageId}/thumbnail?thumbnailProperties.thumbnailSize=LARGE
```
Returns a `contentUrl` (temporary). Download the image, upload to Drive (reuse `uploadImageToDrive`), then insert into the target presentation as a full-slide background image using Slides API `createSlide` + `updatePageProperties` (`pageBackgroundFill.stretchedPictureFill`).

**Limitation**: hymn slides become image-based (not editable text). Acceptable for projection use.

### Hymn slide identification in the bank

Search hymn bank slides for text matching the hymn title (Chinese). A hymn typically spans multiple consecutive slides (one per verse). Identify the group: first slide contains the full title, subsequent slides of the same hymn have the same title in the header.

### Slide title / coming Sunday date

```ts
function getComingSunday(): string {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + daysUntilSunday);
  return d.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
}
```

### Auth scopes

```ts
scopes: [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
]
```

---

## Verification

1. **Parser unit test**: call `parseWorshipOrder()` with the sample text → verify hymns, scripture refs, sermon title, speaker are all extracted correctly
2. **Integration test**: POST `/api/tools/ppt/generate-slides` with hardcoded test data → open the returned URL and verify:
   - All `{CELL_REF}` placeholders replaced
   - Communion slides present/absent based on flag
   - Scripture verses appear with correct text, paginated properly
   - Hymn slides appear as image slides in the correct order
   - File appears in the shared Drive folder named `YYYYMMDD`
3. **End-to-end**: Open `/tools/ppt`, edit the pre-filled textarea for this Sunday, click "Parse & Preview", review the form, click Generate, confirm the Google Slides link opens a complete presentation in the shared folder
