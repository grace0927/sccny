# Content Management

## Overview

A general CMS for managing static page content (About pages, Vision, Confession of Faith, etc.) so that church leadership can update content without code changes. Supports bilingual editing and version history.

## Core Objectives

- **Bilingual Editing**: Side-by-side English/Chinese content editing
- **Rich Text**: WYSIWYG editor for formatted content
- **Version History**: Track all content revisions with diff view
- **Media Management**: Upload and manage images used in pages
- **Draft/Publish Workflow**: Preview content before going live

## Functionality

- List all manageable content pages with status indicators
- Rich text editor for each page's content (bilingual: en + zh fields)
- Preview content as it would appear on the public site
- Version history with revision comparison
- Media upload for images used in page content
- Draft → Published workflow with scheduled publishing

## Prisma Schema Additions

```prisma
model ContentPage {
  id          String            @id @default(cuid())
  slug        String            @unique  // e.g. "about/vision"
  titleEn     String
  titleZh     String
  contentEn   String            @db.Text
  contentZh   String            @db.Text
  status      ContentStatus     @default(DRAFT)
  publishedAt DateTime?
  authorId    String            // Stack Auth user ID
  revisions   ContentRevision[]
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  @@map("content_pages")
}

enum ContentStatus {
  DRAFT
  PUBLISHED
}

model ContentRevision {
  id            String      @id @default(cuid())
  contentPageId String
  contentPage   ContentPage @relation(fields: [contentPageId], references: [id])
  titleEn       String
  titleZh       String
  contentEn     String      @db.Text
  contentZh     String      @db.Text
  editedById    String      // Stack Auth user ID
  createdAt     DateTime    @default(now())

  @@map("content_revisions")
}

model MediaAsset {
  id           String   @id @default(cuid())
  url          String
  altText      String?
  fileName     String
  fileType     String   // e.g. "image/png"
  fileSize     Int      // bytes
  uploadedById String
  createdAt    DateTime @default(now())

  @@map("media_assets")
}
```

## Components

| Component | Purpose |
|-----------|---------|
| `ContentPageList` | Table of all content pages with status badges and last-edited date |
| `ContentEditor` | Rich text editor with side-by-side en/zh editing panes |
| `ContentPreview` | Renders content as it would appear on the public site |
| `RevisionHistory` | List of past versions with timestamps and editors |
| `RevisionDiff` | Side-by-side comparison of two content versions |
| `MediaUploader` | Drag-and-drop image upload with preview |
| `MediaLibrary` | Browseable grid of uploaded media assets |

## Pages

| Route | Description |
|-------|-------------|
| `app/[locale]/admin/content/page.tsx` | Content page list |
| `app/[locale]/admin/content/[slug]/page.tsx` | Edit specific content page |
| `app/[locale]/admin/content/[slug]/revisions/page.tsx` | Revision history |
| `app/[locale]/admin/media/page.tsx` | Media library |

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/admin/content` | List all content pages |
| `GET` | `/api/admin/content/[slug]` | Get content page by slug |
| `PATCH` | `/api/admin/content/[slug]` | Update content (auto-creates revision) |
| `POST` | `/api/admin/content/[slug]/publish` | Publish a draft |
| `GET` | `/api/admin/content/[slug]/revisions` | List revisions |
| `GET` | `/api/admin/content/[slug]/revisions/[id]` | Get specific revision |
| `POST` | `/api/admin/media/upload` | Upload media file |
| `GET` | `/api/admin/media` | List media assets |
| `DELETE` | `/api/admin/media/[id]` | Delete media asset |

## Rich Text Editor

**Recommended library:** Tiptap (headless, extensible, React-friendly)

Key features needed:
- Headings (H1-H3), bold, italic, underline
- Ordered/unordered lists
- Links, images (from media library)
- Block quotes
- Tables (for meeting times, etc.)
- HTML source view for advanced users

## Media Storage

- Use Vercel Blob Storage for file uploads (already on Vercel)
- Alternative: Cloudflare R2 or AWS S3
- Max file size: 5MB for images
- Accepted types: image/png, image/jpeg, image/webp, image/gif

## Public-Side Integration

Existing static pages (About, Vision, etc.) would be refactored to fetch content from the ContentPage model instead of hardcoding text in translations. The i18n system remains for UI chrome, but page body content comes from the CMS.

## Permissions Required

- `content.view` — view content pages
- `content.edit` — edit content
- `content.publish` — publish drafts
- `media.upload` — upload media
- `media.delete` — delete media

## Dependencies

- Requires: Admin Infrastructure, Permission system
- New packages: `@tiptap/react`, `@tiptap/starter-kit`, `@vercel/blob`
- Existing: `dark-blue`, `zod`
