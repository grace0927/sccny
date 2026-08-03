# Reference: Ministry Tools (PPT, Live Translation, Bible)

Current-state architecture for the tool subsystems under `app/api/tools/` and `components/tools/`. Forward-looking specs: `docs/features/ppt-generation.md`, `google-slides-automation.md`, `live-translation.md`, `bible-lookup.md`.

## Google APIs (shared)
`lib/google-slides.ts` and `lib/google-drive.ts` each build their own Google client from a **service account** (`GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` JSON, or a path in `GOOGLE_APPLICATION_CREDENTIALS`). Scopes: Drive + Presentations + Sheets (read-only). All Drive calls pass `supportsAllDrives` because the output/template folders live on a Shared Drive. `google-slides.ts` is the home for all Slides/Sheets API logic; `google-drive.ts` holds Drive file ops.

## PPT Generation Tool
Generates the Sunday worship Google Slides deck from pasted worship-order text. All routes require `ppt.generate`.

**UI flow** (`app/[locale]/admin/ppt/page.tsx`, client component, 3 steps `input → review → result`):
- `components/tools/ppt/WorshipTextInput.tsx` — paste worship order + pick service date; POSTs to `parse-worship-order`.
- `components/tools/ppt/WorshipOrderReviewForm.tsx` — edit parsed fields; POSTs to `generate-slides`. Each of the five scripture fields (宣召 / 认罪祷告 / 宣告赦免 / 经文 / 金句, listed once in `SCRIPTURE_FIELDS` in `lib/parse-worship-order.ts`) shows the resolved passage beneath its input — title plus full Chinese and English text — via `VersePreviewPanel.tsx` (`useVersePreview` 500 ms-debounced batch POST to `preview-verses`; stale responses are discarded). An invalid reference shows inline and disables 生成幻灯片. 宣召自定义文字 suppresses the 宣召 lookup. Also mounts `HymnLyricsPanel.tsx`, which POSTs `check-hymns` (debounced) and shows a per-hymn status badge: ✓诗歌库 (indexed bank slides) / ✓数据库歌词 (stored lyrics) / ⚠缺少歌词. Missing hymns get a 查找歌词 flow: POST `fetch-lyrics` (web preview, nothing persisted) → operator edits → POST `save-hymn-lyrics` (upsert `Hymn` by number).
- `components/tools/ppt/SlideGenerationResult.tsx` — "Open in Google Slides" link + missing-hymn warnings.
- `app/[locale]/admin/ppt/generated/page.tsx` — separate read-only page listing decks already in the output folder (sidebar key `generatedPpt`).

**Parsing** (`POST /api/tools/ppt/parse-worship-order`):
- Primary: Gemini LLM (`GEMINI_API_KEY`, model `GEMINI_MODEL`, default `gemini-2.5-flash-lite`) with a fixed prompt that normalizes Bible references.
- Fallback: `lib/parse-worship-order.ts` `parseWorshipOrder()` — client-safe rule-based parser keyed on Chinese prefixes (诗歌/经文/金句/宣召/认罪祷告/宣告赦免; 圣餐 → communion). Both return `WorshipOrderData` (defined in that file; also exports `HymnEntry`, `DEFAULT_WORSHIP_ORDER_TEMPLATE`).

**Generation** (`POST /api/tools/ppt/generate-slides`) — orchestrates `lib/google-slides.ts`:
0. **Pre-validates every scripture reference** (`collectScriptureRefs` + `resolveReference`) *before* touching Drive; any failure returns 400 `{ error: "经文引用无效", invalidRefs: [{ field, ref, reason }] }` so no orphaned deck is left in the output folder. Skipped when `GOOGLE_BIBLE_SHEET_ID` is unset.
1. `copyTemplatePresentation(title, TEMPLATE_ID, OUTPUT_FOLDER_ID)` — title = compact Sunday date (`lib/service-date.ts`: `getComingSunday`, `parseServiceDate`, `formatCompact`, `isFirstSundayOfMonth`).
2. Build `{XN}` placeholder map (cell refs mirroring the legacy Apps Script "summary" sheet: `{J1}` date, `{B31}`/`{A32}` sermon title, rows 22–25 hymns A=number/B=zh title/C=en title, `{H2}` communion flag, B/C columns = this-week/next-week roles) → `replacePlaceholders()`.
3. `fetchServiceRoles(SCHEDULE_SHEET_ID, …)` pulls the duty roster (non-fatal if `GOOGLE_SCHEDULE_SHEET_ID` unset). English hymn titles come from the `Hymn` table.
4. `replaceVerseContent()` fills per-slide scripture sections (`[verse]`/`[vetitle]`) from `BIBLE_SHEET_ID`; joint-service English verses appended when the schedule marks "joint". Entries are `VerseEntry`; `literal: true` (used for 宣召自定义文字) prints the text verbatim instead of parsing it as a reference — as do empty fields.
5. `handleCommunionSlides()` deletes communion slides when `hasCommunion` is false.
6. `copyHymnSlides(presentationId, HYMN_BANK_ID, hymns)` inserts lyric slides after each hymn's title slide. Per-hymn source priority: `youtubeUrl` → video slide · indexed DB slide range (`Hymn.slidesUrl` + `slideStartIndex`/`slideEndIndex`, copied by page index; source presentations cached per call) · legacy fuzzy title-scan of the bank · stored `Hymn.lyricsZh`/`lyricsEn` → `createLyricsSlides()` generates bilingual stanza slides (one per blank-line-separated stanza, title-slide background, white centered text, 28pt zh / 20pt en) · else `missingHymns`. The route feeds the DB fields by widening the same hymn query used for `{C22}–{C25}`.
7. Audit-logs (`resourceType: "GoogleSlides"`) and returns `{ presentationUrl, presentationId, missingHymns }`.

