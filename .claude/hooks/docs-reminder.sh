#!/usr/bin/env bash
# Stop hook — nudge to keep docs in sync after code changes.
#
# Fires when the working tree has CODE changes but NO documentation changes,
# i.e. code was touched and docs were not. Non-blocking: it only emits a
# user-facing systemMessage; it never blocks the turn (so there is no risk of
# a Stop loop). Stays silent once docs/CLAUDE.md/README are also dirty.
#
# Detection covers unstaged + staged + brand-new untracked files, so new API
# routes and pages (which are usually untracked) are caught.

root="$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
[ -n "$root" ] && cd "$root" || exit 0

changed="$(
  {
    git diff --name-only
    git diff --cached --name-only
    git ls-files --others --exclude-standard
  } 2>/dev/null | sort -u
)"
[ -z "$changed" ] && exit 0

# Code worth documenting: API routes, localized pages, lib, Prisma, build/deps.
CODE_RE='^apps/sccny/src/app/api/|^apps/sccny/src/app/\[locale\]/|^apps/sccny/src/lib/|^apps/sccny/prisma/|(^|/)package\.json$|(^|/)turbo\.json$'
# Documentation surfaces — if any of these changed, assume docs were handled.
DOCS_RE='(^|/)CLAUDE\.md$|^docs/|(^|/)README\.md$|^\.claude/skills/'

if printf '%s\n' "$changed" | grep -qE "$CODE_RE" \
  && ! printf '%s\n' "$changed" | grep -qE "$DOCS_RE"; then
  printf '%s\n' '{"systemMessage":"📝 Code changed without doc updates — consider running /update-docs to sync CLAUDE.md + docs/reference/*."}'
fi

exit 0
