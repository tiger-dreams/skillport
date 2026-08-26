import fs from 'node:fs/promises';
import path from 'node:path';

import { resolveTarget } from '../lib/paths.js';

/**
 * `skillport remove <name>` — remove `<target>/<name>` from the current project.
 */
export async function remove(name, { target, cwd = process.cwd() } = {}) {
  if (!name) throw new Error('Usage: skillport remove <name>');

  const targetDir = await resolveTarget(cwd, target);
  const skillPath = path.join(targetDir, name);

  try {
    await fs.access(skillPath);
  } catch {
    throw new Error(`Skill "${name}" is not installed (looked in ${path.relative(cwd, targetDir) || targetDir}).`);
  }

  await fs.rm(skillPath, { recursive: true, force: true });
  console.log(`Removed "${name}".`);

  return { removed: skillPath };
}
