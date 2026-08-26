# skillport

**Keep one personal library of AI agent skills in sync across every project you work in.**

[![npm version](https://img.shields.io/npm/v/skillport.svg)](https://www.npmjs.com/package/skillport)
[![license](https://img.shields.io/npm/l/skillport.svg)](https://github.com/tiger-dreams/skillport/blob/main/LICENSE)
[![node](https://img.shields.io/node/v/skillport.svg)](https://www.npmjs.com/package/skillport)

`skillport` is a zero-dependency CLI for maintaining a personal library of [Agent Skills](#what-are-agent-skills) — the `SKILL.md` format used by Claude Code and compatible AI coding agents — and keeping it **live-synced by symlink** across every local project you use it in, instead of copy-pasting a snapshot into each repo.

## Why

If you only ever install a skill once into one project, [`vercel-labs/skills`](https://github.com/vercel-labs/skills) already does that well — it's the standard `npx skills add owner/repo@skill` registry client, and skillport is not trying to replace it.

skillport exists for a narrower, different problem: **maintaining your own skill library across many local repos at once.** If you write or tweak a skill while working in project A, and you use that same skill in nine other projects, a one-time install leaves ten independent copies that silently drift the moment you edit any one of them.

- **`skillport install`** fetches a skill once into a local global store (`~/.skillport/store`) — same idea as any installer.
- **`skillport link`** symlinks it from that store into as many local projects as you want. Edit it in any linked project (or the store) and every other linked project sees the change immediately — no re-install, no diffing folders, no drift.
- **`skillport search`** gives you a small, curated registry to discover skills by name — a lightweight complement to `skills.sh`, not a competitor to it.

If you just need to grab one skill into one project, use `vercel-labs/skills`. If you maintain a personal skill library you reuse across many repos and want edits to propagate instead of drift, that's what skillport is for.

## What are Agent Skills?

An Agent Skill is a directory containing a `SKILL.md` file with YAML frontmatter (`name`, `description`) and a markdown body that tells an AI coding agent what the skill does and when to use it, plus any supporting files (scripts, templates, references) the skill needs. Claude Code and other compatible agent tools load these to extend what the agent knows how to do — without touching the agent's own code.

## Install

Not yet on the npm registry — install straight from GitHub for now:

```bash
npm install -g github:tiger-dreams/skillport
```

Or run it without installing:

```bash
npx github:tiger-dreams/skillport <command>
```

## Quick start

```
$ skillport init
✓ Created .claude/skills/
✓ Created .skillport.json

$ skillport search changelog
Found 1 skill matching "changelog":

  changelog-from-git-log   Generates a CHANGELOG.md section from git log between two refs, grouped by change type.
  source: tiger-dreams/skillport/examples/skills/changelog-from-git-log

$ skillport install tiger-dreams/skillport/examples/skills/changelog-from-git-log
✓ Fetched tiger-dreams/skillport/examples/skills/changelog-from-git-log
✓ Cached in ~/.skillport/store/tiger-dreams/skillport/changelog-from-git-log
✓ Installed to .claude/skills/changelog-from-git-log

$ skillport list
Installed skills (.claude/skills):

  changelog-from-git-log   Generates a CHANGELOG.md section from git log between two refs, grouped by change type.
```

## See it work

The `link` command is the core differentiator over a one-time installer — here's the actual sequence, run for real in two temp project directories, unedited output included:

```
$ skillport init
Initialized skillport project.
  created .claude/skills/
  created .skillport.json

$ skillport install tiger-dreams/skillport/examples/skills/conventional-commits
Fetched "conventional-commits" -> /Users/tiger/.skillport/store/tiger-dreams-skillport-conventional-commits
Installed "conventional-commits" — Writes commit messages in Conventional Commits format from a staged diff. Use when the user asks for a commit message, wants help committing changes, or mentions "conventional commits".
  -> .claude/skills/conventional-commits

$ skillport link conventional-commits --to /tmp/skillport-demo-project-b
Linked "conventional-commits" -> /tmp/skillport-demo-project-b/.claude/skills/conventional-commits

$ ls -la /tmp/skillport-demo-project-b/.claude/skills/conventional-commits
lrwxr-xr-x  1 tiger  wheel  73 Aug 27 01:01 /tmp/skillport-demo-project-b/.claude/skills/conventional-commits -> /private/tmp/skillport-demo-project-a/.claude/skills/conventional-commits
```

That last line is a real symlink (`l...->`), not a copy — edit `conventional-commits/SKILL.md` from either project and the other sees the change immediately, because they're the same file on disk.

## Commands

| Command | Description |
|---|---|
| `skillport init` | Set up `.claude/skills/` and `.skillport.json` in the current project. |
| `skillport install <owner/repo>` | Install a skill from a GitHub repo (or `owner/repo/path/to/skill` for a subdirectory). |
| `skillport list` | List skills installed in the current project. |
| `skillport remove <name>` | Remove a skill from the current project. |
| `skillport search <query>` | Search the community registry by name, description, or tags. |
| `skillport link <name> --to <path>` | Symlink an installed skill into another local project. |

### `skillport init`

Creates `.claude/skills/` (if it doesn't exist) and a `.skillport.json` config file in the current directory. Run this once per project before installing anything.

### `skillport install <owner/repo>` / `<owner/repo/path/to/skill>`

Fetches a skill from GitHub, validates that it contains a `SKILL.md`, caches it in `~/.skillport/store/`, and copies it into `.claude/skills/<name>` in the current project.

```bash
skillport install tiger-dreams/skillport/examples/skills/conventional-commits

# Install into a different directory, e.g. for agents that use .agents/skills
skillport install owner/repo --target .agents/skills

# Just cache it globally, don't install into the current project
skillport install owner/repo --global-only
```

**Flags**

- `--target <dir>` — install into a directory other than `.claude/skills` (e.g. `.agents/skills`).
- `--global-only` — fetch and cache the skill without copying it into the current project.

### `skillport list`

Lists the skills installed in the current project — name and description, read from each `SKILL.md`.

```bash
skillport list
skillport list --global   # list everything cached in ~/.skillport/store/
```

### `skillport remove <name>`

Removes a skill from the current project's skills directory. Does not touch the global cache.

### `skillport search <query>`

Searches the bundled community registry (`registry/skills.json`) by name, description, and tags, and prints matches along with the install source for each.

```bash
skillport search commit
```

### `skillport link <name> --to <path>`

Symlinks an installed skill into another local project directory, so edits to the skill in one place are immediately reflected everywhere it's linked. This is the original motivating use case: maintain one personal skill library and keep it in sync across every repo you work in, without a separate "update" step.

```bash
skillport link conventional-commits --to ~/code/other-project
```

## Why not just copy-paste, git submodules, or vercel-labs/skills?

Honestly, for a single skill you use once, `npx skills add` (from [vercel-labs/skills](https://github.com/vercel-labs/skills)) or plain copy-paste is fine — skillport isn't solving a problem you don't have yet. It starts paying off once you're maintaining your *own* skills across more than one project:

- **vercel-labs/skills** installs a snapshot into one project at a time from its registry — it doesn't keep multiple local projects in sync with each other after that.
- **Copy-paste** has the same problem: the moment you edit a skill in project A, projects B through J are stale and nobody notices.
- **Git submodules** solve sync too, but at the cost of submodule ergonomics (detached HEADs, `--recurse-submodules`, nested repo state) for what's usually just a folder of markdown.
- **`skillport link`** is just a symlink from a shared store into each project — edit it anywhere, every linked project sees it instantly, no re-install step, no drift, no submodule ceremony.

What skillport deliberately *doesn't* do: dependency resolution, semver ranges, lockfiles, or a hosted package index. Skills are simple enough that they don't need it yet — the registry is just a curated JSON file, and installs pull straight from GitHub.

## Registry

`registry/skills.json` is a community-curated index of skills you can install by name via `skillport search`. Every entry points at a real, public, installable skill — including the three example skills shipped in this repo under `examples/skills/`.

Want to add your own? See [CONTRIBUTING.md](./CONTRIBUTING.md#proposing-a-skill-for-the-registry) for the format and process — it's a small JSON entry and a PR.

## Contributing

Bug reports, skill submissions, and PRs are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to run tests, propose a registry entry, and the code style expectations (short version: zero new runtime dependencies, Node builtins only).

## License

MIT © [tiger-dreams](https://github.com/tiger-dreams) — see [LICENSE](./LICENSE).
