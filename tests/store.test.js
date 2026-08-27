import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_PATH = path.join(__dirname, '..', 'src', 'cli.js');

// STORE_DIR is `os.homedir()`-derived and read once at module load, so the
// only reliable way to test it in isolation (without touching the real
// machine's ~/.skillport) is to run the CLI as a real subprocess with HOME
// overridden — an integration test, not a unit test, but the only kind
// that actually exercises the real git plumbing store.js shells out to.
async function run(args, home) {
  return execFileAsync('node', [CLI_PATH, ...args], { env: { ...process.env, HOME: home } });
}

async function writeSkillFixture(dir, name, description) {
  const skillDir = path.join(dir, name);
  await fs.mkdir(skillDir, { recursive: true });
  await fs.writeFile(
    path.join(skillDir, 'SKILL.md'),
    `---\nname: ${name}\ndescription: ${description}\n---\n\nBody.\n`,
    'utf8'
  );
}

test('store init/push/clone/pull round-trips a skill through a git remote across two "machines"', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'skillport-store-'));
  const bareRemote = path.join(root, 'remote.git');
  const homeA = path.join(root, 'home-a');
  const homeB = path.join(root, 'home-b');
  const projectB = path.join(root, 'project-b');

  try {
    await execFileAsync('git', ['init', '--bare', bareRemote]);
    await fs.mkdir(homeA, { recursive: true });
    await fs.mkdir(homeB, { recursive: true });
    await fs.mkdir(projectB, { recursive: true });

    // "Machine A": manually seed the global store (bypassing network
    // install) with a fixture skill, then init + push.
    await writeSkillFixture(path.join(homeA, '.skillport', 'store'), 'demo-skill', 'A demo skill');
    await run(['store', 'init', '--remote', bareRemote], homeA);
    const push = await run(['store', 'push'], homeA);
    assert.match(push.stdout, /Committed/);
    assert.match(push.stdout, /Pushed/);

    // "Machine B": fresh clone, then link straight from the store (no
    // project install step) — this is the actual point of the feature.
    const clone = await run(['store', 'clone', bareRemote], homeB);
    assert.match(clone.stdout, /Cloned/);

    const list = await run(['list', '--global'], homeB);
    assert.match(list.stdout, /demo-skill/);

    const link = await run(['link', 'demo-skill', '--to', projectB], homeB);
    assert.match(link.stdout, /Linked/);

    const linkPath = path.join(projectB, '.claude', 'skills', 'demo-skill');
    const stat = await fs.lstat(linkPath);
    assert.ok(stat.isSymbolicLink());
    const target = await fs.readlink(linkPath);
    assert.match(target, /home-b.*\.skillport.*store.*demo-skill/);

    // Editing via machine A, pushing, then pulling on machine B should
    // propagate — the whole reason this feature exists.
    await fs.writeFile(
      path.join(homeA, '.skillport', 'store', 'demo-skill', 'SKILL.md'),
      '---\nname: demo-skill\ndescription: An UPDATED demo skill\n---\n\nBody.\n',
      'utf8'
    );
    await run(['store', 'push'], homeA);
    const pull = await run(['store', 'pull'], homeB);
    assert.match(pull.stdout.length ? pull.stdout : 'pulled', /.+/); // pull ran without throwing

    const updated = await fs.readFile(path.join(linkPath, 'SKILL.md'), 'utf8');
    assert.match(updated, /UPDATED/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('store push without init gives a clear error, not a crash', async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), 'skillport-store-noinit-'));
  try {
    await assert.rejects(run(['store', 'push'], home), /not a git repo yet/);
  } finally {
    await fs.rm(home, { recursive: true, force: true });
  }
});

test('store clone refuses to clobber an existing non-empty store', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'skillport-store-clobber-'));
  const bareRemote = path.join(root, 'remote.git');
  const home = path.join(root, 'home');
  try {
    await execFileAsync('git', ['init', '--bare', bareRemote]);
    await writeSkillFixture(path.join(home, '.skillport', 'store'), 'existing-skill', 'Already here');
    await assert.rejects(run(['store', 'clone', bareRemote], home), /already has content/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
