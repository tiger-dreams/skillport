import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { writeStoreMeta, readStoreMeta } from '../src/lib/storemeta.js';

test('writeStoreMeta then readStoreMeta round-trips the source string', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'skillport-storemeta-'));
  try {
    await writeStoreMeta(dir, { source: 'owner/repo/path/to/skill' });
    const meta = await readStoreMeta(dir);
    assert.equal(meta.source, 'owner/repo/path/to/skill');
    assert.ok(meta.updatedAt); // an ISO timestamp was recorded
    assert.ok(!Number.isNaN(Date.parse(meta.updatedAt)));
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('readStoreMeta returns null for a store entry with no meta file (pre-update-feature installs)', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'skillport-storemeta-none-'));
  try {
    const meta = await readStoreMeta(dir);
    assert.equal(meta, null);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('readStoreMeta returns null (not a throw) for a corrupt meta file', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'skillport-storemeta-corrupt-'));
  try {
    await fs.writeFile(path.join(dir, '.skillport-meta.json'), 'not valid json{{{', 'utf8');
    const meta = await readStoreMeta(dir);
    assert.equal(meta, null);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
