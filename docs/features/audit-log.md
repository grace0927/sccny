# Audit Log

## Overview

Track all admin actions for accountability and debugging. Every create, update, and delete operation in the admin portal is recorded with who did it, when, and what changed.

## Core Objectives

- **Automatic Logging**: All admin mutations are logged without manual intervention
- **Change Tracking**: Store old and new values for update operations
- **Searchable History**: Filter logs by user, action, resource, date range
- **Exportable**: Download logs as CSV for compliance or review
- **Retention**: Configurable auto-purge for old entries

## Prisma Schema Addition

```prisma
model AuditLog {
  id           String   @id @default(cuid())
  userId       String   // Stack Auth user ID
  userName     String   // Denormalized for display
  action       String   // CREATE, UPDATE, DELETE, LOGIN, EXPORT, SYNC
  resourceType String   // e.g. "sermon", "member", "event"
  resourceId   String?  // ID of the affected record
  oldValues    Json?    // Previous state (for UPDATE/DELETE)
  newValues    Json?    // New state (for CREATE/UPDATE)
  ipAddress    String?
  userAgent    String?
  createdAt    DateTime @default(now())

  @@index([userId])
  @@index([resourceType])
  @@index([createdAt])
  @@map("audit_logs")
}
```

## Utility (`lib/audit.ts`)

```typescript
interface AuditLogInput {
  userId: string;
  userName: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "EXPORT" | "SYNC";
  resourceType: string;
  resourceId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

async function logAction(input: AuditLogInput): Promise<void>
```

This function is called from every admin API route after a successful mutation:

```typescript
// Example in sermon creation
const sermon = await prisma.sermon.create({ data: validatedData });
await logAction({
  userId: user.id,
  userName: user.displayName,
  action: "CREATE",
  resourceType: "sermon",
  resourceId: sermon.id,
  newValues: validatedData,
});
```

## Components

| Component | Purpose |
|-----------|---------|
| `AuditLogTable` | Filterable, paginated log table with expandable rows |
| `AuditLogFilters` | User selector, action type, resource type, date range pickers |
| `AuditLogDetail` | Expandable row showing JSON diff (old vs new values) |
| `AuditLogExport` | Button to trigger CSV export of filtered results |

## Pages

| Route | Description |
|-------|-------------|
| `app/[locale]/admin/audit-log/page.tsx` | Audit log viewer with filters |

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/admin/audit-log` | Paginated log with filters |
| `GET` | `/api/admin/audit-log/export` | CSV download |

## Query Parameters (GET /api/admin/audit-log)

```typescript
GetAuditLogQuerySchema {
  page: number         // default 1
  limit: number        // default 50, max 100
  userId?: string      // filter by actor
  action?: string      // filter by action type
  resourceType?: string // filter by resource
  dateFrom?: string    // ISO date
  dateTo?: string      // ISO date
  sortOrder?: "asc" | "desc" // default desc (newest first)
}
```

## Retention Policy

- Default: keep logs for 12 months
- Configurable via environment variable `AUDIT_LOG_RETENTION_MONTHS`
- Cron job or periodic cleanup: `DELETE FROM audit_logs WHERE createdAt < NOW() - INTERVAL '12 months'`
- Can be triggered via `/api/admin/audit-log/cleanup` (SUPER_ADMIN only)

## Dashboard Integration

The admin dashboard shows the 10 most recent audit log entries as a "Recent Activity" feed.

## Permissions Required

- `audit.view` — view audit log
- `audit.export` — export audit log as CSV

## Dependencies

- Requires: Admin Infrastructure
- Existing: Prisma, `date-fns`
- No new npm packages
