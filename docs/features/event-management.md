# Event Management

## Overview

Manage church events (retreats, holiday gatherings, special services, fellowship events) that display on the public site and integrate with the member corner. Includes both admin management and public-facing event pages.

## Core Objectives

- **Event CRUD**: Create, edit, delete, and publish events
- **Calendar View**: Visual calendar for admins and public users
- **Registration**: Track member sign-ups for events
- **Recurring Events**: Support weekly/monthly recurring events
- **Public Display**: Events listing and detail pages for site visitors

## Functionality

### Admin Side
- Create/edit/delete events with bilingual title and description
- Fields: title (en/zh), description (en/zh), start/end datetime, location, type, recurring flag, recurrence rule, registration URL, cover image
- Calendar view (month/week) and list view toggle
- Publish/draft/cancel/archive workflow
- Event registration list per event
- Recurring event support with recurrence patterns

### Public Side
- Upcoming events listing (only PUBLISHED, future events)
- Event detail page with registration link
- Calendar view for browsing events by month
- Integration with home page "Upcoming Events" section

## Prisma Schema Additions

```prisma
model Event {
  id              String              @id @default(cuid())
  titleEn         String
  titleZh         String
  descriptionEn   String?             @db.Text
  descriptionZh   String?             @db.Text
  startDate       DateTime
  endDate         DateTime?
  location        String?
  type            EventType           @default(OTHER)
  isRecurring     Boolean             @default(false)
  recurrenceRule  String?             // iCal RRULE format, e.g. "FREQ=WEEKLY;BYDAY=SU"
  registrationUrl String?
  coverImage      String?
  status          EventStatus         @default(DRAFT)
  createdById     String
  registrations   EventRegistration[]
  createdAt       DateTime            @default(now())
  updatedAt       DateTime            @updatedAt

  @@map("events")
}

enum EventType {
  WORSHIP
  FELLOWSHIP
  RETREAT
  CONFERENCE
  HOLIDAY
  OTHER
}

enum EventStatus {
  DRAFT
  PUBLISHED
  CANCELLED
  ARCHIVED
}

model EventRegistration {
  id           String                   @id @default(cuid())
  eventId      String
  event        Event                    @relation(fields: [eventId], references: [id])
  memberId     String?
  name         String                   // For non-member registrations
  email        String?
  status       EventRegistrationStatus  @default(REGISTERED)
  registeredAt DateTime                 @default(now())

  @@map("event_registrations")
}

enum EventRegistrationStatus {
  REGISTERED
  CANCELLED
}
```

## Components

### Admin Components
| Component | Purpose |
|-----------|---------|
| `EventAdminTable` | List view with filters (date range, type, status) |
| `EventCalendarAdmin` | Month/week calendar grid with event cards |
| `EventForm` | Create/edit form with datetime pickers, rich text description |
| `EventRegistrationList` | Table of registered members for a specific event |

### Public Components
| Component | Purpose |
|-----------|---------|
| `EventList` | Upcoming events cards for public listing |
| `EventDetail` | Public event detail with registration CTA |
| `EventCalendarPublic` | Read-only month calendar for browsing |
| `UpcomingEventsWidget` | Compact list for home page sidebar |

## Pages

### Admin
| Route | Description |
|-------|-------------|
| `app/[locale]/admin/events/page.tsx` | Event list/calendar admin view |
| `app/[locale]/admin/events/[id]/page.tsx` | Event detail/edit |
| `app/[locale]/admin/events/[id]/registrations/page.tsx` | Registration list |

### Public
| Route | Description |
|-------|-------------|
| `app/[locale]/events/page.tsx` | Public events listing + calendar |
| `app/[locale]/events/[id]/page.tsx` | Public event detail |

## API Endpoints

### Admin
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/admin/events` | Paginated list with filters |
| `POST` | `/api/admin/events` | Create event |
| `GET` | `/api/admin/events/[id]` | Get event details |
| `PATCH` | `/api/admin/events/[id]` | Update event |
| `DELETE` | `/api/admin/events/[id]` | Delete event |
| `GET` | `/api/admin/events/[id]/registrations` | List registrations |

### Public
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/events` | Public list (PUBLISHED, future only) |
| `GET` | `/api/events/[id]` | Public event detail |
| `POST` | `/api/events/[id]/register` | Register for event |

## Zod Validation Schemas

```typescript
EventCreateSchema     // titleEn, titleZh (required), startDate (required), + optional fields
EventUpdateSchema     // All fields partial
GetEventsQuerySchema  // page, limit, type, status, dateFrom, dateTo, sortBy, sortOrder
EventRegistrationSchema // name (required), email (optional)
```

## Calendar Implementation

Use a lightweight calendar library or build a simple CSS Grid-based month view:
- Each day cell shows event dots/chips
- Click a day to see events for that day
- Navigation: previous/next month, today button

## i18n Keys

Add `"Events"` and `"EventManagement"` namespaces for public and admin views.

## Permissions Required

- `events.view` — view events admin list
- `events.create` — create events
- `events.edit` — edit events
- `events.delete` — delete events
- `events.registrations` — view registration lists

## Dependencies

- Requires: Admin Infrastructure, Permission system
- Existing: `dark-blue`, `zod`, `date-fns`
- Optional: calendar library (e.g. `@schedule-x/react`) or custom CSS Grid calendar
