import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  computeSafeName,
  extractOwnerRepoFromUrl,
  parseSource,
  sanitizeName,
} from '../src/lib/source.js';

test('parseSource parses owner/repo shorthand', () => {
  const result = parseSource('anthropics/skills');
  assert.equal(result.type, 'github');
  assert.equal(result.owner, 'anthropics');
  assert.equal(result.repo, 'skills');
  assert.equal(result.subpath, null);
  assert.equal(result.url, 'https://github.com/anthropics/skills.git');
});

test('parseSource parses owner/repo/path/to/skilldir shorthand', () => {
  const result = parseSource('anthropics/skills/document-skills/pdf');
  assert.equal(result.type, 'github');
  assert.equal(result.owner, 'anthropics');
  assert.equal(result.repo, 'skills');
  assert.equal(result.subpath, 'document-skills/pdf');
  assert.equal(result.url, 'https://github.com/anthropics/skills.git');
});

test('parseSource accepts full https git URLs', () => {
  const result = parseSource('https://github.com/owner/repo.git');
  assert.equal(result.type, 'url');
  assert.equal(result.url, 'https://github.com/owner/repo.git');
  assert.equal(result.owner, 'owner');
  assert.equal(result.repo, 'repo');
});

test('parseSource accepts scp-like ssh git URLs', () => {
  const result = parseSource('git@github.com:owner/repo.git');
  assert.equal(result.type, 'url');
  assert.equal(result.owner, 'owner');
  assert.equal(result.repo, 'repo');
});

test('parseSource rejects empty/whitespace input', () => {
  assert.throws(() => parseSource(''), /source is required/i);
  assert.throws(() => parseSource('   '), /source is required/i);
});

test('parseSource rejects a bare single segment', () => {
  assert.throws(() => parseSource('justonesegment'), /Invalid source/);
});

test('parseSource rejects invalid characters in owner or repo', () => {
  assert.throws(() => parseSource('owner name/repo'), /Invalid source/);
  assert.throws(() => parseSource('owner/repo;rm -rf'), /Invalid source/);
  assert.throws(() => parseSource('$(whoami)/repo'), /Invalid source/);
});

test('parseSource rejects path traversal in subpath', () => {
  assert.throws(() => parseSource('owner/repo/../../etc'), /traversal/i);
});

test('extractOwnerRepoFromUrl handles https and scp-like URLs', () => {
  assert.deepEqual(extractOwnerRepoFromUrl('https://github.com/owner/repo.git'), {
    owner: 'owner',
    repo: 'repo',
  });
  assert.deepEqual(extractOwnerRepoFromUrl('git@github.com:owner/repo.git'), {
    owner: 'owner',
    repo: 'repo',
  });
});

test('sanitizeName produces a safe lowercase single segment', () => {
  assert.equal(sanitizeName('My Cool Skill!!'), 'my-cool-skill');
  assert.equal(sanitizeName('  --leading-and-trailing--  '), 'leading-and-trailing');
  assert.equal(sanitizeName(''), 'skill');
});

test('computeSafeName joins owner-repo-name', () => {
  assert.equal(
    computeSafeName({ owner: 'anthropics', repo: 'skills', subpath: null, name: 'pdf-tools' }),
    'anthropics-skills-pdf-tools'
  );
});

test('computeSafeName falls back to subpath basename when no frontmatter name', () => {
  assert.equal(
    computeSafeName({ owner: 'acme', repo: 'skills', subpath: 'nested/pdf', name: null }),
    'acme-skills-pdf'
  );
});

test('computeSafeName falls back to repo when nothing else is available', () => {
  assert.equal(
    computeSafeName({ owner: null, repo: 'repo', subpath: null, name: null }),
    'repo'
  );
});
