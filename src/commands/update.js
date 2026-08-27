import fs from 'node:fs/promises';
import path from 'node:path';

import { STORE_DIR, findInStore } from '../lib/paths.js';
import { readStoreMeta } from '../lib/storemeta.js';
import { install } from './install.js';

/**
 * Re-fetch a single skill from the source it was originally installed
 * from, refreshing both the global store and — if it's installed there —
 * the current project's copy. Returns null (with a printed message,
 * not a thrown error) for a skill with no tracked source, e.g. one
 * installed by a skillport version before source-tracking existed.
 */
async function updateByName(name, { cwd, target } = {}) {
  const storeDir = await findInStore(name);
  if (!storeDir) {
    console.warn(`Skipping "${name}": not found in the global store.`);
    return null;
  }

  const meta = await readStoreMeta(storeDir);
  if (!meta?.source) {
    console.warn(`Skipping "${name}": no recorded source to update from (installed by an older skillport?).`);
    return null;
  }

  console.log(`Updating "${name}" from ${meta.source} ...`);
  return install(meta.source, { cwd, target });
}

/**
 * `skillport update [name]`
 *
 * With a name: update just that skill. With no name: update every skill
 * in the global store that has a tracked source.
 */
export async function update(name, { cwd = process.cwd(), target } = {}) {
  if (name) {
    return updateByName(name, { cwd, target });
  }

  let entries;
  try {
    entries = await fs.readdir(STORE_DIR, { withFileTypes: true });
  } catch {
    console.log('No skills cached globally yet — nothing to update.');
    return [];
  }

  const dirs = entries.filter((e) => e.isDirectory());
  if (dirs.length === 0) {
    console.log('No skills cached globally yet — nothing to update.');
    return [];
  }

  const results = [];
  for (const entry of dirs) {
    const meta = await readStoreMeta(path.join(STORE_DIR, entry.name));
    if (!meta?.source) {
      console.warn(`Skipping "${entry.name}": no recorded source (installed by an older skillport?).`);
      continue;
    }
    console.log(`Updating from ${meta.source} ...`);
    results.push(await install(meta.source, { cwd, target }));
  }
  return results;
}
