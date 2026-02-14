# PPT Generation

## Overview

Auto-generate PowerPoint slides for Sunday worship services — hymn lyrics, scripture readings, sermon title slides, and announcements. Includes a hymn database and worship order builder.

## Core Objectives

- **Slide Generation**: Produce downloadable .pptx files from structured input
- **Worship Order Builder**: Drag-and-drop interface for building service flow
- **Hymn Database**: Searchable library of hymn lyrics (bilingual)
- **Template System**: Configurable slide templates (colors, fonts, backgrounds)
- **Bilingual Slides**: Generate slides with Chinese + English text

## Functionality

### Worship Order Builder
- Drag-and-drop items to build the service order
- Item types: Hymn, Scripture Reading, Sermon Title, Announcement, Custom Text
- Reorder items, add/remove
- Save/load worship orders for reuse
- Preview generated slides before download

### Hymn Database
- Searchable library of hymn lyrics
- Fields: hymn number, title (en/zh), lyrics (en/zh, array of verses), category
- Add/edit/delete hymns (admin)
- Import hymns from CSV or text files
- Preview hymn lyrics with verse structure

### Slide Templates
- Pre-built templates: Title Slide, Hymn Lyrics, Scripture, Announcement
- Configurable: background color/image, font size, font family, text alignment
- Hymn slides: one verse per slide, large font
- Scripture slides: verse text with reference
- Bilingual layout: Chinese text on top, English below (or side-by-side)

### Generation
- Click "Generate" to produce a .pptx file
- Download to local machine
- Each worship order item becomes one or more slides

## Prisma Schema Additions

```prisma
model Hymn {
  id        String   @id @default(cuid())
  number    Int?     @unique   // Hymnal number
  titleEn   String
  titleZh   String
  lyricsEn  Json     // Array of verse strings
  lyricsZh  Json     // Array of verse strings
  category  String?  // e.g. "Praise", "Communion", "Christmas"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("hymns")
}

model PptTemplate {
  id           String  @id @default(cuid())
  name         String
  description  String?
  templateData Json    // { bgColor, fontFamily, fontSize, textColor, layout, bgImage }
  isDefault    Boolean @default(false)
  createdAt    DateTime @default(now())

  @@map("ppt_templates")
}

model WorshipOrder {
  id          String             @id @default(cuid())
  date        DateTime
  title       String?            // e.g. "Sunday Worship - Jan 5, 2025"
  items       WorshipOrderItem[]
  createdById String
  createdAt   DateTime           @default(now())
  updatedAt   DateTime           @updatedAt

  @@map("worship_orders")
}

model WorshipOrderItem {
  id             String       @id @default(cuid())
  worshipOrderId String
  worshipOrder   WorshipOrder @relation(fields: [worshipOrderId], references: [id])
  type           OrderItemType
  sequence       Int
  hymnId         String?      // If type = HYMN
  scriptureRef   String?      // If type = SCRIPTURE, e.g. "John 3:16"
  contentEn      String?      // For ANNOUNCEMENT or CUSTOM
  contentZh      String?
  createdAt      DateTime     @default(now())

  @@map("worship_order_items")
}

enum OrderItemType {
  HYMN
  SCRIPTURE
  SERMON_TITLE
  ANNOUNCEMENT
  CUSTOM
}
```

## Components

| Component | Purpose |
|-----------|---------|
| `WorshipOrderBuilder` | Drag-and-drop interface for building service order |
| `OrderItemCard` | Individual item in the worship order (draggable) |
| `HymnSelector` | Searchable hymn picker with lyrics preview |
| `ScriptureSelector` | Bible reference input with verse preview (reuses Bible Lookup API) |
| `SlidePreview` | Preview of generated slides before download |
| `TemplateEditor` | Admin UI to customize slide templates |
| `HymnTable` | Admin list of all hymns with search and edit |
| `HymnForm` | Create/edit hymn with verse-by-verse input |
| `HymnImport` | Bulk import hymns from CSV/text |

## Pages

| Route | Description |
|-------|-------------|
| `app/[locale]/tools/ppt/page.tsx` | Worship order builder + slide generator |
| `app/[locale]/admin/hymns/page.tsx` | Hymn database management |
| `app/[locale]/admin/hymns/[id]/page.tsx` | Hymn detail/edit |
| `app/[locale]/admin/templates/page.tsx` | Slide template management |

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/tools/ppt/generate` | Generate .pptx from worship order JSON |
| `GET` | `/api/admin/hymns` | List hymns with search |
| `POST` | `/api/admin/hymns` | Create hymn |
| `GET` | `/api/admin/hymns/[id]` | Get hymn |
| `PATCH` | `/api/admin/hymns/[id]` | Update hymn |
| `DELETE` | `/api/admin/hymns/[id]` | Delete hymn |
| `POST` | `/api/admin/hymns/import` | Bulk import |
| `GET` | `/api/admin/worship-orders` | List saved worship orders |
| `POST` | `/api/admin/worship-orders` | Save worship order |
| `GET` | `/api/admin/worship-orders/[id]` | Load worship order |
| `GET` | `/api/admin/templates` | List slide templates |
| `POST` | `/api/admin/templates` | Create template |
| `PATCH` | `/api/admin/templates/[id]` | Update template |

## PPTX Generation (`pptxgenjs`)

```typescript
import PptxGenJS from "pptxgenjs";

function generatePptx(worshipOrder: WorshipOrderWithItems, template: PptTemplate): Buffer {
  const pptx = new PptxGenJS();

  for (const item of worshipOrder.items) {
    switch (item.type) {
      case "HYMN":
        // One slide per verse, large centered text
        for (const verse of item.hymn.lyricsZh) {
          const slide = pptx.addSlide();
          slide.addText(verse, { fontSize: 36, align: "center", valign: "middle" });
        }
        break;
      case "SCRIPTURE":
        // Single slide with verse text and reference
        break;
      case "SERMON_TITLE":
        // Title slide with sermon name and speaker
        break;
      // ...
    }
  }

  return pptx.write({ outputType: "nodebuffer" });
}
```

## i18n Keys

Add `"PptGeneration"` and `"HymnManagement"` namespaces.

## Permissions Required

- `tools.ppt.generate` — use the PPT generator
- `hymns.view` — view hymn database
- `hymns.edit` — add/edit/delete hymns
- `templates.edit` — manage slide templates

## Dependencies

- Requires: Admin Infrastructure (for hymn/template management), Bible Lookup API (for scripture items)
- New packages: `pptxgenjs` (PPTX generation), `@hello-pangea/dnd` (drag-and-drop)
- Existing: `dark-blue`, `zod`, Prisma
