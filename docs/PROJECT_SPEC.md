# SCCNY Website — Project Specification

## Overview

The SCCNY (Suffolk Chinese Christian Church of New York) website is a full-stack church platform built as a Turborepo monorepo. It provides a bilingual public website, an admin portal with RBAC, a member management system, a content CMS, and ministry tools (live translation, PPT generation).

## Project Structure

```
sccny-monorepo/
├── apps/sccny/              # Main Next.js application
│   ├── src/                 # Application source code
│   ├── prisma/              # Database schema and migrations
│   └── package.json         # App-specific dependencies
├── docs/                    # Documentation
│   ├── TODO.md              # Phased roadmap
│   └── features/            # Per-feature implementation plans
├── turbo.json               # Turborepo configuration
└── package.json             # Root workspace configuration
```

## Technical Architecture

### Core Framework

- **Framework**: Next.js 16.1.6 with App Router
- **Language**: TypeScript
- **Build Tool**: Turborepo + pnpm workspaces
- **Runtime**: Node.js 18+

### Frontend Architecture

- **Styling**: Tailwind CSS v4 + [dark-blue](https://www.npmjs.com/package/dark-blue) design system
- **UI Components**: dark-blue — Card, Button, Badge, Alert, Input, Select, Label, Tabs, Pagination, Breadcrumb, Carousel, Dropdown, Skeleton, Footer, MediaPlayer, etc.
- **Icons**: Heroicons (`@heroicons/react`)
- **Fonts**: Inter (via dark-blue tokens), system-ui fallback
- **Drag-and-drop**: `@hello-pangea/dnd` (worship order builder)

### Internationalization (i18n)

- **Library**: next-intl v4.8.3
- **Default locale**: Chinese (`zh`)
- **Secondary locale**: English (`en`)
- **Message files**: `src/messages/en.json`, `src/messages/zh.json`
- **Routing**: `app/[locale]/` with locale detection in `src/proxy.ts`
- **Time zone**: America/New_York

## Database Architecture

### Database Provider

- **Type**: PostgreSQL
- **Provider**: Neon (serverless PostgreSQL)
- **ORM**: Prisma 7.4.0 with `@prisma/adapter-pg`
- **Connection**: pooled `DATABASE_URL` for queries; `DATABASE_URL_UNPOOLED` for migrations

### Schema Models

#### Content

```prisma
model Sermon {
  id          String     @id @default(cuid())
  title       String
  speaker     String
  date        DateTime
  type        SermonType @default(SERMON)
  series      String?
  scripture   String?
  videoUrl    String?
  audioUrl    String?
  description String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  @@map("sermons")
}

// SermonType: SERMON | SUNDAY_SCHOOL | RETREAT_MESSAGE | BAPTISM_CLASS

model News {
  id        String     @id @default(cuid())
  title     String
  date      DateTime
  content   String
  excerpt   String?
  status    NewsStatus @default(DRAFT)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  @@map("news")
}

// NewsStatus: DRAFT | PUBLISHED | ARCHIVED

model Announcement {
  // bilingual title/content, priority, audience, status, publishAt/expiresAt
  @@map("announcements")
}

model Event {
  // bilingual, type, recurrence, status; has EventRegistration join
  @@map("events")
}

model ContentPage {
  // slug-based bilingual pages; has ContentRevision and MediaAsset
  @@map("content_pages")
}
```

#### Users & Access Control

```prisma
model User {
  // userId (Stack Auth), email, name, status; has UserRole
  @@map("users")
}

model Role {
  // name, description; has RolePermission, UserRole
  @@map("roles")
}

model Permission {
  // resource, action, key, name, description; has RolePermission
  @@map("permissions")
}

model RolePermission { /* roles ↔ permissions */ }
model UserRole       { /* users ↔ roles       */ }

model AuditLog {
  // userId, userName, action, resourceType, resourceId,
  // oldValues (JSON), newValues (JSON), ipAddress, userAgent, createdAt
  @@map("audit_logs")
}
```

#### Members

```prisma
model Member {
  // userId, profile fields, status (PENDING|ACTIVE|INACTIVE|REJECTED)
  @@map("members")
}

model PrayerRequest {
  // memberId, content, status (PENDING|PRAYED)
  @@map("prayer_requests")
}
```

#### Tools

```prisma
model Hymn            { /* bilingual lyrics */ }
model PptTemplate     { /* PPT styling options */ }
model WorshipOrder    { /* header + WorshipOrderItem list */ }
model WorshipOrderItem { /* type, content, order */ }
model TranslationSession { /* live sessions */ }
model TranslationEntry   { /* per-entry transcript */ }
```

## API Architecture

### REST API Overview

All responses are JSON. Paginated responses use `{ data: [...], pagination: { page, limit, total, totalPages } }`. All inputs are validated with Zod.

### Public Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/sermons` | List / create sermons |
| GET | `/api/sermons/[id]` | Get single sermon |
| GET/POST | `/api/news` | List / create news |
| GET | `/api/news/[id]` | Get single news item |
| GET | `/api/events` | List events |
| GET | `/api/events/[id]` | Get single event |
| POST | `/api/events/[id]/register` | Register for event |
| GET | `/api/announcements` | List announcements |
| GET/POST | `/api/member/me/*` | Member profile & prayer requests |
| GET/POST | `/api/tools/bible/search` | Bible lookup |
| GET | `/api/tools/ppt/generate` | Generate PPT |
| GET/POST | `/api/tools/translation/sessions` | Translation session management |
| GET/PUT | `/api/tools/translation/sessions/[id]` | Session detail |
| GET | `/api/tools/translation/sessions/[id]/stream` | SSE stream |

### Admin Endpoints (`/api/admin/`)

All admin routes require authentication and resource-action permissions.

| Resource | Operations |
|----------|-----------|
| `sermons` | CRUD + bulk import + sync from legacy site |
| `users` | List, detail, invite, enable, disable; assign roles |
| `roles` | CRUD; manage role permissions and role members |
| `members` | CRUD + approve / reject / deactivate / reactivate + export |
| `announcements` | CRUD |
| `events` | CRUD + list registrations |
| `content` | CRUD by slug + publish + revision history |
| `hymns` | CRUD |
| `templates` | PPT template CRUD |
| `worship-orders` | CRUD |
| `permissions` | List all; list mine |
| `audit-log` | List + export |

### Cron Tasks

| Path | Schedule | Description |
|------|----------|-------------|
| `/api/tasks/sync-sermons` | Weekly, Fri 2 AM UTC | Scrape sermons from legacy site |
| `/api/tasks/sync-news` | On-demand | Scrape news from legacy site |

## Application Features

### Public Pages (`/[locale]/`)

- **Home** — Landing page
- **About** — Confession of faith, creeds, ministries, vision
- **Contact** — Contact information
- **Meeting Times** — Service schedules
- **Messages** — Sermon recordings, Sunday School, Baptism Class, Special Gathering
- **News** — Church news listings and detail
- **Events** — Upcoming events and registration
- **Announcements** — Church announcements
- **Pastoral Search** — Pastoral search information
- **Tools** — Live translation viewer (`/tools/translation/[id]`)

### Admin Portal (`/[locale]/admin/`)

- **Dashboard** — Overview and quick links
- **Sermons** — CRUD table with bulk import and legacy sync
- **Announcements** — CRUD with priority and audience filtering
- **Events** — CRUD with registration management
- **Content** — CMS page editor with bilingual support and revision history
- **Users** — User list, invite, role assignment, enable/disable
- **Roles** — Role CRUD with permission matrix
- **Members** — Approval workflow, status management, export
- **Hymns** — Bilingual hymn library for PPT generation
- **Templates** — PPT template management
- **Worship Orders** — Drag-and-drop worship order builder
- **Translation** — Live translation operator interface
- **Audit Log** — Searchable and exportable audit trail

### Member Corner (`/[locale]/my-account/`)

- Profile management
- Prayer request submission and history

## Authentication & Authorization

### Authentication

Stack Auth (`@stackframe/stack` v2.8.69) handles all user authentication.

- `StackProvider` wraps the root layout
- `stackClientApp` (`src/stack/client.jsx`) — client-side operations
- `stackServerApp` (`src/stack/server.jsx`) — server-side operations (inherits from client)
- `User` model in Prisma mirrors Stack Auth users for RBAC

### Authorization (RBAC)

- **Permission key format**: `resource:action` (e.g. `sermons:write`, `members:read`)
- Users have roles via `UserRole`; roles have permissions via `RolePermission`
- Server: `requirePermission(userId, key)` in `lib/admin-auth.ts` guards API routes
- Client: `PermissionGate` component controls UI visibility; `usePermissions()` hook
- All admin actions are written to `AuditLog`

## dark-blue Design System Integration

- **CSS**: `globals.css` imports `dark-blue/styles.css`, then `@theme` registers tokens with Tailwind v4
- **Tailwind config** (`tailwind.config.mjs`): maps `--primary`, `--muted`, `--accent`, etc. to Tailwind color utilities; `important: true` overrides Stack Auth scoped styles
- **`cn()` utility**: defined in `src/lib/utils.ts` (not re-exported from dark-blue) to avoid RSC boundary issues
- **Root dependency**: `dark-blue` must appear in both root `package.json` and `apps/sccny/package.json` for Turbopack resolution

## Development Workflow

```bash
pnpm install                                       # Install all dependencies
pnpm dev                                           # Start dev server
pnpm build                                         # Production build
pnpm lint                                          # ESLint 9

# From apps/sccny:
pnpm exec prisma generate                          # Regenerate client after schema change
pnpm exec prisma migrate dev --name <migration>    # Create + apply migration
pnpm exec prisma db push                           # Push schema (no migration file)
pnpm exec prisma studio                            # GUI for database inspection
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Pooled PostgreSQL connection string |
| `DATABASE_URL_UNPOOLED` | Unpooled connection (for migrations) |
| `NEXT_PUBLIC_STACK_PROJECT_ID` | Stack Auth project ID |
| `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` | Stack Auth public key |
| `STACK_SECRET_SERVER_KEY` | Stack Auth server key |
| `CRON_SECRET` | Bearer token for cron endpoints |

See `turbo.json` for the full list used in the Turborepo build pipeline.

## Deployment & Infrastructure

- **Platform**: Vercel — automatic deployments from `main` branch
- **Preview environments**: auto-generated per PR
- **Analytics**: `@vercel/analytics` integrated in root layout
- **Monitoring**: Vercel Error Tracking, Prisma query monitoring, Cron monitoring

## Security

- **Authentication**: Stack Auth with project-scoped credentials
- **Authorization**: RBAC with per-resource permissions; all admin routes protected
- **Validation**: Zod schemas on all API inputs; separate schemas for public vs. admin
- **Audit trail**: All admin write operations logged to `AuditLog`
- **HTTPS**: Automatic via Vercel
- **Secrets**: Environment variables; never committed to source

## Feature Development Process

When implementing a new feature:

1. **Read the feature plan** in `docs/features/<feature>.md` — covers schema, components, API, Zod schemas, and permissions
2. **Update the Prisma schema** and create a migration
3. **Add Zod schemas** to `lib/validations.ts` or `lib/admin-validations.ts`
4. **Build API routes** following the existing patterns in `app/api/`
5. **Build components** following patterns in `components/admin/` or `components/`
6. **Add i18n keys** to both `messages/en.json` and `messages/zh.json`
7. **Update `docs/TODO.md`** to mark the feature complete

### Component Standards

- Full TypeScript with proper interfaces
- Both English and Chinese i18n support
- Mobile-first responsive design using dark-blue tokens
- ARIA labels and keyboard navigation

## Current Status

As of February 2026, all features through Phase 3 and partial Phase 4 are implemented:

| Phase | Status |
|-------|--------|
| Phase 0 — Infrastructure (Sermon API, News API, Message Pages) | ✅ Complete |
| Phase 1 — Admin Infrastructure, RBAC, Audit Log | ✅ Complete |
| Phase 2 — User Management, Member Management, Member Corner | ✅ Complete |
| Phase 3 — Sermon Admin, Announcements, Events, Content CMS | ✅ Complete |
| Phase 4 — Live Translation, PPT Generation | ✅ Complete |
| Phase 4 — Bible Lookup (Enhanced) | Planned |

See [TODO.md](TODO.md) for the full per-feature breakdown.
