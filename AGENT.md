# AGENT.md

This file provides guidance to AI coding agents (GitHub Copilot, Cursor, etc.) when working with code in this repository. See [CLAUDE.md](CLAUDE.md) for Claude-specific instructions.

## Project Overview

SCCNY (Suffolk Chinese Christian Church of New York) is a Turborepo monorepo containing a Next.js 16 church website with bilingual support (English/Chinese), full admin portal, sermon management, member management, content CMS, and ministry tools.

## Commands

```bash
# Development
pnpm dev             # Start development server (runs from root)
pnpm build           # Build all apps
pnpm lint            # Lint with ESLint 9

# Database (run from apps/sccny)
pnpm exec prisma generate                        # Generate Prisma client
pnpm exec prisma migrate dev --name <name>       # Create migration
pnpm exec prisma db push                         # Push schema without migration
pnpm exec prisma studio                          # Open Prisma Studio GUI
```

## Architecture

### Monorepo Structure
- `/apps/sccny` — Main Next.js 16 application
- Root `package.json` uses pnpm workspaces (`pnpm-workspace.yaml`) with Turborepo

### Tech Stack
- **Framework**: Next.js 16.1.6 with App Router, React 19
- **Database**: PostgreSQL (Neon) with Prisma 7.4.0 using `@prisma/adapter-pg`
- **Auth**: Stack Auth (`@stackframe/stack` v2.8.69) — configured in `src/stack/`
- **i18n**: next-intl v4.8.3 — Chinese (`zh`) is default, English (`en`) secondary
- **Styling**: Tailwind CSS v4 + [dark-blue](https://www.npmjs.com/package/dark-blue) design system
- **Validation**: Zod 4.3.6

### Key Directories (`apps/sccny/src`)

| Directory | Purpose |
|-----------|---------|
| `app/api/` | REST API routes (public + admin) |
| `app/[locale]/` | Localized pages (en/zh) |
| `app/[locale]/admin/` | Admin portal pages |
| `components/admin/` | Admin UI components (tables, forms, dialogs) |
| `components/sermons/` | Sermon display components |
| `components/news/` | News display components |
| `components/member-corner/` | Member self-service components |
| `components/tools/` | Ministry tool components (translation, PPT) |
| `lib/db.ts` | Prisma singleton with connection pooling |
| `lib/validations.ts` | Zod schemas for public API |
| `lib/admin-validations.ts` | Zod schemas for admin API |
| `lib/permissions.ts` | Server-side RBAC helpers |
| `lib/permissions-client.ts` | Client-side permission helpers |
| `lib/admin-auth.ts` | Admin authentication middleware |
| `lib/audit.ts` | Audit logging helpers |
| `lib/sermon-scraper.ts` | Web scraper for legacy sermon content |
| `lib/news-scraper.ts` | Web scraper for legacy news content |
| `stack/` | Stack Auth client and server configuration |
| `messages/` | Translation JSON files (`en.json`, `zh.json`) |
| `generated/` | Prisma generated types (excluded from linting) |

### Database Models

**Content:**
- `Sermon` — title, speaker, date, type (SERMON|SUNDAY_SCHOOL|RETREAT_MESSAGE|BAPTISM_CLASS), series, scripture, video/audio URLs
- `News` — title, date, content, excerpt, status (DRAFT|PUBLISHED|ARCHIVED)
- `Announcement` — bilingual title/content, priority, audience, status, schedule
- `Event` — bilingual, type, recurrence, status; has `EventRegistration`
- `ContentPage` — slug-based bilingual CMS pages with `ContentRevision` and `MediaAsset`

**Users & Access:**
- `User` — mirrors Stack Auth user; stores userId, email, name, status
- `Role` — named roles with description
- `Permission` — resource+action permissions
- `RolePermission` — join: roles ↔ permissions
- `UserRole` — join: users ↔ roles
- `AuditLog` — full audit trail of admin actions

**Members:**
- `Member` — church member profile, status (PENDING|ACTIVE|INACTIVE|REJECTED)
- `PrayerRequest` — member prayer requests, status (PENDING|PRAYED)

**Tools:**
- `Hymn` — bilingual hymn lyrics for PPT generation
- `PptTemplate` — PPT styling templates
- `WorshipOrder` / `WorshipOrderItem` — worship order builder
- `TranslationSession` / `TranslationEntry` — live translation sessions

### API Patterns

All API routes follow this pattern:
- Zod schemas from `lib/validations.ts` (public) or `lib/admin-validations.ts` (admin)
- Paginated responses: `{ data, pagination: { page, limit, total, totalPages } }`
- Query params: `page`, `limit`, `sortBy`, `sortOrder`, plus model-specific filters
- Admin routes check permissions via `lib/permissions.ts` and log actions via `lib/audit.ts`

### i18n Routing
- `src/proxy.ts` handles locale detection (Next.js 16 middleware convention)
- All public pages under `app/[locale]/`
- Use `useTranslations` hook; translation keys in `messages/*.json`

### Authentication & Authorization
- `StackProvider` wraps app in root layout
- `stackClientApp` for client-side, `stackServerApp` for server-side
- RBAC: users have roles → roles have permissions
- Permission key format: `resource:action` (e.g. `sermons:write`, `members:read`)
- `requirePermission()` in `lib/admin-auth.ts` guards admin API routes

### dark-blue Design System

- **CSS**: `globals.css` imports `dark-blue/styles.css`, then `@theme` registers tokens with Tailwind v4
- **Tailwind config**: `tailwind.config.mjs` maps `--primary`, `--muted`, etc. to Tailwind colors; `important: true` overrides Stack Auth styles
- **Components**: Button, Card, Badge, Alert, Input, Select, Label, Tabs, Pagination, Breadcrumb, Carousel, Dropdown, Skeleton, Footer, MediaPlayer, etc.
- **`cn()` utility**: defined locally in `src/lib/utils.ts` (not from dark-blue)
- **Root dep**: `dark-blue` must be in both root and `apps/sccny/package.json`

## Environment Variables

```bash
DATABASE_URL                              # Pooled connection string
DATABASE_URL_UNPOOLED                     # Unpooled (for migrations)
NEXT_PUBLIC_STACK_PROJECT_ID              # Stack Auth project ID
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY  # Stack Auth public key
STACK_SECRET_SERVER_KEY                   # Stack Auth server key
CRON_SECRET                               # Secret for cron endpoints
```

## Deployment

- Hosted on Vercel
- Weekly cron (Friday 2 AM UTC): `/api/tasks/sync-sermons` syncs sermons from legacy site
- News sync available via `/api/tasks/sync-news`
