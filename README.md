# skillport

**npm for your AI agent's skills.**

[![npm version](https://img.shields.io/npm/v/skillport.svg)](https://www.npmjs.com/package/skillport)
[![license](https://img.shields.io/npm/l/skillport.svg)](https://github.com/tiger-dreams/skillport/blob/main/LICENSE)
[![node](https://img.shields.io/node/v/skillport.svg)](https://www.npmjs.com/package/skillport)

`skillport` is a zero-dependency CLI for installing, sharing, and syncing [Agent Skills](#what-are-agent-skills) — the `SKILL.md` format used by Claude Code and compatible AI coding agents — across your projects.

## Why

Agent skills give a coding agent (Claude Code, and other tools adopting the same format) new, reusable capabilities: a directory with a `SKILL.md` file describing when and how to use it, plus supporting files. They're genuinely useful — but right now, sharing them is stuck in the copy-paste era:

- **No install step.** You find a good skill in someone else's repo and manually copy the folder into `.claude/skills/`.
- **No versioning.** There's no way to pull in updates without diffing directories by hand.
- **No discovery.** Skills are scattered across gists, repos, and Slack messages with no shared index.
- **No sync.** If you maintain a personal skill library and use it across ten projects, updating one means updating ten.

skillport treats skills like packages: install them from any GitHub repo, discover them through a shared registry, and keep them in sync with a symlink — the same workflow `npm` gave you for code, applied to the things that make your agent smarter.

## What are Agent Skills?

An Agent Skill is a directory containing a `SKILL.md` file with YAML frontmatter (`name`, `description`) and a markdown body that tells an AI coding agent what the skill does and when to use it, plus any supporting files (scripts, templates, references) the skill needs. Claude Code and other compatible agent tools load these to extend what the agent knows how to do — without touching the agent's own code.

## Install

```bash
npm install -g skillport
```

Or run it without installing:

```bash
npx skillport <command>
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

## Why not just copy-paste or git submodules?

Honestly, for a single skill you use once, copy-paste is fine — skillport isn't solving a problem you don't have yet. It starts paying off once you're managing more than a couple of skills across more than one project:

- **Versioning.** Re-running `skillport install` pulls the latest version of a skill from its source. With copy-paste, you're manually diffing folders to see what changed.
- **Discovery.** `skillport search` gives you one place to look instead of remembering which repo had that skill you liked.
- **Sync.** `skillport link` keeps a personal skill library in sync across every project via symlinks — a plain copy silently drifts the moment you edit it in one place and forget the other nine.
- **Git submodules** solve sync too, but at the cost of submodule ergonomics (detached HEADs, `--recurse-submodules`, nested repo state) for what's usually just a folder of markdown. skillport is a much lighter-weight tool for a much narrower job.

What skillport deliberately *doesn't* do: dependency resolution, semver ranges, lockfiles, or a hosted package index. Skills are simple enough that they don't need it yet — the registry is just a curated JSON file, and installs pull straight from GitHub.

## Registry

`registry/skills.json` is a community-curated index of skills you can install by name via `skillport search`. Every entry points at a real, public, installable skill — including the three example skills shipped in this repo under `examples/skills/`.

Want to add your own? See [CONTRIBUTING.md](./CONTRIBUTING.md#proposing-a-skill-for-the-registry) for the format and process — it's a small JSON entry and a PR.

## Contributing

Bug reports, skill submissions, and PRs are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to run tests, propose a registry entry, and the code style expectations (short version: zero new runtime dependencies, Node builtins only).

## License

MIT © [tiger-dreams](https://github.com/tiger-dreams) — see [LICENSE](./LICENSE).
