# Contributing to skillport

Thanks for considering a contribution. This project is small on purpose — please keep changes focused.

## Running tests locally

```bash
git clone https://github.com/tiger-dreams/skillport.git
cd skillport
npm install
npm test
```

Tests run with Node's built-in test runner (`node --test tests/`). There's no separate build step.

## Proposing a skill for the registry

The registry (`registry/skills.json`) is a curated, community-sourced list of skills that `skillport search` reads from. To add one:

1. Make sure the skill lives in a public repository (yours or one you have rights to reference) with a valid `SKILL.md` — YAML frontmatter with `name` and `description`, plus a body.
2. Add an entry to `registry/skills.json`:
   ```json
   {
     "name": "your-skill-name",
     "description": "One sentence describing what it does.",
     "tags": ["relevant", "tags"],
     "source": "owner/repo" 
   }
   ```
   Use `owner/repo/path/to/skill` for `source` if the skill isn't at the repo root.
3. Validate the JSON is well-formed:
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('registry/skills.json'))"
   ```
4. Test that it actually installs:
   ```bash
   node src/cli.js install <your source>
   ```
5. Open a PR. You can also open an issue using the "Skill submission" template if you'd rather someone else wire up the entry.

Entries should be genuinely useful, working, and not duplicates of existing ones. Low-effort or broken submissions will be asked for changes before merge.

## Code style

- **Zero new runtime dependencies without discussion.** skillport is intentionally dependency-free — it should install fast and stay auditable. If you think a dependency is truly justified, open an issue first to discuss before sending a PR.
- Stick to Node.js builtins (`fs`, `path`, `https`, `child_process`, etc).
- Match the existing code style in `src/` — plain, readable, minimal abstraction.
- Add or update tests in `tests/` for any behavior change.

## Reporting bugs

Open an issue using the "Bug report" template. Include the command you ran, what you expected, what actually happened, and your Node/OS version. A minimal reproduction is always appreciated.

## Pull requests

- Keep PRs small and focused on one change.
- Reference the issue you're fixing, if any.
- Make sure `npm test` passes before opening the PR — CI will also run it on Node 18 and 20.
