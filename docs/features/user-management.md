# User Management

## Overview

Manage Stack Auth user accounts — view all registered users, see their membership status, enable/disable accounts, and invite new users. This is the bridge between the authentication system (Stack Auth) and the local Member data model.

## Core Objectives

- **User Directory**: View all Stack Auth users with their metadata and membership status
- **Account Control**: Enable/disable user accounts
- **Invitations**: Invite new users via email
- **Role Assignment**: Assign roles to users (links to Role Management)
- **Membership Visibility**: See each user's membership status (Pending/Active/Inactive/Rejected) at a glance

## Relationship to Member Management

User Management and Member Management work together but serve different purposes:

| Concern | User Management | Member Management |
|---------|-----------------|-------------------|
| **Data source** | Stack Auth (external) | Local Prisma `Member` table |
| **Scope** | Authentication, account access | Church membership, profile, groups |
| **Key actions** | Enable/disable accounts, assign roles | Approve/reject requests, manage profiles |
| **Who** | All people with an account | People who requested or have membership |

The link between the two is `Member.userId` which stores the Stack Auth user ID. When a user signs up, a Member record is auto-created with status `PENDING`. The admin approves membership via Member Management, and assigns roles via User Management.

## Functionality

- List all Stack Auth users with email, last login, created date, linked member status
- See membership status inline: PENDING (needs approval), ACTIVE, INACTIVE, REJECTED, or "No request" (admin-only accounts)
- Disable/enable user accounts via Stack Auth API
- Invite new users by email (sends Stack Auth invitation)
- View and manage user's assigned roles
- Search users by name or email
- Quick link to the linked Member record in Member Management

## Components

| Component | Purpose |
|-----------|---------|
| `UserTable` | List of Stack Auth users with membership status badge and role badges |
| `UserDetail` | Full user view: auth info + linked member status + role assignments |
| `UserInviteDialog` | Email invite form with optional role pre-assignment |
| `UserRoleManager` | Checkbox list to assign/remove roles for a user |
| `MemberStatusChip` | Inline badge showing linked member's status (Pending/Active/etc.) |

## Pages

| Route | Description |
|-------|-------------|
| `app/[locale]/admin/users/page.tsx` | User list with search and filters |
| `app/[locale]/admin/users/[id]/page.tsx` | User detail with membership status and roles |

## API Endpoints

All endpoints use Stack Auth's server-side SDK (`stackServerApp`) combined with local database queries.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/admin/users` | List users (Stack Auth + join with Member status) |
| `GET` | `/api/admin/users/[id]` | Get user detail |
| `PATCH` | `/api/admin/users/[id]` | Update user metadata |
| `POST` | `/api/admin/users/invite` | Send email invitation |
| `POST` | `/api/admin/users/[id]/disable` | Disable user account |
| `POST` | `/api/admin/users/[id]/enable` | Enable user account |
| `GET` | `/api/admin/users/[id]/roles` | List user's roles |
| `PATCH` | `/api/admin/users/[id]/roles` | Update user's role assignments |

## Data Flow

```
User signs up via Stack Auth
        ↓
Stack Auth account created (email, password)
        ↓
Member record auto-created (status = PENDING)
        ↓
Admin sees user in User Management with "Pending" membership badge
        ↓
Admin clicks through to Member Management to approve/reject
        ↓
Admin assigns roles in User Management (optional)
```

The `Member.userId` field stores the Stack Auth user ID, creating a 1:1 link. Not all Stack Auth users must have a Member record (e.g., admin-only accounts that were created before the membership system), though the default flow auto-creates one.

## Zod Validation Schemas

```typescript
UserInviteSchema        // email (required), roles[] (optional)
UserUpdateSchema        // metadata (optional)
UserRoleUpdateSchema    // roleIds: string[]
GetUsersQuerySchema     // page, limit, search, memberStatus, role, sortBy, sortOrder
```

## i18n Keys

Add `"UserManagement"` namespace covering:
- Table headers, detail labels, invite dialog text
- Status labels (Active, Disabled), membership status labels
- Confirmation messages for enable/disable actions

## Permissions Required

- `users.view` — view user list and details
- `users.edit` — update user metadata
- `users.invite` — send invitations
- `users.disable` — disable/enable accounts
- `users.roles` — assign/remove roles

## Dependencies

- Requires: Admin Infrastructure, Member model, Role/Permission models
- Existing: `@stackframe/stack`, `dark-blue`, `zod`
- No new npm packages (Stack Auth SDK handles user operations)
