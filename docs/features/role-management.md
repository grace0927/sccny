# Role Management

## Overview

Define and manage roles that group permissions together. Roles like "Pastor", "Deacon", "Media Team", and "Admin" determine what each user can do in the admin portal.

## Core Objectives

- **Role CRUD**: Create, edit, and delete custom roles
- **Permission Grouping**: Assign sets of permissions to each role
- **User Assignment**: View and manage which users hold each role
- **System Roles**: Built-in roles that cannot be deleted

## Functionality

- Create/edit/delete roles with name and description
- Assign a set of permissions to each role via checkbox matrix
- View which users are assigned to each role
- System (built-in) roles cannot be deleted but can have permissions adjusted
- Default roles seeded on first setup:
  - `SUPER_ADMIN` — full access, system role
  - `ADMIN` — full access except user/role management
  - `PASTOR` — sermons, events, announcements, member view
  - `DEACON` — events, announcements, member view
  - `MEDIA_TEAM` — sermons, content, media upload
  - `MEMBER` — member corner access only

## Prisma Schema Additions

```prisma
model Role {
  id          String           @id @default(cuid())
  name        String           @unique
  description String?
  isSystem    Boolean          @default(false) // Prevents deletion of built-in roles
  permissions RolePermission[]
  users       UserRole[]
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@map("roles")
}

model UserRole {
  id         String   @id @default(cuid())
  userId     String   // Stack Auth user ID
  roleId     String
  role       Role     @relation(fields: [roleId], references: [id])
  assignedBy String?  // Stack Auth user ID of assigner
  assignedAt DateTime @default(now())

  @@unique([userId, roleId])
  @@map("user_roles")
}

model Permission {
  id          String           @id @default(cuid())
  key         String           @unique  // e.g. "sermons.create"
  name        String                    // e.g. "Create Sermons"
  description String?
  resource    String                    // e.g. "sermons"
  action      String                    // e.g. "create"
  roles       RolePermission[]

  @@map("permissions")
}

model RolePermission {
  roleId       String
  permissionId String
  role         Role       @relation(fields: [roleId], references: [id])
  permission   Permission @relation(fields: [permissionId], references: [id])

  @@id([roleId, permissionId])
  @@map("role_permissions")
}
```

## Components

| Component | Purpose |
|-----------|---------|
| `RoleTable` | List of roles with user count and permission summary |
| `RoleForm` | Create/edit role with name, description fields |
| `PermissionMatrix` | Grid: rows = permissions grouped by resource, columns = checkboxes |
| `RoleUserList` | List of users assigned to a specific role, with remove action |
| `RoleAssignDialog` | Assign a role to a user (used from User Management) |

## Pages

| Route | Description |
|-------|-------------|
| `app/[locale]/admin/roles/page.tsx` | Role list with permission matrix |
| `app/[locale]/admin/roles/[id]/page.tsx` | Role detail: edit permissions, view assigned users |

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/admin/roles` | List all roles with permission and user counts |
| `POST` | `/api/admin/roles` | Create new role |
| `GET` | `/api/admin/roles/[id]` | Get role with full permissions and user list |
| `PATCH` | `/api/admin/roles/[id]` | Update role name/description |
| `DELETE` | `/api/admin/roles/[id]` | Delete role (fails for system roles) |
| `PATCH` | `/api/admin/roles/[id]/permissions` | Update role's permission set |
| `POST` | `/api/admin/roles/[id]/users` | Assign user to role |
| `DELETE` | `/api/admin/roles/[id]/users/[userId]` | Remove user from role |

## Seed Script

A Prisma seed script (`prisma/seed.ts`) to populate:
1. All permission records (one per resource-action pair)
2. Default system roles with their permission assignments

## i18n Keys

Add `"RoleManagement"` namespace.

## Permissions Required

- `roles.view` — view role list
- `roles.create` — create roles
- `roles.edit` — edit roles and their permissions
- `roles.delete` — delete non-system roles
- `roles.assign` — assign/remove users from roles

## Dependencies

- Requires: Admin Infrastructure
- Existing: `dark-blue`, `zod`, Prisma
- No new npm packages
