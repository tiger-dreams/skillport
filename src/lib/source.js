// Pure helpers for parsing an `skillport install <source>` argument and for
// deriving a filesystem-safe cache-key name from it. No I/O here on purpose
// so these are cheaply unit-testable.

const OWNER_REPO_SEGMENT = /^[\w.-]+$/;
// Any RFC 3986-style URI scheme (http, https, git, ssh, git+ssh, file, ...).
const FULL_URL_PATTERN = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//;
const SCP_LIKE_PATTERN = /^[\w.-]+@[\w.-]+:/;

/**
 * Best-effort extraction of {owner, repo} from an arbitrary git URL, used
 * only to build a friendlier global-store folder name. Never throws.
 *
 * @param {string} url
 * @returns {{ owner: string|null, repo: string|null }}
 */
export function extractOwnerRepoFromUrl(url) {
  let cleaned = url.replace(/\.git$/i, '');
  cleaned = cleaned.replace(/^[a-zA-Z][\w+.-]*:\/\//, ''); // strip scheme
  cleaned = cleaned.replace(/^[^@/]+@/, ''); // strip user@ (scp-like or ssh://)
  cleaned = cleaned.replace(':', '/'); // scp-like host:path -> host/path
  const parts = cleaned.split('/').filter(Boolean);

  if (parts.length >= 2) {
    return { owner: parts[parts.length - 2], repo: parts[parts.length - 1] };
  }
  return { owner: null, repo: parts[0] || null };
}

/**
 * Parse a `skillport install` source string into either a full git URL
 * reference or a validated GitHub `owner/repo[/subpath]` shorthand.
 *
 * Throws a clean Error for anything that doesn't parse cleanly rather than
 * silently building an unsafe/garbage URL.
 *
 * @param {string} source
 * @returns {{ type: 'url'|'github', url: string, owner: string|null, repo: string|null, subpath: string|null }}
 */
export function parseSource(source) {
  if (typeof source !== 'string' || source.trim() === '') {
    throw new Error(
      'A source is required (e.g. "owner/repo", "owner/repo/path/to/skill", or a git URL).'
    );
  }

  const trimmed = source.trim();

  if (FULL_URL_PATTERN.test(trimmed) || SCP_LIKE_PATTERN.test(trimmed)) {
    const { owner, repo } = extractOwnerRepoFromUrl(trimmed);
    return { type: 'url', url: trimmed, owner, repo, subpath: null };
  }

  const parts = trimmed.split('/').filter(Boolean);
  if (parts.length < 2) {
    throw new Error(
      `Invalid source "${source}". Expected "owner/repo", "owner/repo/path", or a full git URL.`
    );
  }

  const [owner, repo, ...rest] = parts;
  if (!OWNER_REPO_SEGMENT.test(owner) || !OWNER_REPO_SEGMENT.test(repo)) {
    throw new Error(
      `Invalid source "${source}". Owner and repo must match ${OWNER_REPO_SEGMENT}.`
    );
  }

  const subpath = rest.length > 0 ? rest.join('/') : null;
  if (subpath && !/^[\w.-][\w./-]*$/.test(subpath)) {
    throw new Error(`Invalid subpath in source "${source}".`);
  }
  if (subpath && subpath.split('/').includes('..')) {
    throw new Error(`Invalid subpath in source "${source}": path traversal is not allowed.`);
  }

  return {
    type: 'github',
    url: `https://github.com/${owner}/${repo}.git`,
    owner,
    repo,
    subpath,
  };
}

/**
 * Turn an arbitrary string into a safe single path segment:
 * lowercase, [a-z0-9-] only, no leading/trailing/duplicate dashes.
 *
 * @param {string} str
 * @returns {string}
 */
export function sanitizeName(str) {
  const cleaned = String(str ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || 'skill';
}

/**
 * Derive the `~/.skillport/store/<safe-name>` folder name for a fetched
 * skill, e.g. `owner-repo-skillname`.
 *
 * @param {{ owner?: string|null, repo?: string|null, subpath?: string|null, name?: string|null }} parts
 * @returns {string}
 */
export function computeSafeName({ owner, repo, subpath, name } = {}) {
  const subpathBase = subpath ? subpath.split('/').filter(Boolean).pop() : null;
  const base = name || subpathBase || repo || 'skill';
  const segments = [owner, repo, base].filter(Boolean);
  // Avoid redundant "repo-repo" style names when base falls back to repo itself.
  const deduped = segments.filter(
    (seg, i) => i === 0 || seg.toLowerCase() !== segments[i - 1].toLowerCase()
  );
  return sanitizeName(deduped.join('-'));
}
