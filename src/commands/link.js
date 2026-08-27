import fs from 'node:fs/promises';
import path from 'node:path';

import { resolveTarget, findInStore } from '../lib/paths.js';

/**
 * `skillport link <name> --to <path>`
 *
 * Symlinks a skill into `<path>/.claude/skills/<name>` so edits stay in
 * sync instead of being copied. Sources from the current project's target
 * dir first (project-to-project linking); if the skill isn't installed
 * there, falls back to the global store — this is what makes a skill
 * usable right after `skillport store clone` on a new machine, without
 * needing to `install` (and re-fetch over the network) into a project
 * first just to link it onward.
 */
export async function link(name, { to, target, cwd = process.cwd() } = {}) {
  if (!name) throw new Error('Usage: skillport link <name> --to <path>');
  if (!to) throw new Error('Usage: skillport link <name> --to <path>');

  const targetDir = await resolveTarget(cwd, target);
  let sourcePath = path.join(targetDir, name);

  const inProject = await fs.access(sourcePath).then(() => true, () => false);
  if (!inProject) {
    const storeMatch = await findInStore(name);
    if (!storeMatch) {
      throw new Error(
        `Skill "${name}" is not installed in this project (looked in ${path.relative(cwd, targetDir) || targetDir}) and not found in the global store. Run "skillport install" first.`
      );
    }
    sourcePath = storeMatch;
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
