import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';

import { STORE_DIR } from '../lib/paths.js';

const execFileAsync = promisify(execFile);

async function isGitRepo(dir) {
  try {
    await execFileAsync('git', ['rev-parse', '--git-dir'], { cwd: dir });
    return true;
  } catch {
    return false;
  }
}

async function currentBranch(dir) {
  const { stdout } = await execFileAsync('git', ['branch', '--show-current'], { cwd: dir });
  return stdout.trim();
}

async function hasUpstream(dir) {
  try {
    await execFileAsync('git', ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], { cwd: dir });
    return true;
  } catch {
    return false;
  }
}

/**
 * `skillport store init [--remote <git-url>]`
 *
 * Turns the global store (~/.skillport/store) into a git repo so it can be
 * pushed to a remote and cloned onto other machines — a global "skillport
 * install" only ever affects the machine it ran on; `store` is what makes
 * a personal skill library follow you across machines, not just projects.
 */
export async function storeInit({ remote } = {}) {
  await fs.mkdir(STORE_DIR, { recursive: true });

  if (await isGitRepo(STORE_DIR)) {
    console.log(`Already a git repo: ${STORE_DIR}`);
  } else {
    await execFileAsync('git', ['init'], { cwd: STORE_DIR });
    console.log(`Initialized git repo in ${STORE_DIR}`);
  }

  if (remote) {
    try {
      await execFileAsync('git', ['remote', 'add', 'origin', remote], { cwd: STORE_DIR });
      console.log(`Added remote "origin" -> ${remote}`);
    } catch {
      await execFileAsync('git', ['remote', 'set-url', 'origin', remote], { cwd: STORE_DIR });
      console.log(`Updated remote "origin" -> ${remote}`);
    }
  }

  console.log('Run `skillport store push` to commit and push your current skills.');
}

/**
 * `skillport store push [-m <message>]`
 *
 * Commits any changes in the store and pushes to origin. Safe to run
 * repeatedly — a no-op (with a friendly message) if there's nothing new.
 */
export async function storePush({ message = 'sync skills' } = {}) {
  if (!(await isGitRepo(STORE_DIR))) {
    throw new Error('Store is not a git repo yet — run `skillport store init` first.');
  }

  await execFileAsync('git', ['add', '-A'], { cwd: STORE_DIR });

  let hasChanges = true;
  try {
    await execFileAsync('git', ['diff', '--cached', '--quiet'], { cwd: STORE_DIR });
    hasChanges = false;
  } catch {
    // non-zero exit means there IS a staged diff — expected, not an error
  }

  if (hasChanges) {
    await execFileAsync('git', ['commit', '-m', message], { cwd: STORE_DIR });
    console.log(`Committed: ${message}`);
  } else {
    console.log('Nothing to commit.');
  }

  const branch = await currentBranch(STORE_DIR);
  if (!branch) {
    throw new Error('Store has no commits yet — nothing to push.');
  }

  const args = (await hasUpstream(STORE_DIR)) ? ['push'] : ['push', '-u', 'origin', branch];
  try {
    await execFileAsync('git', args, { cwd: STORE_DIR });
    console.log('Pushed.');
  } catch (err) {
    const stderr = String(err.stderr || err.message || err);
    if (/\[rejected\]|fetch first|non-fast-forward/.test(stderr)) {
      throw new Error(
        'git push failed: the remote has changes you don\'t have locally (someone else pushed first) — run `skillport store pull`, then push again.'
      );
    }
    const firstLine = stderr.split('\n')[0];
    throw new Error(`git push failed: ${firstLine} — did you set a remote with \`skillport store init --remote <url>\`?`);
  }
}

/**
 * `skillport store pull`
 *
 * Pulls the latest skills from the remote into the local store. Any
 * project that used `skillport link` against a skill sees the update
 * immediately (it's a symlink) — no per-project re-sync needed.
 */
export async function storePull() {
  if (!(await isGitRepo(STORE_DIR))) {
    throw new Error('Store is not a git repo yet — run `skillport store init` first.');
  }
  try {
    const { stdout } = await execFileAsync('git', ['pull'], { cwd: STORE_DIR });
    console.log(stdout.trim() || 'Pulled.');
  } catch (err) {
    const firstLine = String(err.message || err).split('\n')[0];
    throw new Error(`git pull failed: ${firstLine}`);
  }
}

/**
 * `skillport store clone <git-url>`
 *
 * For a fresh machine: clones a previously-pushed store directly into
 * ~/.skillport/store. Refuses to run if the store already has content,
 * to avoid clobbering skills that were never pushed anywhere.
 */
export async function storeClone(remote) {
  if (!remote) {
    throw new Error('Usage: skillport store clone <git-url>');
  }

  let existingEntries = [];
  try {
    existingEntries = await fs.readdir(STORE_DIR);
  } catch {
    // doesn't exist yet — fine, that's the expected case
  }

  if (existingEntries.length > 0) {
    throw new Error(
      `${STORE_DIR} already has content — refusing to clone over it.\n` +
      'If you meant to pull updates into an existing store, use `skillport store pull` instead.'
    );
  }

  await fs.rm(STORE_DIR, { recursive: true, force: true });
  try {
    await execFileAsync('git', ['clone', remote, STORE_DIR]);
  } catch (err) {
    const firstLine = String(err.message || err).split('\n')[0];
    throw new Error(`git clone failed for "${remote}": ${firstLine}`);
  }
  console.log(`Cloned ${remote} -> ${STORE_DIR}`);
  console.log('Run `skillport link <name> --to <project>` to link a skill into a project on this machine.');
}
