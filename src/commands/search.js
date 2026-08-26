import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Resolved relative to this file's install location (works whether
// skillport is run from the repo or installed globally via npm) — never cwd.
export const REGISTRY_PATH = path.join(__dirname, '..', '..', 'registry', 'skills.json');

/**
 * Case-insensitive substring match of a query against a registry entry's
 * name, description, and tags.
 * @param {{ name?: string, description?: string, tags?: string[] }} entry
 * @param {string} query
 */
export function matchesQuery(entry, query) {
  const q = String(query).toLowerCase();
  const haystacks = [entry.name, entry.description, ...(Array.isArray(entry.tags) ? entry.tags : [])]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());
  return haystacks.some((h) => h.includes(q));
}

export function truncate(str, max = 60) {
  if (!str) return '';
  return str.length > max ? `${str.slice(0, max - 1)}…` : str;
}

/**
 * `skillport search <query>` — search the bundled registry/skills.json.
 */
export async function search(query, { registryPath = REGISTRY_PATH } = {}) {
  if (!query) throw new Error('Usage: skillport search <query>');

  let registry;
  try {
    const raw = await fs.readFile(registryPath, 'utf8');
    registry = JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Registry not found at ${registryPath}`);
    }
    throw new Error(`Failed to read registry: ${err.message}`);
  }

  if (!Array.isArray(registry)) {
    throw new Error(`Registry at ${registryPath} is malformed (expected an array).`);
  }

  const matches = registry.filter((entry) => matchesQuery(entry, query));

  if (matches.length === 0) {
    console.log(`No skills found matching "${query}".`);
    console.log(`Don't see what you're looking for? Open a PR adding it to registry/skills.json.`);
    return matches;
  }

  console.log(`Found ${matches.length} skill(s) matching "${query}":\n`);
  for (const entry of matches) {
    const name = String(entry.name ?? '').padEnd(24);
    const description = truncate(entry.description, 60).padEnd(62);
    console.log(`  ${name} ${description} ${entry.source ?? ''}`);
  }
  return matches;
}
