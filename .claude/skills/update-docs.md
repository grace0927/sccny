Review recent code changes in the SCCNY project and update all affected documentation to reflect the current state.

## Doc map

- `CLAUDE.md` — lean, always-loaded agent index: commands, key directories, data-model list, cross-cutting conventions, env vars, reference-doc index. Keep concise; push detail into `docs/reference/*`.
- `docs/reference/*.md` — current-state architecture per subsystem (file maps, data flow, key functions, permissions):
  - `admin-and-rbac.md` — admin shell/sidebar, admin API pattern, RBAC, audit log
  - `content.md` — sermons, news (+ scrapers/sync), announcements, events, CMS, hymns, templates
  - `members.md` — member management, member corner, community feed
  - `tools.md` — PPT generation, live translation, Bible lookup, Google APIs
- `docs/TODO.md` — phased roadmap, cumulative model table, package table.
- `docs/features/*.md` — original forward-looking feature *plans* (historical design intent). Do not retrofit these to current state; that's what `docs/reference/` is for.
- `prisma/schema.prisma` — source of truth for models. Do not duplicate full field lists in docs; summarize and point here.

## Instructions

1. **Identify what changed** — run `git diff HEAD --stat` and `git diff HEAD --name-only`. If nothing is staged, use `git status` for working-tree changes.

2. **Map changed files to docs:**
   - New/removed API routes (`app/api/`) → the matching `docs/reference/*.md` (admin/RBAC, content, members, or tools).
   - New pages (`app/[locale]/`) → matching `docs/reference/*.md`; if it adds an admin sidebar entry, note it in `admin-and-rbac.md`.
   - New/changed Prisma models (`prisma/schema.prisma`) → data-model list in `CLAUDE.md`, the relevant `docs/reference/*.md`, and the model table in `docs/TODO.md`.
   - New libraries (`src/lib/`) → Key directories in `CLAUDE.md` + the owning `docs/reference/*.md`.
   - New env vars (`turbo.json`) → Environment Variables in `CLAUDE.md` (+ the reference doc that uses them).
   - New permissions (`prisma/seed.ts`) → permission list in `admin-and-rbac.md`.
   - New dependencies (`package.json`) → Package Dependencies table in `docs/TODO.md`.
   - Feature completion → status in `docs/TODO.md` (`:white_check_mark:`).
   - New feature plan in `docs/features/` → add a row to the `docs/TODO.md` roadmap table.

3. **Make targeted edits only** — don't rewrite still-accurate sections. Keep `CLAUDE.md` lean (move depth into `docs/reference/`). `docs/TODO.md`: `:white_check_mark:` = done, `:clipboard:` = planned.

4. **Verify completeness:**
   - New env vars from `turbo.json` are in `CLAUDE.md`.
   - New routes/pages/models/permissions appear in the right reference doc.
   - `docs/TODO.md` status matches what's actually implemented.
   - No doc links to a file, route, or model that no longer exists.

5. **Report** — briefly summarize which docs were updated and what changed.
