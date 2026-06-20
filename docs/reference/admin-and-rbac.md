# Reference: Admin Shell, RBAC & Audit

Current-state architecture for the admin area, role-based access control, and audit logging. For forward-looking specs see `docs/features/admin-infrastructure.md`, `role-management.md`, `permission-management.md`, `user-management.md`, `audit-log.md`.

## Admin shell & layout
- `app/[locale]/admin/layout.tsx` — wraps the subtree in `PermissionsProvider` (fetches the current user's permissions once) + `AdminShell`.
- `components/admin/AdminShell.tsx` — `AdminSidebar` + `AdminTopBar` + scrollable `<main>`.
- `components/admin/AdminSidebar.tsx` — static `sidebarItems` array; each item `{ key, href, permission?, icon }`. Items are filtered by `usePermissions().hasPermission`. Labels come from `messages` namespace `Admin.sidebar.<key>`. Active state: exact match for `/admin` and `/admin/ppt` (they have nested sibling routes), prefix match otherwise. **Adding an admin page = add a `sidebarItems` entry + `Admin.sidebar.<key>` in both `en.json`/`zh.json`.**
- Shared admin UI: `ConfirmDialog`, `StatusBadge`, `PermissionGate` (renders children only if the user holds a permission), `PermissionsProvider`/`usePermissions` (`lib/permissions-client.ts`).

## Admin API pattern
Every route under `app/api/admin/` follows this shape (canonical example: `app/api/admin/sermons/route.ts`):
```ts
const user = await getAdminUser();           // lib/admin-auth.ts → Stack Auth user or null
if (!user) return unauthorizedResponse();    // 401
await requirePermission(user.id, "resource.action");  // throws PermissionError → 403
const query = SomeZodSchema.parse(searchParams);      // lib/admin-validations.ts
// ... prisma work ...
await logAction({ userId: user.id, userName, action, resourceType, resourceId, oldValues, newValues }); // mutations only
return NextResponse.json({ data, pagination: { page, limit, total, totalPages } });
```
- `catch`: `PermissionError` → `forbiddenResponse()` (403); `error.name === "ZodError"` → 400 with `details` (Zod v4 — do **not** use `instanceof ZodError`); else log + 500.
- `lib/admin-auth.ts` exports only `getAdminUser()`, `unauthorizedResponse()`, `forbiddenResponse()`. Auth identity comes from `stackServerApp.getUser()`.

## RBAC
- Model chain: `User → UserRole → Role → RolePermission → Permission`. Permission keys are dot notation `resource.action` (e.g. `sermons.edit`, `community.manage`).
- `lib/permissions.ts` (server): `getUserPermissions(userId)`, `hasPermission(userId, key)`, `requirePermission(userId, key)` (throws `PermissionError`).
- `lib/permissions-client.ts` (client): `PermissionsContext`, `usePermissions()` → `{ permissions, hasPermission }`.
- Seeded roles (`prisma/seed.ts`): `SUPER_ADMIN`, `ADMIN`, `PASTOR`, `DEACON`, `MEDIA_TEAM`, `PPT_OPERATOR`, `MEMBER`.
- Seeded permission keys by resource:
  - `members.*` view/create/edit/approve/deactivate/export/import
  - `users.*` view/edit/invite/disable/roles
  - `roles.*` view/create/edit/delete/assign
  - `sermons.*` view/create/edit/delete/sync
  - `news.*` view/create/edit/delete
  - `announcements.*` view/create/edit/delete
  - `events.*` view/create/edit/delete/registrations
  - `content.*` view/edit/publish · `media.*` upload/delete
  - `hymns.*` view/create/edit/delete
  - `templates.*` view/create/edit (PPT templates)
  - `ppt.*` view/create/edit/delete/generate (+ legacy alias `tools.ppt.generate`)
  - `translation.operate` (+ legacy alias `tools.translation.operate`)
  - `audit.*` view/export · `community.manage`

Admin routes: `app/api/admin/roles` (+ `[id]/permissions`, `[id]/users`), `permissions` (+ `mine`), `users` (+ `invite`/`[id]/enable`/`disable`/`roles`).

## Audit log
- `lib/audit.ts` `logAction(input)` writes an `AuditLog` row. `action` is a fixed union: `CREATE | UPDATE | DELETE | LOGIN | EXPORT | SYNC | APPROVE | REJECT | DEACTIVATE | REACTIVATE | INVITE | DISABLE | ENABLE`. Call it after every admin mutation with `oldValues`/`newValues`.
- Surfaced at `app/[locale]/admin/audit-log` via `components/admin/AuditLogViewer.tsx`; API `app/api/admin/audit-log` (+ `export` for CSV, gated by `audit.export`).
