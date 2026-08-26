import fs from 'node:fs/promises';
import path from 'node:path';

import { STORE_DIR, resolveTarget } from '../lib/paths.js';
import { readSkillMeta } from '../lib/skillmeta.js';

async function listSkillsIn(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }

  const results = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const meta = await readSkillMeta(path.join(dir, entry.name));
    if (meta) {
      results.push({ dirName: entry.name, name: meta.name, description: meta.description });
    }
  }
  return results;
}

/**
 * `skillport list [--global]`
 */
export async function list({ global = false, target, cwd = process.cwd() } = {}) {
  const dir = global ? STORE_DIR : await resolveTarget(cwd, target);
  const skills = await listSkillsIn(dir);

  if (skills.length === 0) {
    console.log(
      global
        ? 'No skills cached globally yet — try `skillport install <source>`.'
        : 'No skills installed yet — try `skillport search <term>`.'
    );
    return skills;
  }

  console.log(global ? `Global store (${dir}):` : `Installed skills (${dir}):`);
  for (const skill of skills) {
    console.log(`  ${skill.name} — ${skill.description || 'no description'}`);
  }
  return skills;
}
