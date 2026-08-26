---
name: Skill submission
about: Propose a skill to add to the community registry
title: "[registry] Add <skill-name>"
labels: registry
---

Thanks for proposing a skill for the registry! Please fill in the fields below — this maps directly to the entry that will be added to `registry/skills.json`. See `CONTRIBUTING.md` for the full process.

**name**
(matches the `name` in the skill's `SKILL.md` frontmatter)

**description**
(one sentence, what the skill does)

**tags**
(comma-separated, e.g. `git, workflow, docs`)

**source**
(`owner/repo` or `owner/repo/path/to/skill` — must point at a public repo containing a valid `SKILL.md`)

**Checklist**
- [ ] The skill lives in a public repository I have the rights to reference
- [ ] `SKILL.md` has valid YAML frontmatter with `name` and `description`
- [ ] I've tested `skillport install <source>` locally and it works
- [ ] The skill does something genuinely useful and is not a duplicate of an existing registry entry
