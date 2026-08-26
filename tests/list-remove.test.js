import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { init } from '../src/commands/init.js';
import { list } from '../src/commands/list.js';
import { remove } from '../src/commands/remove.js';

async function makeTempProject() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'skillport-test-'));
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

test('init creates .claude/skills and .skillport.json, and is idempotent', async () => {
  const cwd = await makeTempProject();
  try {
    const first = await init({ cwd });
    assert.equal(first.alreadyInitialized, false);

    const configRaw = await fs.readFile(path.join(cwd, '.skillport.json'), 'utf8');
    const config = JSON.parse(configRaw);
    assert.equal(config.target, '.claude/skills');

    const stat = await fs.stat(path.join(cwd, '.claude', 'skills'));
    assert.ok(stat.isDirectory());

    const second = await init({ cwd });
    assert.equal(second.alreadyInitialized, true);
  } finally {
    await fs.rm(cwd, { recursive: true, force: true });
  }
});

test('list reports "no skills installed yet" for an empty project', async () => {
  const cwd = await makeTempProject();
  try {
    await init({ cwd });
    const result = await list({ cwd });
    assert.deepEqual(result, []);
  } finally {
    await fs.rm(cwd, { recursive: true, force: true });
  }
});

test('list finds installed skills and parses their frontmatter', async () => {
  const cwd = await makeTempProject();
  try {
    await init({ cwd });
    const targetDir = path.join(cwd, '.claude', 'skills');
    await writeSkillFixture(targetDir, 'pdf-tools', 'Extract and manipulate PDFs');
    await writeSkillFixture(targetDir, 'csv-tools', 'Work with CSV files');

    const result = await list({ cwd });
    const names = result.map((s) => s.name).sort();
    assert.deepEqual(names, ['csv-tools', 'pdf-tools']);

    const pdf = result.find((s) => s.name === 'pdf-tools');
    assert.equal(pdf.description, 'Extract and manipulate PDFs');
  } finally {
    await fs.rm(cwd, { recursive: true, force: true });
  }
});

test('remove deletes an installed skill directory', async () => {
  const cwd = await makeTempProject();
  try {
    await init({ cwd });
    const targetDir = path.join(cwd, '.claude', 'skills');
    await writeSkillFixture(targetDir, 'pdf-tools', 'Extract and manipulate PDFs');

    await remove('pdf-tools', { cwd });

    await assert.rejects(() => fs.access(path.join(targetDir, 'pdf-tools')));
  } finally {
    await fs.rm(cwd, { recursive: true, force: true });
  }
});

test('remove throws a clear error and leaves nothing behind when the skill is missing', async () => {
  const cwd = await makeTempProject();
  try {
    await init({ cwd });
    await assert.rejects(() => remove('does-not-exist', { cwd }), /not installed/);
  } finally {
    await fs.rm(cwd, { recursive: true, force: true });
  }
});

test('list respects a custom --target override', async () => {
  const cwd = await makeTempProject();
  try {
    const customTarget = path.join(cwd, '.agents', 'skills');
    await fs.mkdir(customTarget, { recursive: true });
    await writeSkillFixture(customTarget, 'agents-skill', 'Lives outside .claude/skills');

    const result = await list({ cwd, target: customTarget });
    assert.equal(result.length, 1);
    assert.equal(result[0].name, 'agents-skill');
  } finally {
    await fs.rm(cwd, { recursive: true, force: true });
  }
});
