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
- **Framework**: Next.js 16.1.5 with App Router, React 19
- **Database**: PostgreSQL with Prisma 7.3.0 using `@prisma/adapter-pg`
- **Auth**: Stack Auth (`@stackframe/stack`) - configured in `/src/stack/`
- **i18n**: next-intl with Chinese (zh) as default, English (en) secondary
- **Styling**: Tailwind CSS v4 + [dark-blue](https://www.npmjs.com/package/dark-blue) design system (token-based, light/dark mode)
- **Validation**: Zod 4

### Key Directories (apps/sccny/src)
- `app/api/` - REST API routes for sermons and news
- `app/[locale]/` - Localized pages (en/zh)
- `components/` - React components including `sermons/` and `news/` subdirectories
- `lib/db.ts` - Prisma singleton with connection pooling
- `lib/sermon-scraper.ts`, `lib/news-scraper.ts` - Content scrapers for scc-ny.org
- `stack/` - Stack Auth client and server configuration
- `messages/` - Translation JSON files (en.json, zh.json)
- `generated/` - Prisma generated types (excluded from linting)

### Database Models
- **Sermon**: title, speaker, date, type (SERMON|SUNDAY_SCHOOL|RETREAT_MESSAGE|BAPTISM_CLASS), series, scripture, video/audio URLs
- **News**: title, date, content, excerpt, status (DRAFT|PUBLISHED|ARCHIVED)

### API Patterns
All API routes in `/api/` follow this pattern:
- Use Zod schemas from `lib/validations.ts` for request/response validation
- Return paginated responses with `{ data, pagination }` structure
- Support query params: `page`, `limit`, `sortBy`, `sortOrder`, plus model-specific filters

### i18n Routing
- Proxy in `src/proxy.ts` handles locale detection (renamed from `middleware.ts` per Next.js 16 convention)
- All public pages nested under `app/[locale]/`
- Use `useTranslations` hook and translation keys from `messages/*.json`

### Authentication Flow
- `StackProvider` wraps app in root layout
- `stackClientApp` for client-side auth operations
- `stackServerApp` for server-side auth (inherits from client)

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

## Deployment

- Hosted on Vercel
- Cron job runs weekly (Friday 2 AM UTC) to sync sermons via `/api/tasks/sync-sermons`
