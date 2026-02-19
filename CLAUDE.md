# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SCCNY (Suffolk Chinese Christian Church of New York) is a Turborepo monorepo containing a Next.js 16 church website with bilingual support (English/Chinese), sermon management, and news content scraped from the legacy church website.

## Commands

```bash
# Development
pnpm dev             # Start development server (runs from root)
pnpm build           # Build all apps
pnpm lint            # Lint with ESLint 9

# Database (run from apps/sccny)
pnpm exec prisma generate  # Generate Prisma client
pnpm exec prisma migrate dev --name <migration_name>  # Create migration
pnpm exec prisma db push   # Push schema changes without migration
pnpm exec prisma studio    # Open Prisma Studio GUI
```

## Architecture

### Monorepo Structure
- `/apps/sccny` - Main Next.js 16 application
- Root `package.json` uses pnpm workspaces (`pnpm-workspace.yaml`) with Turborepo orchestration

### Tech Stack
- **Framework**: Next.js 16.1.6 with App Router, React 19
- **Database**: PostgreSQL (Neon) with Prisma 7.4.0 using `@prisma/adapter-pg`
- **Auth**: Stack Auth (`@stackframe/stack` v2.8.69) - configured in `/src/stack/`
- **i18n**: next-intl v4.8.3 with Chinese (zh) as default, English (en) secondary
- **Styling**: Tailwind CSS v4 + [dark-blue](https://www.npmjs.com/package/dark-blue) design system (token-based, light/dark mode)
- **Validation**: Zod 4.3.6

### Key Directories (apps/sccny/src)
- `app/api/` - REST API routes (public + admin, ~42 route files)
- `app/[locale]/` - Localized pages (en/zh), including `admin/` subtree
- `components/admin/` - Admin UI components (tables, forms, dialogs, shells)
- `components/sermons/`, `components/news/` - Public content components
- `components/member-corner/` - Member self-service components
- `components/tools/` - Ministry tool components (translation, PPT)
- `lib/db.ts` - Prisma singleton with connection pooling
- `lib/validations.ts` - Zod schemas for public API
- `lib/admin-validations.ts` - Zod schemas for admin API
- `lib/permissions.ts`, `lib/permissions-client.ts` - RBAC helpers
- `lib/admin-auth.ts` - Admin authentication middleware
- `lib/audit.ts` - Audit logging helpers
- `lib/sermon-scraper.ts`, `lib/news-scraper.ts` - Content scrapers for scc-ny.org
- `stack/` - Stack Auth client and server configuration
- `messages/` - Translation JSON files (en.json, zh.json)
- `generated/` - Prisma generated types (excluded from linting)

### Database Models

**Content:**
- **Sermon**: title, speaker, date, type (SERMON|SUNDAY_SCHOOL|RETREAT_MESSAGE|BAPTISM_CLASS), series, scripture, video/audio URLs
- **News**: title, date, content, excerpt, status (DRAFT|PUBLISHED|ARCHIVED)
- **Announcement**: bilingual title/content, priority, audience, status, schedule dates
- **Event**: bilingual, type, recurrence, status; related **EventRegistration** (REGISTERED|CANCELLED|ATTENDED)
- **ContentPage**: slug-based bilingual CMS pages with **ContentRevision** history and **MediaAsset**

**Users & Access:**
- **User**: mirrors Stack Auth user; userId, email, name, status
- **Role** / **Permission** / **RolePermission**: RBAC — roles have named permissions
- **UserRole**: join table linking users to roles
- **AuditLog**: full audit trail of admin actions (userId, action, resource, old/new values, IP)

**Members:**
- **Member**: church member profile, status (PENDING|ACTIVE|INACTIVE|REJECTED)
- **PrayerRequest**: member prayer requests, status (PENDING|PRAYED)

**Tools:**
- **Hymn**: bilingual hymn lyrics for PPT generation
- **PptTemplate**: PPT styling/layout templates
- **WorshipOrder** / **WorshipOrderItem**: worship order builder with drag-and-drop
- **TranslationSession** / **TranslationEntry**: live translation sessions

### API Patterns
All API routes in `/api/` follow this pattern:
- Public routes use Zod schemas from `lib/validations.ts`; admin routes use `lib/admin-validations.ts`
- Return paginated responses: `{ data, pagination: { page, limit, total, totalPages } }`
- Support query params: `page`, `limit`, `sortBy`, `sortOrder`, plus model-specific filters
- Admin routes guard access with `requirePermission()` from `lib/admin-auth.ts` and write to audit log

Admin routes live under `app/api/admin/` and cover: sermons (+ bulk/sync), users (+ invite/enable/disable), roles, members (+ approval workflow), announcements, events (+ registrations), content CMS (+ revisions/publish), hymns, PPT templates, worship orders, permissions, and audit log.

### i18n Routing
- Proxy in `src/proxy.ts` handles locale detection (renamed from `middleware.ts` per Next.js 16 convention)
- All public pages nested under `app/[locale]/`
- Use `useTranslations` hook and translation keys from `messages/*.json`

### Authentication & Authorization Flow
- `StackProvider` wraps app in root layout
- `stackClientApp` for client-side auth operations
- `stackServerApp` for server-side auth (inherits from client)
- RBAC: users → roles → permissions; permission key format is `resource:action` (e.g. `sermons:write`)
- `requirePermission()` in `lib/admin-auth.ts` guards all admin API routes
- `PermissionGate` component controls UI visibility on the client side

### dark-blue Design System Integration

All UI components come from the `dark-blue` npm package (our own design system). Key integration points:

- **CSS**: `src/app/globals.css` imports `dark-blue/styles.css` for token definitions, then uses `@theme` to register tokens with Tailwind v4. A `@config` directive loads `tailwind.config.mjs` for the v3-compatible color palette.
- **Tailwind config**: `tailwind.config.mjs` maps CSS custom properties (e.g. `--primary`, `--muted`) to Tailwind colors via `hsl(var(--token))`. `important: true` is required to override Stack Auth's scoped CSS utilities.
- **Components**: Import from `dark-blue` — Button, Card, Badge, Alert, Input, Select, Label, Tabs, Pagination, Breadcrumb, Carousel, Dropdown, Skeleton, Footer, MediaPlayer, etc.
- **`cn()` utility**: Defined locally in `src/lib/utils.ts` (not re-exported from dark-blue) to avoid client/server boundary issues with Next.js RSC.
- **Root dependency**: `dark-blue` must be listed in both the root `package.json` and `apps/sccny/package.json` for Turbopack module resolution in the monorepo.

## Environment Variables

Required variables (see turbo.json for full list):
- `DATABASE_URL` - PostgreSQL connection string
- `STACK_SECRET_SERVER_KEY` - Stack Auth server key
- `CRON_SECRET` - Secret for cron job endpoints

## Roadmap & Feature Plans

The full roadmap is at [`docs/TODO.md`](docs/TODO.md). Each feature has a detailed plan in [`docs/features/`](docs/features/) covering functionality, schema additions, components, API endpoints, Zod schemas, and permissions.

Features are organized in four phases (all Phase 0–3 and Live Translation are complete):
1. **Phase 1** ✅ — Admin Infrastructure, Role/Permission Management, Audit Log
2. **Phase 2** ✅ — User Management, Member Management, Member Corner
3. **Phase 3** ✅ — Sermon Admin, Announcements, Events, Content CMS
4. **Phase 4** — Bible Lookup (enhanced), PPT Generation ✅, Live Translation ✅

When implementing a feature, always read its plan in `docs/features/` first and follow the patterns described there.

## Deployment

- Hosted on Vercel
- Cron job runs weekly (Friday 2 AM UTC): `/api/tasks/sync-sermons` syncs sermons from legacy site
- News sync available via `/api/tasks/sync-news`
- Vercel Analytics integrated via `@vercel/analytics`
