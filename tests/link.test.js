import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { init } from '../src/commands/init.js';
import { link } from '../src/commands/link.js';

async function makeTempProject() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'skillport-link-'));
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

test('link symlinks an installed skill into another project', async () => {
  const cwd = await makeTempProject();
  const otherProject = await makeTempProject();
  try {
    await init({ cwd });
    await writeSkillFixture(path.join(cwd, '.claude', 'skills'), 'pdf-tools', 'PDF stuff');

    const result = await link('pdf-tools', { to: otherProject, cwd });

    const destStat = await fs.lstat(result.dest);
    assert.ok(destStat.isSymbolicLink());

    // Following the symlink should see the SKILL.md from the source project.
    const skillMd = await fs.readFile(path.join(result.dest, 'SKILL.md'), 'utf8');
    assert.match(skillMd, /pdf-tools/);
  } finally {
    await fs.rm(cwd, { recursive: true, force: true });
    await fs.rm(otherProject, { recursive: true, force: true });
  }
});

test('link throws a clear error when the skill is not installed locally', async () => {
  const cwd = await makeTempProject();
  const otherProject = await makeTempProject();
  try {
    await init({ cwd });
    await assert.rejects(
      () => link('nonexistent-skill', { to: otherProject, cwd }),
      /not installed in this project/
    );
  } finally {
    await fs.rm(cwd, { recursive: true, force: true });
    await fs.rm(otherProject, { recursive: true, force: true });
  }
});

test('link throws a clear error when the destination path does not exist', async () => {
  const cwd = await makeTempProject();
  try {
    await init({ cwd });
    await writeSkillFixture(path.join(cwd, '.claude', 'skills'), 'pdf-tools', 'PDF stuff');
    await assert.rejects(
      () => link('pdf-tools', { to: path.join(cwd, 'does', 'not', 'exist'), cwd }),
      /does not exist/
    );
  } finally {
    await fs.rm(cwd, { recursive: true, force: true });
  }
});
