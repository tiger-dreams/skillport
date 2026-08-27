import fs from 'node:fs/promises';
import path from 'node:path';

const META_FILENAME = '.skillport-meta.json';

export function storeMetaPath(storeDir) {
  return path.join(storeDir, META_FILENAME);
}

// Never copy this into a project — it's store-internal bookkeeping, not
// part of the skill itself.
export const STORE_META_EXCLUDE = META_FILENAME;

/**
 * Record what source string a store entry came from, so `skillport update`
 * knows what to re-fetch without the caller having to remember/retype it.
 */
export async function writeStoreMeta(storeDir, { source }) {
  await fs.writeFile(
    storeMetaPath(storeDir),
    `${JSON.stringify({ source, updatedAt: new Date().toISOString() }, null, 2)}\n`,
    'utf8'
  );
}

/**
 * @returns {Promise<{source: string, updatedAt: string}|null>} null if this
 * store entry predates source-tracking, or the file is unreadable/corrupt.
 */
export async function readStoreMeta(storeDir) {
  try {
    const raw = await fs.readFile(storeMetaPath(storeDir), 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
