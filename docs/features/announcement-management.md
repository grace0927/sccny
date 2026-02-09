# Announcement Management

## Overview

Manage church-wide announcements that appear on the home page, in the member corner, and optionally as targeted notices. Separate from the existing News model — announcements are time-boxed, priority-driven internal notices, while news is article-style public content.

## Core Objectives

- **Time-Boxed Display**: Announcements with start/end dates auto-appear and auto-expire
- **Priority System**: Normal, Important, and Urgent levels with visual distinction
- **Audience Targeting**: All visitors vs. members-only
- **Pinning**: Pin important announcements to top of lists
- **Bilingual**: Full en/zh content support

## Functionality

- Create/edit/delete announcements with bilingual content
- Set priority level (NORMAL, IMPORTANT, URGENT)
- Set audience (ALL, MEMBERS_ONLY)
- Schedule display window (startDate — endDate)
- Pin/unpin announcements
- Rich text content with image support
- Draft/Publish/Archive workflow
- View on public site: home page banner for URGENT, announcement list for others

## Prisma Schema Addition

```prisma
model Announcement {
  id          String               @id @default(cuid())
  titleEn     String
  titleZh     String
  contentEn   String               @db.Text
  contentZh   String               @db.Text
  priority    AnnouncementPriority @default(NORMAL)
  audience    AnnouncementAudience @default(ALL)
  startDate   DateTime
  endDate     DateTime?
  isPinned    Boolean              @default(false)
  status      AnnouncementStatus   @default(DRAFT)
  createdById String
  createdAt   DateTime             @default(now())
  updatedAt   DateTime             @updatedAt

  @@map("announcements")
}

enum AnnouncementPriority {
  NORMAL
  IMPORTANT
  URGENT
}

enum AnnouncementAudience {
  ALL
  MEMBERS_ONLY
}

enum AnnouncementStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}
```

## Components

### Admin Components
| Component | Purpose |
|-----------|---------|
| `AnnouncementTable` | List with status/priority badges, date range filters |
| `AnnouncementForm` | Create/edit with rich text, scheduling, priority/audience selectors |
| `AnnouncementPreview` | Preview how the announcement will look on the public site |

### Public Components
| Component | Purpose |
|-----------|---------|
| `AnnouncementBanner` | Full-width banner for URGENT/pinned announcements on home page |
| `AnnouncementList` | List of current announcements (used on home page and member corner) |
| `AnnouncementCard` | Individual announcement card with priority styling |

## Pages

### Admin
| Route | Description |
|-------|-------------|
| `app/[locale]/admin/announcements/page.tsx` | Announcement list/management |

### Public
Announcements display inline on existing pages (home page, member corner) — no dedicated public page needed.

## API Endpoints

### Admin
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/admin/announcements` | Paginated list with filters |
| `POST` | `/api/admin/announcements` | Create announcement |
| `GET` | `/api/admin/announcements/[id]` | Get announcement |
| `PATCH` | `/api/admin/announcements/[id]` | Update announcement |
| `DELETE` | `/api/admin/announcements/[id]` | Delete announcement |

### Public
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/announcements` | Current published announcements (within date window) |

## News vs. Announcements Distinction

| Aspect | News | Announcements |
|--------|------|---------------|
| Content type | Article-style, long-form | Short notice, bulletin-style |
| Lifespan | Permanent (archived, never hidden) | Time-boxed (auto-expires) |
| Priority | No priority system | NORMAL / IMPORTANT / URGENT |
| Audience | Always public | Public or members-only |
| Display | Dedicated news page | Banner, sidebar, member corner |
| Source | Scraped from legacy site + manual | Always manual |

## i18n Keys

Add `"Announcements"` namespace for admin and public labels.

## Permissions Required

- `announcements.view` — view announcement list
- `announcements.create` — create announcements
- `announcements.edit` — edit announcements
- `announcements.delete` — delete announcements

## Dependencies

- Requires: Admin Infrastructure, Permission system
- Existing: `dark-blue`, `zod`, `date-fns`
- No new npm packages
