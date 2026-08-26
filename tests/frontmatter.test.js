import { test } from 'node:test';
import assert from 'node:assert/strict';

import { parseFrontmatter } from '../src/lib/frontmatter.js';

test('parseFrontmatter extracts simple key: value pairs', () => {
  const content = `---
name: pdf-tools
description: Extract and manipulate PDF files
---

# PDF Tools

Some body content.
`;
  const { data, body } = parseFrontmatter(content);
  assert.equal(data.name, 'pdf-tools');
  assert.equal(data.description, 'Extract and manipulate PDF files');
  assert.match(body, /# PDF Tools/);
});

test('parseFrontmatter strips surrounding quotes', () => {
  const content = `---
name: "quoted-name"
description: 'single quoted description'
---
body
`;
  const { data } = parseFrontmatter(content);
  assert.equal(data.name, 'quoted-name');
  assert.equal(data.description, 'single quoted description');
});

test('parseFrontmatter returns empty data when no frontmatter block exists', () => {
  const { data, body } = parseFrontmatter('# Just a heading\n\nNo frontmatter here.');
  assert.deepEqual(data, {});
  assert.match(body, /Just a heading/);
});

test('parseFrontmatter ignores blank lines and comments in the block', () => {
  const content = `---
name: my-skill

# a comment
description: does things
---
body
`;
  const { data } = parseFrontmatter(content);
  assert.equal(data.name, 'my-skill');
  assert.equal(data.description, 'does things');
});

test('parseFrontmatter handles CRLF line endings', () => {
  const content = '---\r\nname: crlf-skill\r\ndescription: works on windows\r\n---\r\nbody\r\n';
  const { data } = parseFrontmatter(content);
  assert.equal(data.name, 'crlf-skill');
  assert.equal(data.description, 'works on windows');
});

test('parseFrontmatter handles non-string input gracefully', () => {
  const { data, body } = parseFrontmatter(undefined);
  assert.deepEqual(data, {});
  assert.equal(body, '');
});
