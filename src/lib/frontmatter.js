// Minimal hand-rolled YAML-frontmatter parser.
//
// Agent Skill SKILL.md files use a very small subset of YAML: a block of
// `key: value` pairs between two `---` lines. We only need to read simple
// scalar values (name, description), so a full YAML parser is unnecessary
// and would cost us a dependency.

/**
 * Parse the leading `---\n...\n---` frontmatter block from a string.
 *
 * @param {string} content - Full file contents.
 * @returns {{ data: Record<string, string>, body: string }}
 */
export function parseFrontmatter(content) {
  if (typeof content !== 'string') {
    return { data: {}, body: '' };
  }

  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return { data: {}, body: content };
  }

  const [, frontmatterBlock, body] = match;
  const data = {};

  for (const rawLine of frontmatterBlock.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key) data[key] = value;
  }

  return { data, body };
}
