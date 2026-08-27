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

// STORE_DIR is homedir-derived and read once at module load — same
// constraint as store.test.js, so `update`'s CLI-level behavior is tested
// as a real subprocess with HOME overridden, not as an in-process unit.
async function run(args, home) {
  return execFileAsync('node', [CLI_PATH, ...args], { env: { ...process.env, HOME: home } });
}

async function writeSkillFixture(storeDir, dirName, name, description) {
  const skillDir = path.join(storeDir, dirName);
  await fs.mkdir(skillDir, { recursive: true });
  await fs.writeFile(
    path.join(skillDir, 'SKILL.md'),
    `---\nname: ${name}\ndescription: ${description}\n---\n\nBody.\n`,
    'utf8'
  );
}

test('update <name> on a skill with no recorded source warns and does not throw', async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), 'skillport-update-nosrc-'));
  try {
    // A fixture with no .skillport-meta.json — simulates a skill installed
    // by a skillport version before source-tracking existed.
    await writeSkillFixture(path.join(home, '.skillport', 'store'), 'legacy-skill', 'legacy-skill', 'no source recorded');
    const { stderr } = await run(['update', 'legacy-skill'], home);
    assert.match(stderr, /no recorded source/);
  } finally {
    await fs.rm(home, { recursive: true, force: true });
  }
});

test('update <name> for a skill not in the store warns and does not throw', async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), 'skillport-update-missing-'));
  try {
    const { stderr } = await run(['update', 'nonexistent-skill'], home);
    assert.match(stderr, /not found in the global store/);
  } finally {
    await fs.rm(home, { recursive: true, force: true });
  }
});

test('update with no name and an empty store prints a friendly message', async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), 'skillport-update-empty-'));
  try {
    const { stdout } = await run(['update'], home);
    assert.match(stdout, /nothing to update/i);
  } finally {
    await fs.rm(home, { recursive: true, force: true });
  }
});

test('update with no name skips every entry that has no recorded source', async () => {
  const home = await fs.mkdtemp(path.join(os.tmpdir(), 'skillport-update-all-nosrc-'));
  try {
    await writeSkillFixture(path.join(home, '.skillport', 'store'), 'legacy-a', 'legacy-a', 'no source');
    await writeSkillFixture(path.join(home, '.skillport', 'store'), 'legacy-b', 'legacy-b', 'no source');
    const { stderr } = await run(['update'], home);
    const skipCount = (stderr.match(/no recorded source/g) || []).length;
    assert.equal(skipCount, 2);
  } finally {
    await fs.rm(home, { recursive: true, force: true });
  }
});
