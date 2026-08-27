# Running a shared team skill library

Everything in the main README assumes one person syncing their own skills across their own machines. The same `store` mechanism works just as well for a small team sharing one library — the remote is just a regular git repo, so whatever access control your git host already gives you (a private GitHub/GitLab repo, an org team, etc.) is what governs who can read/write it.

## Setup

**One person creates the shared store once:**

```bash
skillport store init --remote git@github.com:your-org/team-skills.git
skillport install owner/repo/some-skill   # add whatever skills the team should start with
skillport store push
```

**Everyone else joins by cloning it:**

```bash
skillport store clone git@github.com:your-org/team-skills.git
```

From there, `skillport link <name> --to <project>` works the same as the single-person case — it symlinks straight from the shared store into whichever local project needs it.

## Day to day

```bash
skillport store pull    # before starting work, or whenever you want the latest
# ...install a new skill, or edit one already in ~/.skillport/store...
skillport store push    # share it with the rest of the team
```

## Onboarding a new team member

This is arguably the best reason to do this over each person copy-pasting skills by hand: a new hire's entire Claude Code skill setup is one command.

```bash
skillport store clone git@github.com:your-org/team-skills.git
skillport link the-skill-they-need --to ~/code/whatever-theyre-onboarding-into
```

No "here's a folder of skills, copy these into your `.claude/skills`" onboarding doc needed.

## The one thing to know: conflicts are handled like any git repo, because it is one

If two people edit the same skill and both try to push without pulling first, the second `store push` fails with a normal git non-fast-forward rejection — `skillport` doesn't try to auto-merge or silently overwrite anything. Fix it the same way you'd fix it in any git repo:

```bash
cd ~/.skillport/store
git pull        # merge or resolve conflicts manually if needed
skillport store push
```

For a small team, "pull before you push, same as always" is normally enough — there's no locking or real-time collaboration layer here, just git.

## A lightweight convention worth adopting

Skills are stored under a directory name derived from where they came from (`owner-repo-skillname`), so two different people installing two *different* skills won't collide even if the skill names happen to match. But if your team writes its own custom skills (not fetched from someone else's repo), consider keeping their source in the team-skills repo itself — same pattern this project uses for its own example skills (`examples/skills/<name>/SKILL.md` in the [skillport repo](https://github.com/tiger-dreams/skillport) itself) — so a skill's origin and its latest version live in one place instead of drifting apart.
