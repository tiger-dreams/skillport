import fs from 'node:fs/promises';
import path from 'node:path';

import { resolveTarget } from '../lib/paths.js';

/**
 * `skillport link <name> --to <path>`
 *
 * Symlinks `<current target>/<name>` into `<path>/.claude/skills/<name>` so
 * edits to the skill stay in sync across projects instead of being copied.
 */
export async function link(name, { to, target, cwd = process.cwd() } = {}) {
  if (!name) throw new Error('Usage: skillport link <name> --to <path>');
  if (!to) throw new Error('Usage: skillport link <name> --to <path>');

  const targetDir = await resolveTarget(cwd, target);
  const sourcePath = path.join(targetDir, name);

  try {
    await fs.access(sourcePath);
  } catch {
    throw new Error(
      `Skill "${name}" is not installed in this project (looked in ${path.relative(cwd, targetDir) || targetDir}). Run "skillport install" first.`
    );
  }

  const destBase = path.resolve(cwd, to);
  try {
    const stat = await fs.stat(destBase);
    if (!stat.isDirectory()) {
      throw new Error(`"${to}" is not a directory.`);
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Destination path "${to}" does not exist.`);
    }
    throw err;
  }

  const destSkillsDir = path.join(destBase, '.claude', 'skills');
  await fs.mkdir(destSkillsDir, { recursive: true });
  const destPath = path.join(destSkillsDir, name);

  await fs.rm(destPath, { recursive: true, force: true }).catch(() => {});
  await fs.symlink(sourcePath, destPath, 'dir');

  console.log(`Linked "${name}" -> ${destPath}`);
  return { source: sourcePath, dest: destPath };
}
