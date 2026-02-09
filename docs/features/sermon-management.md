# Sermon Management (Admin)

## Overview

Admin CRUD interface for sermons, complementing the existing scraper-only flow. Allows admins to manually create, edit, and manage sermons with media links, and to manually trigger the scraper sync.

## Core Objectives

- **Full Admin CRUD**: Create, edit, delete sermons from the admin panel
- **Media Management**: Link audio/video files to sermons
- **Scraper Integration**: Manual trigger for the existing sermon scraper
- **Bulk Operations**: Multi-select delete, type change

## Functionality

- Paginated sermon list with all existing filters (search, speaker, series, type)
- Create new sermon with all fields: title, speaker, date, type, series, scripture, description, audio/video URLs
- Edit existing sermons inline or via detail page
- Delete sermons (with confirmation)
- Bulk actions: delete multiple, change type for multiple
- Manual trigger for `/api/tasks/sync-sermons` from admin UI
- View sync history and last sync timestamp

## Components

| Component | Purpose |
|-----------|---------|
| `SermonAdminTable` | Data table reusing existing filter logic, with edit/delete actions per row |
| `SermonAdminForm` | Create/edit form dialog with all sermon fields and Zod validation |
| `SermonBulkActions` | Toolbar for multi-select operations (delete, change type) |
| `SyncControls` | Button to trigger manual sync + last sync timestamp display |

## Pages

| Route | Description |
|-------|-------------|
| `app/[locale]/admin/sermons/page.tsx` | Sermon list with admin actions |
| `app/[locale]/admin/sermons/[id]/page.tsx` | Sermon detail/edit view |

## API Endpoints

Existing endpoints already provide most functionality. Additions:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `PATCH` | `/api/sermons/[id]` | Update sermon (add auth guard) |
| `DELETE` | `/api/sermons/[id]` | Delete sermon (add auth guard) |
| `POST` | `/api/admin/sermons/sync` | Manual sync trigger |
| `POST` | `/api/admin/sermons/bulk` | Bulk operations (delete, change type) |

**Note:** The existing `GET /api/sermons` and `POST /api/sermons` routes remain unchanged but need auth guards added for write operations.

## Zod Validation Schemas

Already defined in `lib/validations.ts`:
- `SermonCreateSchema` — used for creation
- `SermonUpdateSchema` — used for updates
- `GetSermonsQuerySchema` — used for list filtering

New addition:
```typescript
SermonBulkActionSchema // { ids: string[], action: "delete" | "changeType", type?: SermonType }
```

## Auth Guards

- Read operations: public (no change)
- Write operations (POST, PATCH, DELETE, bulk): require `sermons.edit` permission
- Sync trigger: require `sermons.sync` permission

## Permissions Required

- `sermons.view` — view sermon list (public, no guard)
- `sermons.create` — create sermons
- `sermons.edit` — edit sermons
- `sermons.delete` — delete sermons
- `sermons.sync` — trigger manual sync

## Dependencies

- Requires: Admin Infrastructure, Permission system
- Existing: `dark-blue`, `zod`, sermon API routes, scraper
- No new npm packages
