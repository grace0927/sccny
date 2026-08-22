# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. It is the lean, always-loaded index; **detailed per-subsystem architecture lives in `docs/reference/` — read the relevant doc before modifying a subsystem instead of re-exploring the code.**

## Project Overview

SCCNY (Suffolk Chinese Christian Church of New York) is a Turborepo monorepo containing a Next.js 16 church website with bilingual support (Chinese default / English), sermon & news management, member self-service, and ministry tools (PPT generation, live translation, Bible lookup).

## Commands

```bash
# Development (from root)
pnpm dev             # Start dev server
pnpm build           # Build all apps
pnpm lint            # turbo → eslint . (flat config, eslint-config-next)

# Type-check (from apps/sccny) — the other correctness gate
node <ts>/tsc --noEmit   # see memory MEMORY.md for exact tsc/prisma paths

pnpm test            # vitest (from apps/sccny); currently covers lib/bible-reference.ts only

# Database (from apps/sccny)
pnpm exec prisma generate                              # Generate client
pnpm exec prisma db push                               # Push schema (use this; migrate dev fails on Neon shadow DB)
pnpm exec prisma studio                                # GUI
```

## Architecture

### Monorepo & stack
- `/apps/sccny` — the Next.js 16.1.6 app (App Router, React 19). Root uses pnpm workspaces + Turborepo.
- **DB**: PostgreSQL (Neon) + Prisma 7.4.0 (`@prisma/adapter-pg`). Schema is the source of truth: `apps/sccny/prisma/schema.prisma`. Seed (roles/permissions): `prisma/seed.ts`.
- **Auth**: Stack Auth (`@stackframe/stack`) in `src/stack/`. **i18n**: next-intl (zh default, en secondary). **Styling**: Tailwind v4 + the `dark-blue` design-system package. **Validation**: Zod 4.

### Key directories (`apps/sccny/src`)
- `app/api/` — REST routes: `admin/*` (permission-gated), public (`sermons`, `news`, `announcements`, `events`), `member/*` (self-service), `tools/*` (ppt, translation, bible), `tasks/*` (cron sync).
- `app/[locale]/` — localized pages (incl. `admin/`, `my-account/`, `tools/`, `messages/`).
- `components/` — `admin/`, `member-corner/`, `sermons/`, `news/`, `tools/`.
- `lib/` — `db.ts` (Prisma singleton), `validations.ts` / `admin-validations.ts` (Zod), `permissions.ts` + `permissions-client.ts` (RBAC), `admin-auth.ts`, `audit.ts`, `google-slides.ts` / `google-drive.ts` / `bible-reference.ts` (shared, pure, unit-tested Bible reference parser) + `bible-lookup.ts` (its Sheets I/O) / `parse-worship-order.ts` / `hymn-lyrics.ts` (web lyric scrapers) / `service-date.ts`, `sermon-scraper.ts` / `news-scraper.ts`.
- `messages/` — `en.json` / `zh.json`. `generated/` — Prisma types (lint-excluded).

### Data models (full fields in `schema.prisma`)
- **Content**: `Sermon`, `News`, `Announcement`, `Event` (+`EventRegistration`), `ContentPage` (+`ContentRevision`, `MediaAsset`).
- **Access**: `User`, `Role`, `Permission`, `RolePermission`, `UserRole`, `AuditLog`.
- **Members**: `Member`, `PrayerRequest`, `CommunityPost`, `SystemConfig`.
- **Tools**: `Hymn`, `PptTemplate`, `WorshipOrder`(+`WorshipOrderItem`), `TranslationSession`(+`TranslationEntry`).

