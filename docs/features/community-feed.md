# Community Feed

## Overview

A member-only social feed where ACTIVE church members can post text updates and photos. Admins can moderate posts via the admin portal.

## Core Objectives

- Allow ACTIVE members to share short text posts and optional images in a community feed
- Enforce a configurable max post length via `SystemConfig`
- Support optional image uploads via Google Drive (graceful degradation if not configured)
- Allow admins to view and delete any post (requires `community.manage` permission)
- Members can delete their own posts

## Schema

```prisma
model SystemConfig {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@map("system_config")
}
// Seeded: { key: "post_max_length", value: "150" }

model CommunityPost {
  id          String   @id @default(cuid())
  memberId    String
  member      Member   @relation(fields: [memberId], references: [id])
  content     String
  imageUrl    String?  // Public Google Drive view URL
  imageFileId String?  // Google Drive file ID for deletion
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@map("community_posts")
}
```

## API Endpoints

### Member API (`/api/member/posts`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/member/posts` | List all community posts (ACTIVE members) |
| POST | `/api/member/posts` | Create a new post |
| DELETE | `/api/member/posts/[id]` | Delete own post |
| POST | `/api/member/posts/images` | Upload image to Google Drive |

- All endpoints require the user to have an ACTIVE `Member` record
- POST validates content length against `SystemConfig.post_max_length`
- Image upload returns `503` if `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` is not configured

### Admin API (`/api/admin/community-posts`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/community-posts` | List all posts with member info |
| DELETE | `/api/admin/community-posts/[id]` | Delete any post |

- Requires `community.manage` permission
- GET supports `page`, `limit`, `sortBy`, `sortOrder` query params

## Pages

- **`/[locale]/my-account/community`** — Community feed for ACTIVE members; create/delete own posts
- **`/[locale]/admin/community`** — Admin moderation view; delete any post

## Components

- `components/admin/community/` — Admin community post table and delete dialog

## Google Drive Integration

Image uploads use a Google service account (`lib/google-drive.ts`):

```ts
// Upload image, returns { url, fileId }
uploadImageToDrive(buffer: Buffer, filename: string, mimeType: string)

// Delete image by file ID
deleteImageFromDrive(fileId: string)
```

Set `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` (JSON string) and `GOOGLE_DRIVE_FOLDER_ID` in environment.

## Permissions

| Key | Description |
|-----|-------------|
| `community.manage` | View and delete any community post in admin |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` | JSON credentials for service account |
| `GOOGLE_DRIVE_FOLDER_ID` | Google Drive folder ID for uploaded images |
