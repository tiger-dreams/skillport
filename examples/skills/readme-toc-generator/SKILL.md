---
name: readme-toc-generator
description: Generates or updates a table of contents in a README.md (or any markdown file) from its own headers. Use when the user asks to add, update, or regenerate a table of contents / TOC.
---

# README TOC Generator

Builds a table of contents for a markdown file by scanning its own headers, and keeps it in sync on request.

## When to use this skill

- The user asks to "add a table of contents to the README"
- The user has added/removed sections and wants the existing TOC updated
- A markdown file has grown long enough that navigation is getting painful

## How to do it

1. Read the target file (default `README.md` if the user doesn't name one).
2. Extract headers, typically `##` and `###` (skip the H1 title itself — it's the document, not a section).
3. For each header, build a link using standard GitHub slug rules:
   - lowercase
   - spaces → hyphens
   - strip punctuation except hyphens
   - de-duplicate repeated slugs by appending `-1`, `-2`, ...
4. Indent `###` entries one level deeper than `##` entries to show hierarchy.
5. Render as a bullet list:
   ```markdown
   ## Table of Contents

   - [Quick Start](#quick-start)
   - [Commands](#commands)
     - [install](#install)
     - [list](#list)
   - [Contributing](#contributing)
   ```
6. If a TOC already exists (look for a `## Table of Contents` heading, or an HTML comment marker like `<!-- toc -->` / `<!-- tocstop -->`), replace only that block — never touch the rest of the file.
7. If no TOC marker exists, ask the user where to insert it (usually right after the title/intro paragraph, before the first `##` section) rather than guessing.

## Notes

- Don't include the TOC's own header in the list it generates.
- Re-running the skill should be idempotent: regenerating should produce the same output for unchanged headers.