### Cross-cutting conventions
- **API responses**: list endpoints return `{ data, pagination: { page, limit, total, totalPages } }` and accept `page`/`limit`/`sortBy`/`sortOrder` + filters. Public Zod schemas in `lib/validations.ts`; admin in `lib/admin-validations.ts`. Zod v4: detect validation errors via `error.name === "ZodError"`, not `instanceof`.
- **Auth & RBAC**: `getAdminUser()` (`lib/admin-auth.ts`) → Stack Auth user; `requirePermission(userId, key)` (`lib/permissions.ts`) throws `PermissionError` → 403. Permission keys are dot notation `resource.action` (e.g. `sermons.edit`, `community.manage`). Client gating via `usePermissions()` / `PermissionGate`. Full pattern + key list: `docs/reference/admin-and-rbac.md`.
- **i18n routing**: locale detection in `src/proxy.ts` (Next 16 rename of `middleware.ts`); pages under `app/[locale]/`; `useTranslations` + `messages/*.json`. When adding keys, validate both files for duplicate/mismatched keys (see `MEMORY.md`).
- **dark-blue**: import UI from the `dark-blue` package; `globals.css` imports its styles and registers tokens via Tailwind `@theme` + `@config tailwind.config.mjs` (`important: true` to beat Stack Auth CSS). `cn()` is local in `src/lib/utils.ts`. Must be a dependency in **both** root and `apps/sccny` `package.json`.

### Subsystem reference docs (`docs/reference/`)
Read the relevant doc before working on a subsystem — each has file maps, data flow, key functions, and permissions for the *current* implementation:

| Subsystem | Doc |
|-----------|-----|
| Admin shell, RBAC, audit log, admin API pattern | [`docs/reference/admin-and-rbac.md`](docs/reference/admin-and-rbac.md) |
| Content: sermons, news (+ scrapers/sync), announcements, events, CMS, hymns, templates | [`docs/reference/content.md`](docs/reference/content.md) |
| Members, member corner, community feed | [`docs/reference/members.md`](docs/reference/members.md) |
| Tools: PPT generation, live translation, Bible lookup, Google APIs | [`docs/reference/tools.md`](docs/reference/tools.md) |

(`docs/features/` holds the original forward-looking feature *plans*; `docs/reference/` describes what is actually built.)

## Environment Variables

See `turbo.json` for the authoritative list.
- `DATABASE_URL`, `STACK_SECRET_SERVER_KEY`, `CRON_SECRET`
- Google service account: `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` (JSON) or `GOOGLE_APPLICATION_CREDENTIALS` (path)
- Google IDs: `GOOGLE_DRIVE_FOLDER_ID` (community images), `GOOGLE_SLIDES_TEMPLATE_ID`, `GOOGLE_HYMN_BANK_ID`, `GOOGLE_BIBLE_SHEET_ID`, `GOOGLE_SLIDES_OUTPUT_FOLDER_ID`, `GOOGLE_SCHEDULE_SHEET_ID` (optional)
- Worship-order parsing: `GEMINI_API_KEY` (optional; falls back to rule-based parser), `GEMINI_MODEL` (default `gemini-2.5-flash-lite`)
- Email-triggered PPT: `GMAIL_IMPERSONATED_USER` (Workspace mailbox to poll, via domain-wide delegation), `GMAIL_WORSHIP_LABEL` (default `worship-order`), `GMAIL_PROCESSED_LABEL` (default `worship-order/processed`)

## Roadmap & Docs Maintenance

- Roadmap: [`docs/TODO.md`](docs/TODO.md). Phases 1–5 complete (Bible Lookup enhancement still planned). Original specs per feature in [`docs/features/`](docs/features/).
- After code changes (features, routes, pages, schema, env vars, deps), run `/update-docs` to refresh `docs/TODO.md`, this file, and the matching `docs/reference/*.md`.

## Deployment

- Hosted on Vercel. Crons in `apps/sccny/vercel.json`: weekly (Fri 02:00 UTC) `/api/tasks/sync-sermons` syncs sermons from the legacy site; hourly `/api/tasks/generate-worship-slides` turns labeled worship-procedure emails into slide decks. News syncs via `/api/tasks/sync-news` (no schedule; triggered manually). All `/api/tasks/*` routes are guarded by `CRON_SECRET` via `lib/cron-auth.ts` — they fail closed if it is unset. Vercel Analytics via `@vercel/analytics`.
