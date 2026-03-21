Review recent code changes in the SCCNY project and update all affected documentation to reflect the current state.

## Instructions

1. **Identify what changed** — run `git diff HEAD --stat` and `git diff HEAD --name-only` to see which files were modified. If there are no staged changes, run `git status` to see working tree changes.

2. **Determine documentation impact** — map changed files to doc sections:
   - New/removed API routes (`app/api/`) → update API tables in `docs/PROJECT_SPEC.md` and `CLAUDE.md`
   - New pages (`app/[locale]/`) → update Public Pages or Admin Portal sections in `docs/PROJECT_SPEC.md`
   - New/changed Prisma models (`prisma/schema.prisma`) → update Database Models in both `docs/PROJECT_SPEC.md` and `CLAUDE.md`, and the model table in `docs/TODO.md`
   - New libraries (`src/lib/`) → update Key Directories in `CLAUDE.md`
   - New env vars (`turbo.json` env section) → update Environment Variables in both `docs/PROJECT_SPEC.md` and `CLAUDE.md`
   - Feature completion → update status in `docs/TODO.md` (mark ✅) and Current Status in `docs/PROJECT_SPEC.md`
   - New dependencies (`package.json`) → update Package Dependencies in `docs/TODO.md`
   - New feature plan files (`docs/features/`) → add entry to `docs/TODO.md` roadmap table

3. **Update each affected document** — make targeted edits only. Do not rewrite sections that are still accurate. Follow these conventions:
   - `docs/TODO.md` — use `:white_check_mark:` for completed items, `:clipboard:` for planned
   - `docs/PROJECT_SPEC.md` — keep API tables complete and accurate; update Current Status table at the bottom
   - `CLAUDE.md` — keep the Key Directories list and Environment Variables section in sync with the actual codebase

4. **Verify completeness** — after edits, confirm:
   - All new env vars from `turbo.json` are listed in both docs
   - All new routes appear in the API tables
   - `docs/TODO.md` feature status matches what's actually implemented
   - No doc references a file or endpoint that no longer exists (e.g., old renamed routes)

5. **Report** — briefly summarize which documents were updated and what was changed.
