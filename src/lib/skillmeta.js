import fs from 'node:fs/promises';
import path from 'node:path';

import { parseFrontmatter } from './frontmatter.js';

/**
 * Find a SKILL.md file (case-insensitive) directly inside a directory.
 * @returns {Promise<string|null>} absolute path, or null if not found.
 */
export async function findSkillMdPath(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir);
  } catch {
    return null;
  }
  const match = entries.find((entry) => entry.toLowerCase() === 'skill.md');
  return match ? path.join(dir, match) : null;
}

/**
 * Read and parse a skill directory's SKILL.md frontmatter.
 * @returns {Promise<{name: string, description: string, path: string}|null>}
 */
export async function readSkillMeta(dir) {
  const skillMdPath = await findSkillMdPath(dir);
  if (!skillMdPath) return null;

  const content = await fs.readFile(skillMdPath, 'utf8');
  const { data } = parseFrontmatter(content);

  return {
    name: data.name || path.basename(dir),
    description: data.description || '',
    path: skillMdPath,
  };
}
