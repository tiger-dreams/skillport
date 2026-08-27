import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';

import { readSkillMeta } from './skillmeta.js';

export const HOME_DIR = os.homedir();
export const STORE_DIR = path.join(HOME_DIR, '.skillport', 'store');
export const CONFIG_FILENAME = '.skillport.json';
export const DEFAULT_TARGET = '.claude/skills';

export function projectConfigPath(cwd = process.cwd()) {
  return path.join(cwd, CONFIG_FILENAME);
}

/**
 * Read `.skillport.json` from a project directory.
 * @returns {Promise<object|null>} null if the project isn't initialized.
 */
export async function readProjectConfig(cwd = process.cwd()) {
  try {
    const raw = await fs.readFile(projectConfigPath(cwd), 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw new Error(`Failed to read ${CONFIG_FILENAME}: ${err.message}`);
  }
}

export async function writeProjectConfig(cwd, config) {
  await fs.writeFile(projectConfigPath(cwd), `${JSON.stringify(config, null, 2)}\n`, 'utf8');
}

/**
 * Resolve the effective install/list/remove/link target directory for a
 * project: explicit --target override > .skillport.json's `target` > default.
 */
export async function resolveTarget(cwd = process.cwd(), overrideTarget) {
  if (overrideTarget) return path.resolve(cwd, overrideTarget);
  const config = await readProjectConfig(cwd);
  const target = config?.target || DEFAULT_TARGET;
  return path.resolve(cwd, target);
}

export function storeDirFor(safeName) {
  return path.join(STORE_DIR, safeName);
}

/**
 * Find a skill in the global store by its plain SKILL.md `name` (not the
 * composite `owner-repo-name` directory name install() uses to avoid
 * collisions). Returns the store subdirectory's absolute path, or null.
 */
export async function findInStore(name) {
  let entries;
  try {
    entries = await fs.readdir(STORE_DIR, { withFileTypes: true });
  } catch {
    return null;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(STORE_DIR, entry.name);
    const meta = await readSkillMeta(dir);
    if (meta && meta.name === name) return dir;
  }
  return null;
}
