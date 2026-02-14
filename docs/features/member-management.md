# Member Management

## Overview

Admin interface to manage all church members — review membership requests, approve/reject applicants, edit member details, and perform bulk operations. This is the administrative counterpart to the self-service Member Corner.

## Core Objectives

- **Membership Approval**: Review and approve/reject sign-up requests
- **Full CRUD**: Create, read, update, and deactivate member records
- **Search & Filter**: Find members by name, phone, email, group, status
- **Bulk Operations**: Import from CSV, export directory, bulk status changes
- **Group Assignment**: Assign members to fellowship groups and ministries

## Membership Approval Workflow

When a user signs up, a Member record is automatically created with status `PENDING`. Admins manage these requests from the Member Management page.

```
Sign-up creates Member (PENDING)
        ↓
Admin sees request in "Pending Requests" tab/filter
        ↓
Admin reviews profile info submitted by the applicant
        ↓
  ┌─── Approve ──→ status = ACTIVE, approvedById + approvedAt set
  │                 user gains member-only access
  └─── Reject  ──→ status = REJECTED, rejectionReason set
                    user sees rejection notice, can re-apply
```

### Approval Actions

| Action | Effect |
|--------|--------|
| **Approve** | Sets status to `ACTIVE`, records `approvedById` and `approvedAt`, optionally assigns fellowship group |
| **Reject** | Sets status to `REJECTED`, requires `rejectionReason` text |
| **Deactivate** | Sets an ACTIVE member to `INACTIVE` (revokes access, keeps record) |
| **Reactivate** | Sets INACTIVE back to `ACTIVE` |

## Functionality

- **Pending Requests tab**: Dedicated view showing only PENDING members, sorted by request date (newest first), with one-click approve/reject actions
- Paginated member list with search (by name, phone, email, group)
- Filter by status: Pending, Active, Inactive, Rejected
- Add new member manually via form (auto-set to ACTIVE, skipping approval)
- Edit all member fields
- Deactivate/reactivate members (soft delete via status)
- Assign members to fellowship groups and ministries
- Export member directory as CSV (ACTIVE members only by default)
- Bulk import from CSV/Excel (imported members default to ACTIVE)
- View member activity history (linked to audit log)
- Pending request count badge on admin sidebar

## Components

| Component | Purpose |
|-----------|---------|
| `MemberTable` | Data table with sortable columns, search bar, status/group filters |
| `MemberPendingList` | Specialized view for pending requests with approve/reject action buttons |
| `MemberApproveDialog` | Confirmation dialog for approval, optional group assignment |
| `MemberRejectDialog` | Dialog requiring a rejection reason |
| `MemberForm` | Create/edit form dialog with Zod validation for all member fields |
| `MemberDetail` | Full detail view with activity history and linked user account |
| `MemberImportDialog` | CSV file upload with column mapping UI |
| `MemberExportButton` | Triggers CSV download of filtered member list |
| `MemberGroupAssign` | Multi-select dropdown to assign groups/ministries |
| `PendingBadge` | Badge on admin sidebar showing count of pending requests |

## Pages

| Route | Description |
|-------|-------------|
| `app/[locale]/admin/members/page.tsx` | Member list with tabs: Pending / All Members |
| `app/[locale]/admin/members/[id]/page.tsx` | Individual member detail/edit view |

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/admin/members` | Paginated list with filters (including status filter) |
| `POST` | `/api/admin/members` | Create new member (admin-created, defaults to ACTIVE) |
| `GET` | `/api/admin/members/[id]` | Get single member |
| `PATCH` | `/api/admin/members/[id]` | Update member fields |
| `POST` | `/api/admin/members/[id]/approve` | Approve pending member |
| `POST` | `/api/admin/members/[id]/reject` | Reject pending member (requires reason) |
| `POST` | `/api/admin/members/[id]/deactivate` | Deactivate active member |
| `POST` | `/api/admin/members/[id]/reactivate` | Reactivate inactive member |
| `POST` | `/api/admin/members/import` | Bulk CSV import (imported as ACTIVE) |
| `GET` | `/api/admin/members/export` | CSV export |
| `GET` | `/api/admin/members/pending-count` | Count of PENDING members (for sidebar badge) |

## Zod Validation Schemas

```typescript
MemberCreateSchema     // name (required), email, phone, address, birthday, baptismDate,
                       // memberSince, fellowshipGroup, ministryAssignments[]
                       // Note: status is NOT settable on create — admin-created = ACTIVE
MemberUpdateSchema     // All fields partial (except status — use dedicated endpoints)
MemberApproveSchema    // fellowshipGroup? (optional, assign on approval)
MemberRejectSchema     // rejectionReason (required)
GetMembersQuerySchema  // page, limit, search, status, fellowshipGroup, sortBy, sortOrder
```

## CSV Import Format

```csv
name,nameZh,email,phone,address,birthday,baptismDate,fellowshipGroup,ministryAssignments
John Doe,张三,john@example.com,631-555-0100,123 Main St,1990-01-15,2020-06-01,Family Fellowship,"Choir,Finance"
```

Imported members are set to `ACTIVE` status (bypasses approval since admin is explicitly importing known members).

## Admin Notifications

- When a new membership request arrives (PENDING member created), show a notification dot on the admin sidebar "Members" link
- Dashboard widget: "X pending membership requests" with a link to the pending list

## Audit Log Integration

All approval/rejection actions are logged:
- `APPROVE_MEMBER` — records who approved, when
- `REJECT_MEMBER` — records who rejected, reason, when
- `DEACTIVATE_MEMBER` / `REACTIVATE_MEMBER`

## i18n Keys

Add `"MemberManagement"` namespace covering:
- Table headers, filter labels, form field labels
- Status labels: Pending, Active, Inactive, Rejected
- Approval/rejection dialog text
- Pending request count messages
- Import/export dialog text, confirmation messages
- Success/error messages

## Permissions Required

- `members.view` — view member list and details
- `members.create` — add new members manually
- `members.edit` — update member information
- `members.approve` — approve/reject pending membership requests
- `members.deactivate` — deactivate/reactivate members
- `members.export` — download member directory
- `members.import` — bulk import members

## Dependencies

- Requires: Admin Infrastructure, Member Prisma model, Permission system, Audit Log
- Existing: `dark-blue` (DataTable pattern), `zod`
