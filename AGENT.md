# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SCCNY (Suffolk Chinese Christian Church of New York) is a Turborepo monorepo containing a Next.js 16 church website with bilingual support (English/Chinese), sermon management, and news content scraped from the legacy church website.

## Commands

```bash
# Development
npm run dev          # Start development server (runs from root)
npm run build        # Build all apps
npm run lint         # Lint with ESLint 9

# Database (run from apps/sccny)
npx prisma generate  # Generate Prisma client
npx prisma migrate dev --name <migration_name>  # Create migration
npx prisma db push   # Push schema changes without migration
npx prisma studio    # Open Prisma Studio GUI
```

## Architecture

### Monorepo Structure
- `/apps/sccny` - Main Next.js 16 application
- Root `package.json` uses npm workspaces with Turborepo orchestration

### Tech Stack
- **Framework**: Next.js 16.1.5 with App Router, React 19
- **Database**: PostgreSQL with Prisma 7.3.0 using `@prisma/adapter-pg`
- **Auth**: Stack Auth (`@stackframe/stack`) - configured in `/src/stack/`
- **i18n**: next-intl with Chinese (zh) as default, English (en) secondary
- **Styling**: Tailwind CSS v4 + DaisyUI 5
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
- Middleware in `src/middleware.ts` handles locale detection
- All public pages nested under `app/[locale]/`
- Use `useTranslations` hook and translation keys from `messages/*.json`

### Authentication Flow
- `StackProvider` wraps app in root layout
- `stackClientApp` for client-side auth operations
- `stackServerApp` for server-side auth (inherits from client)

## Environment Variables

Required variables (see turbo.json for full list):
- `DATABASE_URL` - PostgreSQL connection string
- `STACK_SECRET_SERVER_KEY` - Stack Auth server key
- `CRON_SECRET` - Secret for cron job endpoints

## Deployment

- Hosted on Vercel
- Cron job runs weekly (Friday 2 AM UTC) to sync sermons via `/api/tasks/sync-sermons`