**Hymn lyrics workflow** (all gated `ppt.generate`):
- `POST /api/tools/ppt/check-hymns` — DB-only availability check per hymn number: `bank` (indexed slide range) / `db` (stored `lyricsZh`) / `missing`.
- `POST /api/tools/ppt/fetch-lyrics` — `lib/hymn-lyrics.ts`: `fetchChineseLyrics(number)` scrapes `christianstudy.com/data/hymns/text/life{NNN}.html` (生命聖詩, Big5 → `TextDecoder("big5")`, Traditional Chinese kept as-is); `fetchEnglishLyrics(titleEn)` searches hymnary.org and parses the text authority page's "Representative Text". Preview only — nothing persisted; both return `null` on failure.
- `POST /api/tools/ppt/save-hymn-lyrics` — upserts `Hymn` by `number` (`SaveHymnLyricsSchema`); deliberately not gated by admin `hymns.*` keys so PPT operators can save.
- `POST /api/admin/hymns/index-bank` (gated `hymns.edit`) — `indexHymnBank()` in `google-slides.ts` scans the bank: title slides are the ones containing the "颂诗 HYMN" marker, formatted `"<number>\n<zh title>[\n<en title>]"`; slides between titles are that hymn's lyrics. Upserts each numbered hymn's `slidesUrl` + slide range (+ fills empty titles; unnumbered one-off songs are skipped). Triggered from the admin hymns page. Re-run after reordering/adding bank slides — stored page indexes go stale.

**Listing generated decks** (`GET /api/admin/ppt/generated`): `lib/google-drive.ts` `listGeneratedPresentations(folderId)` lists presentations in `GOOGLE_SLIDES_OUTPUT_FOLDER_ID` via the Drive API. **No DB record** of generated decks — Drive is the source of truth.

## Live Translation
Real-time translation feed for services. Permission `translation.operate` (legacy alias `tools.translation.operate`).
- **Models**: `TranslationSession` (status ACTIVE|ENDED) + `TranslationEntry`.
- **API**: `app/api/tools/translation/sessions` (+ `[id]`, `[id]/entries`, `[id]/stream`). The operator POSTs entries (gated by `translation.operate`); `[id]/stream` is an **unauthenticated SSE endpoint** (`ReadableStream`, `text/event-stream`) that emits an `initial` batch then polls every 1s for new entries until the session is `ENDED`.
- **Pages**: `app/[locale]/tools/live-translation` — `operate` (operator), `display` (audience SSE view), `history`. Components `components/tools/TranslationOperator.tsx`, `TranslationViewer.tsx`.

## Bible references (shared by the Bible tool and PPT generation)

`lib/bible-reference.ts` is the **single** reference parser — pure, no I/O, no `server-only`, and the only unit-tested module in the repo (`bible-reference.test.ts`, run with `pnpm test` from `apps/sccny`). `lib/google-slides.ts` used to carry a near-verbatim copy; it now imports this one, so the PPT preview and the generated deck always agree.

**Accepted forms** — `约3:16` · `约翰福音1:1-2:2` (cross-chapter) · `约翰福音1-2` (chapter range) · `诗篇51` (whole chapter) · `哥林多前书第七章1-40` · `约翰福音1章1节-2章2节` · `林前1:18-25, 2:1-8` (multi-range; the book carries over) · Traditional and formal-numeral variants (`約翰福音`, `约翰壹书`, `啟示錄`, `林後`) · English names and abbreviations (`John 1:1-2:2`, `1 Cor 1:18-25`, `Ps 23`, `Jn. 3:16`). Range separators: `-` `~` `–` `—` `至`.

Pipeline: `normalizeBookVariants` (Traditional→Simplified over a bounded char map + 壹/貳/叁 → 一/二/三) → `normalizeChapterRef` (第五章 → 5, `7章1` → `7:1`, 节/篇 markers) → `expandBookAbbreviation` → book match (Chinese full name, then the sheet's English column, then `EN_ALIASES`) → `TAIL_RE` → bounds check.

**Invalid references throw `BibleReferenceError`** (`code`, `ref`, `params`, ready-to-show Chinese `message`) instead of silently clamping or dropping segments as the old parser did: `UNKNOWN_BOOK`, `CHAPTER_OUT_OF_RANGE`, `VERSE_OUT_OF_RANGE`, `REVERSED_RANGE`, `UNPARSEABLE`. Resolution is all-or-nothing per input string.

`lib/bible-lookup.ts` holds the Sheets I/O: `loadBibleIndex(sheetId)` (book list + `bibleData!A:A` key column + `BibleBounds`, cached per sheet id as an in-flight promise), `fetchSegments`, `resolveReference` (validate without fetching text), and `lookupBibleVerses(ref)`. Verse labels come from the key column, not a running counter, and carry the chapter (`2:1`) once a range crosses a chapter boundary.

## Bible Lookup
Two independent lookups (no auth):
- `app/api/tools/bible/search` — proxies the external FHL Bible API (`bible.fhl.net`) via `axios`; params `q`, `version` (default `unv`).
- `app/api/tools/bible/sheets-search` — `lookupBibleVerses(ref)` against the Google Bible Sheet (`GOOGLE_BIBLE_SHEET_ID`); returns `VerseSegment[]`. Same source as the PPT scripture slides. A `BibleReferenceError` becomes **400** `{ status: "invalid_reference", ref, error: { code, message, params } }`; the page reports it via `Tools.bible.errors.*` and does **not** fall back to the FHL API (a fallback would answer with different, equally wrong verses).
- **Page**: `app/[locale]/tools/bible`.
