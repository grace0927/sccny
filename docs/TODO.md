# SCCNY Roadmap

This document tracks all planned features for the SCCNY web application. Each item links to a detailed feature plan in [`docs/features/`](./features/).

## Legend

| Symbol | Meaning |
|--------|---------|
| :white_check_mark: | Completed |
| :construction: | In Progress |
| :clipboard: | Planned (has feature plan) |

---

## Phase 0: Infrastructure

| Status | Feature | Plan |
|--------|---------|------|
| :white_check_mark: | Switch to PNPM | — |
| :white_check_mark: | Sermon API + Scraper | [sermon-api-implementation.md](./features/sermon-api-implementation.md) |
| :white_check_mark: | News API + Scraper | [news-implementation.md](./features/news-implementation.md) |
| :white_check_mark: | Message Pages (Sermon Recordings, Sunday School, etc.) | [message-pages-implementation.md](./features/message-pages-implementation.md) |

## Phase 1: Auth Foundation & Admin Shell

These are prerequisites for all admin features. Build first.

| Status | Feature | Plan | Dependencies |
|--------|---------|------|--------------|
| :white_check_mark: | Admin Portal Infrastructure | [admin-infrastructure.md](./features/admin-infrastructure.md) | — |
| :white_check_mark: | Role Management | [role-management.md](./features/role-management.md) | Admin Infrastructure |
| :white_check_mark: | Permission Management | [permission-management.md](./features/permission-management.md) | Role Management |
| :white_check_mark: | Audit Log | [audit-log.md](./features/audit-log.md) | Admin Infrastructure |

## Phase 2: User & Member System

User accounts and church member data.

| Status | Feature | Plan | Dependencies |
|--------|---------|------|--------------|
| :white_check_mark: | User Management | [user-management.md](./features/user-management.md) | Phase 1 |
| :white_check_mark: | Member Management | [member-management.md](./features/member-management.md) | Phase 1, User Management |
| :white_check_mark: | Member Corner | [member-corner.md](./features/member-corner.md) | Member Management |

## Phase 3: Content & Sermon Admin

Admin CRUD for existing and new content types.

| Status | Feature | Plan | Dependencies |
|--------|---------|------|--------------|
| :clipboard: | Sermon Management (Admin) | [sermon-management.md](./features/sermon-management.md) | Phase 1 |
| :clipboard: | Announcement Management | [announcement-management.md](./features/announcement-management.md) | Phase 1 |
| :clipboard: | Event Management | [event-management.md](./features/event-management.md) | Phase 1 |
| :clipboard: | Content Management (CMS) | [content-management.md](./features/content-management.md) | Phase 1 |

## Phase 4: Tool Portal

Standalone tools for ministry support.

| Status | Feature | Plan | Dependencies |
|--------|---------|------|--------------|
| :clipboard: | Bible Lookup (Enhanced) | [bible-lookup.md](./features/bible-lookup.md) | — |
| :clipboard: | PPT Generation | [ppt-generation.md](./features/ppt-generation.md) | Bible Lookup (for scripture items) |
| :clipboard: | Live Translation | [live-translation.md](./features/live-translation.md) | Admin Infrastructure (for operator auth) |

---

## Prisma Schema Overview

New models required across all features (cumulative):

| Model | Introduced In |
|-------|---------------|
| `Role` | Role Management |
| `Permission` | Permission Management |
| `RolePermission` | Permission Management |
| `UserRole` | Role Management |
| `AuditLog` | Audit Log |
| `Member` | Member Corner |
| `PrayerRequest` | Member Corner |
| `Event` | Event Management |
| `EventRegistration` | Event Management |
| `Announcement` | Announcement Management |
| `ContentPage` | Content Management |
| `ContentRevision` | Content Management |
| `MediaAsset` | Content Management |
| `TranslationSession` | Live Translation |
| `TranslationEntry` | Live Translation |
| `Hymn` | PPT Generation |
| `PptTemplate` | PPT Generation |
| `WorshipOrder` | PPT Generation |
| `WorshipOrderItem` | PPT Generation |
| `BibleVerse` | Bible Lookup (if local DB approach) |

## New Package Dependencies

| Package | Used By |
|---------|---------|
| `@tiptap/react` + `@tiptap/starter-kit` | Content Management (rich text editor) |
| `@vercel/blob` | Content Management (media upload) |
| `pptxgenjs` | PPT Generation |
| `@hello-pangea/dnd` | PPT Generation (drag-and-drop) |
