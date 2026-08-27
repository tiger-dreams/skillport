# Research & Development Log

Internal notes on benchmarking and buzz-tracking for skillport, and what got built in response. Not part of the public README.

## Cycle 1 — 2026-08-27

**Research**: While researching complementary tools for `awesometime` (a sibling project in this account), searched for Claude Code multi-machine sync pain points and found a much bigger, directly relevant finding for skillport. A web-search summary initially cited a specific issue number that turned out not to exist on re-check via `gh issue view` (a fabricated-looking citation — caught before shipping further on it, though it had already gone into the first commit's README and this file, since verification happened one cycle late). Re-searched directly against the real repo with `gh issue list --search` and found the real, verifiable issues instead: **#69231** ("Account-level cloud sync for personal state (skills, memory, settings, hooks)", closed, but explicitly lists `~/.claude/skills/` as machine-local in its problem statement) and **#22648** ("Account-level settings sync across devices", open, 25 comments, cross-references several other duplicate requests). Multiple blog posts (Nick Ang, Christopher Penkin, frxiaobei) independently document people hand-rolling workarounds: git+LaunchAgent, iCloud Drive symlinks, chezmoi. No one has shipped a small dedicated tool for just the skills part of this.

**Correction note**: the README and this file briefly cited a non-existent issue #57678 before this was caught — fixed to cite #69231/#22648 instead, which are real and checked. Lesson: verify a specific-looking citation (issue numbers, PR numbers) from a search-engine *summary* against the actual source before it goes into a public README, not after — an AI-generated search summary can produce a plausible but fabricated specific detail even when the general claim is correct.

skillport's `link` command already solved "sync across projects on one machine" via symlinks — the natural, low-effort extension is "sync across machines," using the same symlink philosophy but with git as the transport for the one thing that *can't* be a local symlink between machines: the global store itself.

**Shipped**: `skillport store init/push/pull/clone` — turns `~/.skillport/store` into a git repo, pushable to any remote (GitHub, GitLab, a private server) and cloneable onto a new machine. Also fixed a real gap this surfaced: `link` previously required the skill to already be copied into the *current project*, which meant a freshly-cloned store (via `store clone`) had no way to actually be used without re-running `install` (re-fetching over the network, defeating the point of syncing). Fixed `link` to fall back to the global store when the skill isn't in the current project.

Verified with a real integration test spawning the CLI as a subprocess with two different `HOME` overrides (simulating two machines) round-tripping through a real local bare git repo: install → init → push → clone → link → edit → push → pull → confirm the edit propagated through the symlink. Not mocked — actual git plumbing, actual symlinks, actual file content change observed on the "other machine."

## Cycle 2 — 2026-08-27

**Observation** (not external research this time — a standard package-manager UX gap, self-evident once looked for): every comparable tool (npm, brew, apt, vercel-labs/skills itself) has an `update`/`upgrade` command. skillport didn't — and worse, couldn't cleanly have one, because `install` never persisted *what source a skill came from*, so there was nothing to re-fetch from without the user retyping the original source string.

**Shipped**: a `.skillport-meta.json` written into each store entry at install time (excluded from project copies — it's store-internal bookkeeping), recording the source string. `skillport update [name]` re-fetches from that recorded source; with no name, updates every store entry that has one, skipping (with a warning, not an error) any installed by a version before this existed. Verified live end-to-end against the real `tiger-dreams/skillport` repo: install writes the meta file correctly, `update <name>` and `update` (all) both successfully re-fetch and refresh the project copy.

**Testing note**: `install.js` itself has no existing automated network test (a pre-existing gap in the project, not introduced here), so `update`'s tests follow the same pattern — pure unit tests for the new `storemeta.js` read/write logic, subprocess-level tests for `update`'s skip-branches (not-in-store, no-recorded-source) using local fixtures, and one real manual verification against the live repo for the actual re-fetch path, rather than an automated network-dependent test.

## Cycle 3 — 2026-08-27

**Use-case guide (requested), not fresh research**: added a "Where people use this" README section and a dedicated `docs/team-skill-library.md` guide for a use case the docs hadn't covered — a small team sharing one skill library via a shared remote, not just one person across their own machines.

**Bug found and fixed while writing it**: while verifying the guide's conflict-handling claim was actually true (simulated two people pushing without pulling, using a real local bare-repo remote), found `storePush`'s error message was wrong for this exact case — it always said "did you set a remote with `skillport store init --remote <url>`?" even when a remote *was* set and the real problem was a normal git non-fast-forward rejection (someone else pushed first). Fixed to detect that case from `git`'s actual stderr and point at `skillport store pull` instead, with a test that reproduces the real two-machine conflict scenario rather than just checking the string doesn't crash.

**Process note**: this is the same lesson as the awesometime `a11yTitle` bug from an earlier cycle — writing accurate documentation is a good way to accidentally test claims nobody had actually verified, and it caught something 46 passing tests hadn't (there was no test for the conflict path at all until this cycle).
