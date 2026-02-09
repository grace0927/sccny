# Admin Portal Infrastructure

## Overview

Shared foundation for all admin portal features. Establishes the admin layout shell, route protection, and common patterns that every admin module depends on.

## Core Objectives

- **Admin Layout**: Sidebar + top-bar shell for all admin pages
- **Route Protection**: Auth-gated access using Stack Auth
- **Admin Dashboard**: Summary landing page with key metrics
- **Shared Patterns**: Reusable table, form, and filter components

## Implementation Details

### Admin Layout (`app/[locale]/admin/layout.tsx`)

- Sidebar navigation with links to each admin section (Members, Sermons, News, Events, Announcements, Users, Roles, Audit Log)
- Top bar with user avatar, logout button, and breadcrumb trail
- Uses Stack Auth's `useUser()` to gate access; redirects unauthenticated users to Stack's sign-in page
- Responsive: sidebar collapses to hamburger on mobile
- Bilingual labels from `messages/*.json` under an `"Admin"` namespace

### Middleware Update (`src/middleware.ts`)

- Extend the existing next-intl middleware to intercept `/admin/*` routes
- Check auth session via `stackServerApp.getUser()`
- Redirect to Stack Auth login page if no valid session
- After login, redirect back to the originally requested admin page

### Admin Dashboard (`app/[locale]/admin/page.tsx`)

- Summary cards showing counts: total members, sermons, news articles, events, users
- Recent activity feed from the audit log (last 10 entries)
- Quick-action buttons: "Add Sermon", "Create Event", "New Announcement"
- Uses existing `dark-blue` components: Card, CardContent, CardTitle, Button

### Shared Admin Components

| Component | Purpose |
|-----------|---------|
| `AdminSidebar` | Navigation sidebar with section links and active state |
| `AdminTopBar` | User info, logout, breadcrumbs |
| `DataTable` | Reusable sortable/filterable table with pagination |
| `FormDialog` | Modal dialog for create/edit forms |
| `StatusBadge` | Colored badge for status fields (ACTIVE, DRAFT, etc.) |
| `ConfirmDialog` | Destructive action confirmation modal |
| `BulkActionBar` | Toolbar for multi-select operations |

### API Route Group (`app/api/admin/`)

- All admin endpoints live under `/api/admin/`
- Each route handler calls `stackServerApp.getUser()` and checks permissions before processing
- Shared error response format: `{ error: string, details?: unknown }`
- Shared success format: `{ data, pagination? }`

### i18n Keys

Add `"Admin"` namespace to `en.json` / `zh.json` covering:
- Sidebar labels, dashboard titles, common actions (Save, Cancel, Delete, Edit, Create)
- Confirmation dialog messages
- Table headers and empty-state messages

## File Structure

```
src/
├── app/[locale]/admin/
│   ├── layout.tsx           # Admin shell layout
│   └── page.tsx             # Dashboard
├── components/admin/
│   ├── AdminSidebar.tsx
│   ├── AdminTopBar.tsx
│   ├── DataTable.tsx
│   ├── FormDialog.tsx
│   ├── StatusBadge.tsx
│   ├── ConfirmDialog.tsx
│   └── BulkActionBar.tsx
└── lib/
    ├── admin-auth.ts        # Auth check helpers for API routes
    └── admin-utils.ts       # Shared admin utilities
```

## Dependencies

- Existing: `@stackframe/stack`, `dark-blue`, `next-intl`
- No new npm packages required
