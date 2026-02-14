# Member Corner

## Overview

A self-service area for authenticated users. What a user can see depends on their membership status — users who have signed up but are not yet approved see a pending state; approved members get full access to member-only content.

## Core Objectives

- **Membership Request**: Any user who signs up is treated as a membership applicant (status PENDING)
- **Approval Gate**: Only admin-approved members (status ACTIVE) can access member-only content
- **Profile Management**: Approved members view and edit their own information
- **Group Visibility**: See assigned fellowship groups and ministry roles
- **Member-Only Content**: Access restricted announcements and resources
- **Prayer Requests**: Submit prayer requests to the church (approved members only)

## Membership Lifecycle

```
User signs up via Stack Auth
        ↓
Member record created with status = PENDING
        ↓
User sees "pending approval" state in /my-account
(can edit basic profile info, but cannot access member-only content)
        ↓
Admin reviews request in Member Management
        ↓
  ┌─── Approve ──→ status = ACTIVE  → full member access
  └─── Reject  ──→ status = REJECTED → user sees rejection notice
```

### Status Definitions

| Status | Meaning | Access Level |
|--------|---------|--------------|
| `PENDING` | Signed up, awaiting admin approval | Can view/edit own basic profile only |
| `ACTIVE` | Approved member | Full member-only content, prayer requests, groups |
| `INACTIVE` | Deactivated by admin | Same as PENDING (no member content) |
| `REJECTED` | Membership request denied | Sees rejection notice, can re-apply |

## Functionality

### For PENDING users:
- See a "Your membership request is pending approval" banner
- View and edit basic profile fields (name, phone, email) so admin can review accurate info
- Cannot access member-only announcements, prayer requests, or group info

### For ACTIVE members:
- View/edit full profile (name, phone, email, address, birthday, baptism date)
- View assigned fellowship groups and ministry assignments
- Access member-only announcements and resources
- Submit prayer requests with optional anonymity
- View own prayer request history

### For REJECTED users:
- See a "Your membership request was not approved" notice with optional reason
- Option to re-apply (resets status to PENDING)

## Prisma Schema Additions

```prisma
model Member {
  id                 String              @id @default(cuid())
  userId             String              @unique  // FK to Stack Auth user ID
  name               String
  nameZh             String?
  email              String?
  phone              String?
  address            String?
  birthday           DateTime?
  baptismDate        DateTime?
  memberSince        DateTime?
  status             MemberStatus        @default(PENDING)
  rejectionReason    String?
  approvedById       String?             // Stack Auth user ID of approving admin
  approvedAt         DateTime?
  fellowshipGroup    String?
  ministryAssignments String[]
  profilePhoto       String?
  prayerRequests     PrayerRequest[]
  createdAt          DateTime            @default(now())
  updatedAt          DateTime            @updatedAt

  @@map("members")
}

enum MemberStatus {
  PENDING
  ACTIVE
  INACTIVE
  REJECTED
}

model PrayerRequest {
  id          String              @id @default(cuid())
  memberId    String
  member      Member              @relation(fields: [memberId], references: [id])
  content     String
  isAnonymous Boolean             @default(false)
  status      PrayerRequestStatus @default(PENDING)
  createdAt   DateTime            @default(now())

  @@map("prayer_requests")
}

enum PrayerRequestStatus {
  PENDING
  PRAYED
}
```

**Key change:** `MemberStatus` defaults to `PENDING` (not `ACTIVE`), and new fields `rejectionReason`, `approvedById`, `approvedAt` track the approval workflow.

## Auto-Creation on Sign-Up

When a user signs up via Stack Auth, a Member record is automatically created with status `PENDING`. This can be done via:

- **Option A — Stack Auth webhook**: Configure a webhook on `user.created` that calls a local API route to create the Member record.
- **Option B — On first `/my-account` visit**: If no Member record exists for the authenticated user, create one with status `PENDING` on page load (lazy creation).

Option B is simpler and recommended for initial implementation.

## Components

| Component | Purpose |
|-----------|---------|
| `MemberStatusBanner` | Shows pending/rejected/inactive status with appropriate messaging |
| `MemberProfile` | Form with fields pre-filled from the Member record; editable |
| `MemberDashboard` | Overview card with group info, upcoming events, recent announcements (ACTIVE only) |
| `PrayerRequestForm` | Text area + anonymous toggle for submitting prayer requests (ACTIVE only) |
| `PrayerRequestList` | List of own past prayer requests with status (ACTIVE only) |
| `ReapplyButton` | For REJECTED users, resets status to PENDING |

## Pages

| Route | Description |
|-------|-------------|
| `app/[locale]/my-account/page.tsx` | Dashboard — content varies by member status |
| `app/[locale]/my-account/profile/page.tsx` | Edit profile form (all statuses can access) |
| `app/[locale]/my-account/prayer-requests/page.tsx` | Prayer requests (ACTIVE only, others redirected) |

**Note:** This is a user-facing route (`/my-account`), not under `/admin`. Any authenticated user can access it, but content is gated by membership status.

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/member/me` | Fetch current user's member profile (auto-creates PENDING if missing) |
| `PATCH` | `/api/member/me` | Update current user's profile |
| `POST` | `/api/member/me/reapply` | Reset status from REJECTED to PENDING |
| `GET` | `/api/member/me/prayer-requests` | List own prayer requests (ACTIVE only) |
| `POST` | `/api/member/me/prayer-requests` | Submit a new prayer request (ACTIVE only) |

## Zod Validation Schemas

- `MemberProfileUpdateSchema` — partial update for profile fields (name, nameZh, phone, email, address, birthday)
- `PrayerRequestCreateSchema` — content (required), isAnonymous (boolean)

## i18n Keys

Add `"MemberCorner"` namespace covering:
- Profile field labels, dashboard headings, prayer request form labels
- Status banner messages: pending approval, rejected (with reason), inactive
- Reapply button text
- Success/error toasts

## Dependencies

- Requires: Admin Infrastructure (auth middleware), Member model in Prisma
- Existing: `@stackframe/stack`, `dark-blue`, `zod`
