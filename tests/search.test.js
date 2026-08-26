import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { matchesQuery, search, truncate } from '../src/commands/search.js';

const FIXTURE_REGISTRY = [
  {
    name: 'pdf-tools',
    description: 'Extract text and tables from PDF files',
    tags: ['pdf', 'documents'],
    source: 'anthropics/skills/document-skills/pdf',
  },
  {
    name: 'csv-tools',
    description: 'Read, filter, and transform CSV data',
    tags: ['csv', 'data'],
    source: 'anthropics/skills/document-skills/csv',
  },
];

test('matchesQuery matches on name, description, and tags case-insensitively', () => {
  const [pdfTools, csvTools] = FIXTURE_REGISTRY;
  assert.ok(matchesQuery(pdfTools, 'PDF'));
  assert.ok(matchesQuery(pdfTools, 'extract text'));
  assert.ok(matchesQuery(pdfTools, 'documents'));
  assert.ok(!matchesQuery(csvTools, 'pdf'));
});

test('truncate shortens long strings with an ellipsis and leaves short ones alone', () => {
  assert.equal(truncate('short description', 60), 'short description');
  const long = 'x'.repeat(80);
  const result = truncate(long, 60);
  assert.equal(result.length, 60);
  assert.ok(result.endsWith('…'));
});

test('search returns matching entries from a stub registry file', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'skillport-registry-'));
  const registryPath = path.join(dir, 'skills.json');
  await fs.writeFile(registryPath, JSON.stringify(FIXTURE_REGISTRY, null, 2));

  try {
    const matches = await search('csv', { registryPath });
    assert.equal(matches.length, 1);
    assert.equal(matches[0].name, 'csv-tools');
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});

test('search throws a clear error when the registry file is missing', async () => {
  const missingPath = path.join(os.tmpdir(), 'skillport-does-not-exist', 'skills.json');
  await assert.rejects(() => search('anything', { registryPath: missingPath }), /Registry not found/);
});

test('search resolves no matches gracefully instead of throwing', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'skillport-registry-'));
  const registryPath = path.join(dir, 'skills.json');
  await fs.writeFile(registryPath, JSON.stringify(FIXTURE_REGISTRY, null, 2));

  try {
    const matches = await search('nonexistent-topic-xyz', { registryPath });
    assert.deepEqual(matches, []);
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
