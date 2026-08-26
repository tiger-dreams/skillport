import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseArgs } from '../src/lib/args.js';

test('parseArgs collects positional args and boolean/string flags', () => {
  const { positional, flags } = parseArgs(
    ['install', 'owner/repo', '--target', '.agents/skills', '--global-only'],
    { boolean: ['global-only'], string: ['target'] }
  );
  assert.deepEqual(positional, ['install', 'owner/repo']);
  assert.equal(flags.target, '.agents/skills');
  assert.equal(flags['global-only'], true);
});

test('parseArgs supports --flag=value syntax', () => {
  const { flags } = parseArgs(['--to=../other-project'], { string: ['to'] });
  assert.equal(flags.to, '../other-project');
});

test('parseArgs treats unknown flags as booleans unless followed by =value', () => {
  const { flags } = parseArgs(['--verbose']);
  assert.equal(flags.verbose, true);
});
