import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { computeSafeName, parseSource } from '../lib/source.js';
import { findSkillMdPath, readSkillMeta } from '../lib/skillmeta.js';
import { readProjectConfig, resolveTarget, storeDirFor } from '../lib/paths.js';
import { init } from './init.js';

const execFileAsync = promisify(execFile);

/**
 * Copy a directory tree, replacing the destination entirely.
 * @param {string} src
 * @param {string} dest
 * @param {{ exclude?: string[] }} [opts] - basenames to skip anywhere in the tree (e.g. ".git").
 */
async function copyDir(src, dest, { exclude = [] } = {}) {
  await fs.rm(dest, { recursive: true, force: true });
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.cp(src, dest, {
    recursive: true,
    filter: (source) => !exclude.includes(path.basename(source)),
  });
}

/**
 * `skillport install <source> [--target <dir>] [--global-only]`
 *
 * Clones the source into a temp dir, validates it contains a SKILL.md,
 * caches it in the global store, then (unless --global-only) copies it
 * into the current project's target directory.
 */
export async function install(
  sourceString,
  { target, globalOnly = false, cwd = process.cwd() } = {}
) {
  const parsed = parseSource(sourceString);

  let tmpDir;
  try {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'skillport-'));
  } catch (err) {
    throw new Error(`Could not create a temp directory: ${err.message}`);
  }

  try {
    try {
      await execFileAsync('git', ['clone', '--depth', '1', parsed.url, tmpDir]);
    } catch (err) {
      const firstLine = String(err.message || err).split('\n')[0];
      throw new Error(`git clone failed for "${parsed.url}": ${firstLine}`);
    }

    const sourceDir = parsed.subpath ? path.join(tmpDir, parsed.subpath) : tmpDir;
    try {
      const stat = await fs.stat(sourceDir);
      if (!stat.isDirectory()) throw new Error('not a directory');
    } catch {
      throw new Error(`Subpath "${parsed.subpath}" was not found in ${parsed.url}`);
    }

    const skillMdPath = await findSkillMdPath(sourceDir);
    if (!skillMdPath) {
      throw new Error('no SKILL.md found — is this a valid agent skill?');
    }

    const meta = await readSkillMeta(sourceDir);
    const safeInstallName = path.basename(meta.name || '');
    if (!safeInstallName || safeInstallName === '.' || safeInstallName === '..') {
      throw new Error(`Invalid skill name "${meta.name}" in SKILL.md frontmatter.`);
    }

    const safeName = computeSafeName({
      owner: parsed.owner,
      repo: parsed.repo,
      subpath: parsed.subpath,
      name: meta.name,
    });

    const storeDir = storeDirFor(safeName);
    await copyDir(sourceDir, storeDir, { exclude: ['.git'] });
    console.log(`Fetched "${meta.name}" -> ${storeDir}`);

    if (globalOnly) {
      console.log('(--global-only) skipped project install.');
      return { safeName, storeDir, installedTo: null, meta };
    }

    const existingConfig = await readProjectConfig(cwd);
    if (!existingConfig) {
      await init({ cwd });
    }

    const targetDir = await resolveTarget(cwd, target);
    const installPath = path.join(targetDir, safeInstallName);

    if (path.relative(targetDir, installPath).startsWith('..')) {
      throw new Error(`Invalid skill name "${meta.name}" in SKILL.md frontmatter.`);
    }

    let alreadyInstalled = false;
    try {
      await fs.access(installPath);
      alreadyInstalled = true;
    } catch {
      // not installed yet — fine
    }

    await copyDir(storeDir, installPath);

    if (alreadyInstalled) {
      console.warn(`Warning: overwrote existing skill at ${path.relative(cwd, installPath)}`);
    }

    console.log(`Installed "${meta.name}" — ${meta.description || 'no description'}`);
    console.log(`  -> ${path.relative(cwd, installPath) || installPath}`);

    return { safeName, storeDir, installedTo: installPath, meta };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  }
}
