# SCCNY Monorepo

A [Turborepo](https://turbo.build/repo) monorepo containing the SCCNY (Suffolk Chinese Christian Church of New York) website — a full-stack church platform built with [Next.js 16](https://nextjs.org).

## Project Structure

```
├── apps/
│   └── sccny/           # Main Next.js application
│       ├── src/         # Application source code
│       ├── prisma/      # Database schema & migrations
│       ├── package.json # App-specific dependencies
│       └── next.config.mjs
├── docs/                # Project documentation & roadmap
│   ├── TODO.md          # Phased feature roadmap
│   ├── PROJECT_SPEC.md  # Technical specification
│   └── features/        # Detailed feature plans
├── turbo.json           # Turborepo configuration
└── package.json         # Root workspace configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (enabled via `corepack enable pnpm`)
- PostgreSQL database (Neon recommended)
- Stack Auth project (for authentication)

### Installation

```bash
pnpm install
```

### Environment Variables

Copy `.env.example` to `.env.development.local` and fill in:

```bash
DATABASE_URL="postgresql://..."          # Pooled connection
DATABASE_URL_UNPOOLED="postgresql://..." # For migrations
NEXT_PUBLIC_STACK_PROJECT_ID="..."
NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY="..."
STACK_SECRET_SERVER_KEY="..."
CRON_SECRET="..."
```

### Development

```bash
pnpm dev    # Start development server at http://localhost:3000
pnpm build  # Build all apps
pnpm lint   # Lint all apps
pnpm start  # Start production server
```

### Database Commands

Run from `apps/sccny/`:

```bash
pnpm exec prisma generate                          # Regenerate Prisma client
pnpm exec prisma migrate dev --name <name>         # Create and apply migration
pnpm exec prisma db push                           # Push schema without migration
pnpm exec prisma studio                            # Open Prisma Studio GUI
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.6 (App Router) + React 19 |
| Language | TypeScript |
| Database | PostgreSQL (Neon) via Prisma 7 |
| Auth | Stack Auth (`@stackframe/stack`) |
| Styling | Tailwind CSS v4 + `dark-blue` design system |
| i18n | next-intl (Chinese default, English secondary) |
| Validation | Zod 4 |
| Build | Turborepo + pnpm workspaces |
| Deploy | Vercel |

## Features

- **Bilingual** — Full English/Chinese support with next-intl
- **Sermon Management** — Admin CRUD + auto-sync from legacy church site
- **Admin Portal** — Role-based access control, audit logging, user management
- **Member System** — Member registration, approval workflow, member corner
- **Content CMS** — Bilingual pages with revision history and media assets
- **Events** — Event management with registration and recurrence
- **Announcements** — Priority/audience-targeted bilingual announcements
- **Tools** — Live translation operator interface, PPT worship order generation
- **Analytics** — Vercel Analytics integration

## Documentation

- [Roadmap & Feature Status](docs/TODO.md)
- [Technical Specification](docs/PROJECT_SPEC.md)
- [Feature Plans](docs/features/)
- [AI Agent Guidance](CLAUDE.md)

## Deploy on Vercel

The project is configured for Vercel deployment. See [turbo.json](turbo.json) for the full list of required environment variables. A weekly cron job syncs sermon content from the legacy church website every Friday at 2 AM UTC.
