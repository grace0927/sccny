# Live Translation

## Overview

A real-time translation tool for use during bilingual church services. A translator types the translation live, and attendees see it instantly on their phones or on a projected screen.

## Core Objectives

- **Real-Time Broadcast**: Operator types, all viewers see it instantly
- **Multiple View Modes**: Operator input, projection display, mobile audience view
- **Session Management**: Create and end translation sessions tied to service dates
- **History**: Past sessions are saved and reviewable

## Functionality

### Operator View (auth-protected)
- Text input area for typing translations in real-time
- Source/target language toggle (Chinese ↔ English)
- Font size controls for the display
- Session start/end controls
- View connected audience count

### Display View (for projection)
- Large-font, auto-scrolling text optimized for projection
- Shows current and previous sentences
- Configurable background color and font size
- No UI chrome — full-screen text only
- Auto-advances as new text arrives

### Audience View (mobile-friendly, public)
- Attendees open a URL on their phone
- See the live translation stream
- Configurable font size
- Scroll through recent entries
- Works without authentication

## Prisma Schema Additions

```prisma
model TranslationSession {
  id             String             @id @default(cuid())
  title          String
  date           DateTime
  sourceLanguage String             @default("zh")
  targetLanguage String             @default("en")
  status         TranslationSessionStatus @default(ACTIVE)
  createdById    String
  entries        TranslationEntry[]
  createdAt      DateTime           @default(now())

  @@map("translation_sessions")
}

enum TranslationSessionStatus {
  ACTIVE
  ENDED
}

model TranslationEntry {
  id        String             @id @default(cuid())
  sessionId String
  session   TranslationSession @relation(fields: [sessionId], references: [id])
  text      String
  sequence  Int
  timestamp DateTime           @default(now())

  @@map("translation_entries")
}
```

## Technical Approach: Server-Sent Events (SSE)

SSE is preferred over WebSocket for this use case because:
- Communication is one-directional (operator → viewers)
- SSE is simpler to implement with Next.js API routes
- Built-in browser reconnection handling
- No additional infrastructure needed

### Flow:
1. Operator creates a session via POST
2. Operator types and submits text entries via POST
3. Viewers connect to an SSE endpoint and receive entries in real-time
4. On session end, SSE stream closes

### Alternative (production scale):
If concurrent viewer count exceeds ~100, consider using:
- Ably or Pusher for managed pub/sub
- Vercel Edge Runtime for SSE at edge

## Components

| Component | Purpose |
|-----------|---------|
| `TranslationOperator` | Text input with send button, session controls, viewer count |
| `TranslationDisplay` | Large-text projection view with auto-scroll |
| `TranslationViewer` | Mobile-optimized read-only view with scrollable history |
| `SessionManager` | Create/end sessions, view past sessions |
| `SessionHistory` | List of past sessions with entry counts |

## Pages

| Route | Description |
|-------|-------------|
| `app/[locale]/tools/live-translation/page.tsx` | Public audience viewer |
| `app/[locale]/tools/live-translation/operate/page.tsx` | Operator view (auth-protected) |
| `app/[locale]/tools/live-translation/display/page.tsx` | Projection display view |
| `app/[locale]/tools/live-translation/history/page.tsx` | Past session browser |

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/tools/translation/sessions` | List sessions |
| `POST` | `/api/tools/translation/sessions` | Create session |
| `PATCH` | `/api/tools/translation/sessions/[id]` | End session |
| `POST` | `/api/tools/translation/sessions/[id]/entries` | Add text entry |
| `GET` | `/api/tools/translation/sessions/[id]/entries` | Get all entries (for history) |
| `GET` | `/api/tools/translation/sessions/[id]/stream` | SSE endpoint for live stream |

## SSE Endpoint Implementation

```typescript
// GET /api/tools/translation/sessions/[id]/stream
export async function GET(request: NextRequest, { params }) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send existing entries as initial data
      // Subscribe to new entries
      // On new entry: controller.enqueue(encoder.encode(`data: ${JSON.stringify(entry)}\n\n`))
      // On session end: controller.close()
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
```

## i18n Keys

Add `"LiveTranslation"` namespace covering:
- Operator controls, viewer labels, session management text
- Connection status messages

## Permissions Required

- `tools.translation.operate` — access operator view, create/manage sessions
- Public viewer: no auth required

## Dependencies

- Requires: Admin Infrastructure (for operator auth)
- Existing: `dark-blue`, Prisma
- No new npm packages (SSE is native browser + Node.js)
