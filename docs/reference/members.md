# Reference: Members, Member Corner & Community Feed

Current-state architecture for member management, member self-service, and the community feed. Forward-looking specs: `docs/features/member-management.md`, `member-corner.md`, `community-feed.md`.

## Members (admin)
- **Models**: `Member` (church profile, `status` = PENDING|ACTIVE|INACTIVE|REJECTED) + `PrayerRequest` (status PENDING|PRAYED).
- **Admin API**: `app/api/admin/members` (+ `[id]`, `[id]/approve`, `[id]/reject`, `[id]/deactivate`, `[id]/reactivate`, `export`, `pending-count`). UI `app/[locale]/admin/members` (+ `[id]`) + `components/admin/members/`.
- **Permissions**: `members.view/create/edit/approve/deactivate/export/import`. Approval workflow drives the PENDING→ACTIVE/REJECTED transitions; each transition is audit-logged with the matching action (`APPROVE`/`REJECT`/`DEACTIVATE`/`REACTIVATE`).

## Member Corner (self-service)
- Pages under `app/[locale]/my-account/`: `profile`, `prayer-requests`, `community`. Shell/components in `components/member-corner/` (`MemberShell`, `MemberDashboard`, `MemberStatusBanner`, `ProfileForm`, `PrayerRequests`, `CommunityFeed`).
- **Member API** (auth'd member, keyed off the Stack Auth user — not permission-gated like admin): `app/api/member/me` (+ `me/prayer-requests`, `me/reapply`).
- `MemberStatusBanner` reflects `Member.status`; most self-service features require an ACTIVE member.

## Community Feed
- **Models**: `CommunityPost` (member post + optional Google Drive image) + `SystemConfig` (key-value settings; seeded `post_max_length=150`).
- **Member API**: `app/api/member/posts` (GET/POST), `posts/[id]` (DELETE), `posts/images` (POST upload). ACTIVE members only.
- **Admin moderation**: `app/api/admin/community-posts` (GET) + `[id]` (DELETE); UI `app/[locale]/admin/community`. Permission `community.manage`.
- **Image storage**: `lib/google-drive.ts` `uploadImageToDrive()` / `deleteFileFromDrive()` via a Google service account; returns 503 if `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` / `GOOGLE_DRIVE_FOLDER_ID` are unset (graceful degradation). Uploaded files are made public-readable and served from `lh3.googleusercontent.com/d/<id>`.
