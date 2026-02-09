# Permission Management

## Overview

Define granular permissions that are assigned to roles. Permissions control what actions each role can perform across all admin modules. This feature works in tandem with Role Management.

## Core Objectives

- **Permission Registry**: Central list of all permission keys
- **Resource Grouping**: Permissions organized by resource (Sermons, Members, Events, etc.)
- **Permission Check Utility**: Reusable function for API routes and UI components
- **Seed Script**: Auto-populate permissions on deployment

## Permission Keys

Permissions follow the convention `resource.action`:

| Resource | Permissions |
|----------|-------------|
| `sermons` | `sermons.view`, `sermons.create`, `sermons.edit`, `sermons.delete`, `sermons.sync` |
| `news` | `news.view`, `news.create`, `news.edit`, `news.delete` |
| `members` | `members.view`, `members.create`, `members.edit`, `members.approve`, `members.deactivate`, `members.export`, `members.import` |
| `events` | `events.view`, `events.create`, `events.edit`, `events.delete`, `events.registrations` |
| `announcements` | `announcements.view`, `announcements.create`, `announcements.edit`, `announcements.delete` |
| `content` | `content.view`, `content.edit`, `content.publish` |
| `media` | `media.upload`, `media.delete` |
| `users` | `users.view`, `users.edit`, `users.invite`, `users.disable`, `users.roles` |
| `roles` | `roles.view`, `roles.create`, `roles.edit`, `roles.delete`, `roles.assign` |
| `audit` | `audit.view`, `audit.export` |
| `tools` | `tools.translation.operate`, `tools.ppt.generate` |

## Utility Functions (`lib/permissions.ts`)

```typescript
// Check if a user has a specific permission
async function hasPermission(userId: string, permissionKey: string): Promise<boolean>

// Middleware helper for API routes — throws 403 if unauthorized
async function requirePermission(userId: string, permissionKey: string): Promise<void>

// Get all permissions for a user (aggregated from all their roles)
async function getUserPermissions(userId: string): Promise<string[]>

// Client-side hook for conditional UI rendering
function usePermissions(): { permissions: string[], hasPermission: (key: string) => boolean }
```

## Components

| Component | Purpose |
|-----------|---------|
| `PermissionMatrix` | Grid showing roles (columns) vs permissions (rows) with checkboxes. Shared with Role Management. |
| `PermissionGroupList` | Read-only list of all permissions grouped by resource |
| `PermissionGate` | React wrapper component that conditionally renders children based on permission |

### PermissionGate Usage

```tsx
<PermissionGate permission="sermons.edit">
  <Button>Edit Sermon</Button>
</PermissionGate>
```

## Pages

Permission management is integrated into the Role Management page as a tab or section — no separate dedicated page. The permission matrix is displayed within `app/[locale]/admin/roles/[id]/page.tsx`.

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/admin/permissions` | List all permissions grouped by resource |
| `GET` | `/api/admin/permissions/mine` | Get current user's effective permissions |

## Seed Script

The Prisma seed script (shared with Role Management) populates all permission records:

```typescript
// prisma/seed.ts
const permissions = [
  { key: "sermons.view", name: "View Sermons", resource: "sermons", action: "view" },
  { key: "sermons.create", name: "Create Sermons", resource: "sermons", action: "create" },
  // ... all permissions
];

for (const perm of permissions) {
  await prisma.permission.upsert({
    where: { key: perm.key },
    update: {},
    create: perm,
  });
}
```

## Integration Pattern

Every admin API route follows this pattern:

```typescript
export async function POST(request: NextRequest) {
  const user = await stackServerApp.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await requirePermission(user.id, "sermons.create");

  // ... handle request
}
```

Every admin UI component uses the client-side hook:

```typescript
const { hasPermission } = usePermissions();

return (
  <>
    {hasPermission("sermons.edit") && <EditButton />}
  </>
);
```

## i18n Keys

Permission names and descriptions should be translatable for the admin UI permission matrix.

## Dependencies

- Requires: Role Prisma models (Role, Permission, RolePermission, UserRole)
- Existing: Prisma, `@stackframe/stack`
- No new npm packages
