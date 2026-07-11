# Reference: Content (Sermons, News, Announcements, Events, CMS)

Current-state architecture for content subsystems. Forward-looking specs live in `docs/features/` (`sermon-management.md`, `announcement-management.md`, `event-management.md`, `content-management.md`).

All admin routes follow the standard admin API pattern (see `admin-and-rbac.md`). Public routes use Zod schemas from `lib/validations.ts`; admin routes use `lib/admin-validations.ts`. Public list endpoints return `{ data, pagination }` and accept `page`, `limit`, `sortBy`, `sortOrder` + model-specific filters.

## Sermons
- **Model**: `Sermon` (title, speaker, date, `type` = SERMON|SUNDAY_SCHOOL|RETREAT_MESSAGE|BAPTISM_CLASS, series, scripture, video/audio URLs).
- **Public**: `app/api/sermons` (+ `[id]`); pages under `app/[locale]/messages/` (`sermon-recordings`, `sunday-school`, `baptism-class`, `special-gathering`). Components in `components/sermons/` (`SermonList`, `SermonCard`, `SermonDetail`, `SermonFilters`, `SermonPagination`, `MediaPlayer`).
- **Admin**: `app/api/admin/sermons` (+ `[id]`, `bulk`, `sync`); UI `app/[locale]/admin/sermons` + `components/admin/sermons/`. Permissions `sermons.view/create/edit/delete/sync`.
- **Scraper / sync**: `lib/sermon-scraper.ts` (`SermonScraper` class, `sermonScraper` singleton, `RawSermonData`/`SermonSource`) pulls from the legacy scc-ny.org site. Triggered by `app/api/tasks/sync-sermons` (Vercel cron, Fri 02:00 UTC; guarded by `CRON_SECRET`) and admin `sermons/sync`.

## News
- **Model**: `News` (title, date, content, excerpt, `status` = DRAFT|PUBLISHED|ARCHIVED).
- **Public**: `app/api/news` (+ `[id]`); pages `app/[locale]/news` (+ `[id]`). Components in `components/news/` (`NewsList`, `NewsCard`, `NewsDetail`, `NewsFilters`, `NewsPagination`).
- **Scraper / sync**: `lib/news-scraper.ts` (`NewsScraper` class, `newsScraper` singleton, `RawNewsData`); endpoint `app/api/tasks/sync-news`. Permissions `news.view/create/edit/delete`. (News is managed via API/sync; no dedicated admin UI page.)

## Announcements
- **Model**: `Announcement` (bilingual title/content, priority, audience, status, schedule dates).
- **Public**: `app/api/announcements`. **Admin**: `app/api/admin/announcements` (+ `[id]`); UI `app/[locale]/admin/announcements` + `components/admin/announcements/`. Permissions `announcements.view/create/edit/delete`.

## Events
- **Models**: `Event` (bilingual, type, recurrence, status) + `EventRegistration` (status REGISTERED|CANCELLED|ATTENDED).
- **Public**: `app/api/events` (+ `[id]`, `[id]/register`). **Admin**: `app/api/admin/events` (+ `[id]`, `[id]/registrations`); UI `app/[locale]/admin/events` (+ `[id]`) + `components/admin/events/`. Permissions `events.view/create/edit/delete/registrations`.

## Content CMS (ContentPage)
- **Models**: `ContentPage` (slug-based bilingual CMS page) + `ContentRevision` (version history) + `MediaAsset`.
- **Admin**: `app/api/admin/content` (+ `[slug]`, `[slug]/publish`, `[slug]/revisions`); UI `app/[locale]/admin/content` (+ `[slug]`) + `components/admin/content/`. Permissions `content.view/edit/publish`; media `media.upload/delete`.

## Hymns & PPT templates (content-like admin)
- **Hymn** (bilingual lyrics + indexed hymn-bank slide range `slidesUrl`/`slideStartIndex`/`slideEndIndex`; `number`, `titleEn` used by the PPT tool): `app/api/admin/hymns` (+ `[id]`, `index-bank` POST which scans the Google Slides hymn bank and upserts each hymn's slide range — gated `hymns.edit`); UI `app/[locale]/admin/hymns/page.tsx` → `components/admin/hymns/HymnTable.tsx` (list/search/edit/delete + "Index Hymn Bank" button) + `HymnFormDialog.tsx`. Permissions `hymns.view/create/edit/delete`. Lyrics stored here feed generated lyric slides in the PPT tool (see `tools.md`).
- **PptTemplate** (styling/layout): `app/api/admin/templates` (+ `[id]`). Permissions `templates.view/create/edit`. See `tools.md` for how templates relate to generation.
