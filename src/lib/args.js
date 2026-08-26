/**
 * A tiny, dependency-free argv parser.
 *
 * Supports `--flag`, `--flag value`, `--flag=value`, and collects everything
 * else as positional arguments. `boolean` flags never consume the next
 * token as a value; `string` flags always do (unless given via `=`).
 *
 * @param {string[]} argv
 * @param {{ boolean?: string[], string?: string[] }} [spec]
 * @returns {{ positional: string[], flags: Record<string, string|boolean> }}
 */
export function parseArgs(argv, { boolean: booleanFlags = [], string: stringFlags = [] } = {}) {
  const positional = [];
  const flags = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg.startsWith('--')) {
      let key = arg.slice(2);
      let value;

      const eqIndex = key.indexOf('=');
      if (eqIndex !== -1) {
        value = key.slice(eqIndex + 1);
        key = key.slice(0, eqIndex);
      }

      if (booleanFlags.includes(key) && value === undefined) {
        flags[key] = true;
      } else if (stringFlags.includes(key)) {
        if (value === undefined) {
          value = argv[i + 1];
          i++;
        }
        flags[key] = value;
      } else {
        flags[key] = value === undefined ? true : value;
      }
      continue;
    }

    if (arg.startsWith('-') && arg.length > 1) {
      flags[arg.slice(1)] = true;
      continue;
    }

    positional.push(arg);
  }

  return { positional, flags };
}
