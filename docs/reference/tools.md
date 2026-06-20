# Reference: Ministry Tools (PPT, Live Translation, Bible)

Current-state architecture for the tool subsystems under `app/api/tools/` and `components/tools/`. Forward-looking specs: `docs/features/ppt-generation.md`, `google-slides-automation.md`, `live-translation.md`, `bible-lookup.md`.

## Google APIs (shared)
`lib/google-slides.ts` and `lib/google-drive.ts` each build their own Google client from a **service account** (`GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` JSON, or a path in `GOOGLE_APPLICATION_CREDENTIALS`). Scopes: Drive + Presentations + Sheets (read-only). All Drive calls pass `supportsAllDrives` because the output/template folders live on a Shared Drive. `google-slides.ts` is the home for all Slides/Sheets API logic; `google-drive.ts` holds Drive file ops.

## PPT Generation Tool
Generates the Sunday worship Google Slides deck from pasted worship-order text. All routes require `ppt.generate`.

**UI flow** (`app/[locale]/admin/ppt/page.tsx`, client component, 3 steps `input → review → result`):
- `components/tools/ppt/WorshipTextInput.tsx` — paste worship order + pick service date; POSTs to `parse-worship-order`.
- `components/tools/ppt/WorshipOrderReviewForm.tsx` — edit parsed fields; POSTs to `generate-slides`.
- `components/tools/ppt/SlideGenerationResult.tsx` — "Open in Google Slides" link + missing-hymn warnings.
- `app/[locale]/admin/ppt/generated/page.tsx` — separate read-only page listing decks already in the output folder (sidebar key `generatedPpt`).

**Parsing** (`POST /api/tools/ppt/parse-worship-order`):
- Primary: Gemini LLM (`GEMINI_API_KEY`, model `GEMINI_MODEL`, default `gemini-2.5-flash-lite`) with a fixed prompt that normalizes Bible references.
- Fallback: `lib/parse-worship-order.ts` `parseWorshipOrder()` — client-safe rule-based parser keyed on Chinese prefixes (诗歌/经文/金句/宣召/认罪祷告/宣告赦免; 圣餐 → communion). Both return `WorshipOrderData` (defined in that file; also exports `HymnEntry`, `DEFAULT_WORSHIP_ORDER_TEMPLATE`).

**Generation** (`POST /api/tools/ppt/generate-slides`) — orchestrates `lib/google-slides.ts`:
1. `copyTemplatePresentation(title, TEMPLATE_ID, OUTPUT_FOLDER_ID)` — title = compact Sunday date (`lib/service-date.ts`: `getComingSunday`, `parseServiceDate`, `formatCompact`, `isFirstSundayOfMonth`).
2. Build `{XN}` placeholder map (cell refs mirroring the legacy Apps Script "summary" sheet: `{J1}` date, `{B31}`/`{A32}` sermon title, rows 22–25 hymns A=number/B=zh title/C=en title, `{H2}` communion flag, B/C columns = this-week/next-week roles) → `replacePlaceholders()`.
3. `fetchServiceRoles(SCHEDULE_SHEET_ID, …)` pulls the duty roster (non-fatal if `GOOGLE_SCHEDULE_SHEET_ID` unset). English hymn titles come from the `Hymn` table.
4. `replaceVerseContent()` fills per-slide scripture sections (`[verse]`/`[vetitle]`) from `BIBLE_SHEET_ID`; joint-service English verses appended when the schedule marks "joint".
5. `handleCommunionSlides()` deletes communion slides when `hasCommunion` is false.
6. `copyHymnSlides(presentationId, HYMN_BANK_ID, hymns)` copies lyric slides from the hymn bank; hymns with a `youtubeUrl` get a video slide; returns `missingHymns`.
7. Audit-logs (`resourceType: "GoogleSlides"`) and returns `{ presentationUrl, presentationId, missingHymns }`.

**Listing generated decks** (`GET /api/admin/ppt/generated`): `lib/google-drive.ts` `listGeneratedPresentations(folderId)` lists presentations in `GOOGLE_SLIDES_OUTPUT_FOLDER_ID` via the Drive API. **No DB record** of generated decks — Drive is the source of truth.

## Live Translation
Real-time translation feed for services. Permission `translation.operate` (legacy alias `tools.translation.operate`).
- **Models**: `TranslationSession` (status ACTIVE|ENDED) + `TranslationEntry`.
- **API**: `app/api/tools/translation/sessions` (+ `[id]`, `[id]/entries`, `[id]/stream`). The operator POSTs entries (gated by `translation.operate`); `[id]/stream` is an **unauthenticated SSE endpoint** (`ReadableStream`, `text/event-stream`) that emits an `initial` batch then polls every 1s for new entries until the session is `ENDED`.
- **Pages**: `app/[locale]/tools/live-translation` — `operate` (operator), `display` (audience SSE view), `history`. Components `components/tools/TranslationOperator.tsx`, `TranslationViewer.tsx`.

## Bible Lookup
Two independent lookups (no auth):
- `app/api/tools/bible/search` — proxies the external FHL Bible API (`bible.fhl.net`) via `axios`; params `q`, `version` (default `unv`).
- `app/api/tools/bible/sheets-search` — `lib/bible-lookup.ts` `lookupBibleVerses(ref)` resolves verse text from the Google Bible Sheet (`GOOGLE_BIBLE_SHEET_ID`); returns `VerseSegment[]`. This is the same source used by PPT scripture slides.
- **Page**: `app/[locale]/tools/bible`.
