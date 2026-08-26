import fs from 'node:fs/promises';
import path from 'node:path';

import {
  CONFIG_FILENAME,
  DEFAULT_TARGET,
  readProjectConfig,
  writeProjectConfig,
} from '../lib/paths.js';

/**
 * `skillport init` — set up `.claude/skills/` and `.skillport.json` in cwd.
 * Idempotent: running it again just confirms the project is initialized.
 */
export async function init({ cwd = process.cwd() } = {}) {
  const existing = await readProjectConfig(cwd);

  const targetDir = path.resolve(cwd, existing?.target || DEFAULT_TARGET);
  await fs.mkdir(targetDir, { recursive: true });

  if (existing) {
    console.log(`Already initialized — ${CONFIG_FILENAME} exists (target: ${existing.target || DEFAULT_TARGET}).`);
    return { alreadyInitialized: true, target: existing.target || DEFAULT_TARGET };
  }

  await writeProjectConfig(cwd, { target: DEFAULT_TARGET });

  console.log('Initialized skillport project.');
  console.log(`  created ${DEFAULT_TARGET}/`);
  console.log(`  created ${CONFIG_FILENAME}`);

  return { alreadyInitialized: false, target: DEFAULT_TARGET };
}
