# Research & Development Log

Internal notes on benchmarking and buzz-tracking for skillport, and what got built in response. Not part of the public README.

## Cycle 1 — 2026-08-27

**Research**: While researching complementary tools for `awesometime` (a sibling project in this account), searched for Claude Code multi-machine sync pain points and found a much bigger, directly relevant finding for skillport: **`anthropics/claude-code` has an open feature request, issue #57678, "Add cloud sync for skills, settings, and memory across machines"** — an officially acknowledged, currently-unmet gap, not a guess. Multiple blog posts (Nick Ang, Christopher Penkin, frxiaobei) document people hand-rolling workarounds: git+LaunchAgent, iCloud Drive symlinks, chezmoi. No one has shipped a small dedicated tool for just this.

skillport's `link` command already solved "sync across projects on one machine" via symlinks — the natural, low-effort extension is "sync across machines," using the same symlink philosophy but with git as the transport for the one thing that *can't* be a local symlink between machines: the global store itself.

**Shipped**: `skillport store init/push/pull/clone` — turns `~/.skillport/store` into a git repo, pushable to any remote (GitHub, GitLab, a private server) and cloneable onto a new machine. Also fixed a real gap this surfaced: `link` previously required the skill to already be copied into the *current project*, which meant a freshly-cloned store (via `store clone`) had no way to actually be used without re-running `install` (re-fetching over the network, defeating the point of syncing). Fixed `link` to fall back to the global store when the skill isn't in the current project.

Verified with a real integration test spawning the CLI as a subprocess with two different `HOME` overrides (simulating two machines) round-tripping through a real local bare git repo: install → init → push → clone → link → edit → push → pull → confirm the edit propagated through the symlink. Not mocked — actual git plumbing, actual symlinks, actual file content change observed on the "other machine."
