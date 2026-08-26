---
name: conventional-commits
description: Writes commit messages in Conventional Commits format from a staged diff. Use when the user asks for a commit message, wants help committing changes, or mentions "conventional commits".
---

# Conventional Commits

Turns a diff into a well-formed [Conventional Commits](https://www.conventionalcommits.org/) message.

## When to use this skill

- The user asks "write a commit message for this"
- The user runs `git diff --staged` and wants a message generated from it
- The user wants their commit history to follow `type(scope): subject` conventions

## How to do it

1. Get the staged diff: `git diff --staged` (fall back to `git diff` if nothing is staged, and tell the user you're using unstaged changes).
2. Classify the change into one type:
   - `feat` — a new feature
   - `fix` — a bug fix
   - `docs` — documentation only
   - `refactor` — code change that neither fixes a bug nor adds a feature
   - `test` — adding or correcting tests
   - `chore` — tooling, deps, build config
   - `perf` — performance improvement
3. Infer a `scope` from the top-level directory or module most affected (e.g. `cli`, `api`, `auth`). Omit the scope if the change is too broad for one.
4. Write a subject line: imperative mood, lowercase, no trailing period, under 72 characters.
   Example: `fix(cli): handle missing SKILL.md gracefully`
5. If the change is non-trivial, add a body explaining *why*, not just *what* — wrap at ~72 characters.
6. If the change breaks backward compatibility, add a footer: `BREAKING CHANGE: <description>`.
7. Present the full message in a fenced code block so the user can copy it directly into `git commit -m`.

## Output format

```
<type>(<scope>): <subject>

<optional body>

<optional footer>
```

Keep it honest — don't invent scope or impact that isn't visible in the diff.
