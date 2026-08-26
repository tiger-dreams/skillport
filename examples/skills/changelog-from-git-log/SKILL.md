---
name: changelog-from-git-log
description: Generates a CHANGELOG.md section from git log between two refs, grouped by change type. Use when the user asks to write a changelog, release notes, or summarize commits between two tags/branches.
---

# Changelog from Git Log

Turns raw commit history between two refs into a grouped, human-readable changelog entry.

## When to use this skill

- The user asks "generate a changelog for this release"
- The user wants release notes between two tags, e.g. `v1.2.0` and `v1.3.0`
- The user wants a summary of what changed since a given commit or date

## How to do it

1. Determine the two refs (default to the latest tag and `HEAD` if the user doesn't specify):
   ```
   git log <from-ref>..<to-ref> --pretty=format:"%s (%h)"
   ```
2. If commits mostly follow Conventional Commits (`feat:`, `fix:`, etc.), group by prefix. If they don't, read each subject and classify by intent instead — don't force a mismatch.
3. Group into standard Keep a Changelog sections, skipping empty ones:
   - `### Added` — feat
   - `### Fixed` — fix
   - `### Changed` — refactor, perf, behavior changes
   - `### Docs` — docs
   - `### Chore` — chore, build, ci
4. Within each group, list entries as bullets, one per commit, in the commit's own words but cleaned up (drop the type prefix, capitalize, keep the short hash for traceability):
   ```
   - Handle missing SKILL.md gracefully (a1b2c3d)
   ```
5. Prepend a version/date header:
   ```
   ## [<version>] - YYYY-MM-DD
   ```
   Ask the user for the version number if it isn't obvious from context (e.g. from `package.json` or the target tag name).
6. Output the full section as a fenced markdown block, ready to paste at the top of `CHANGELOG.md` (above the previous entry, below the title).

## Notes

- Skip merge commits and commits with only a hash and no meaningful subject.
- If there are no commits between the refs, say so plainly instead of fabricating an entry.
