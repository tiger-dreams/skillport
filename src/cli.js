#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { init } from './commands/init.js';
import { install } from './commands/install.js';
import { list } from './commands/list.js';
import { remove } from './commands/remove.js';
import { search } from './commands/search.js';
import { link } from './commands/link.js';
import { parseArgs } from './lib/args.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const HELP = `skillport — a package manager for AI agent skills

Usage:
  skillport init
  skillport install <source> [--target <dir>] [--global-only]
  skillport list [--global]
  skillport remove <name>
  skillport search <query>
  skillport link <name> --to <path>

Commands:
  init                     Set up .claude/skills/ and .skillport.json in the current project
  install <source>         Install a skill from "owner/repo", "owner/repo/path", or a git URL
  list                     List skills installed in this project (or --global for the global store)
  remove <name>            Remove an installed skill from this project
  search <query>           Search the bundled skill registry
  link <name> --to <dir>   Symlink an installed skill into another project

Options:
  -h, --help               Show this help
  --version                Show the installed skillport version
  --target <dir>           Override the install/list/remove target directory
  --global-only            (install) Fetch to the global store without installing into this project
  --global                 (list) Show the global cache at ~/.skillport/store instead of this project
  --to <path>              (link) Destination project directory

Examples:
  skillport install anthropics/skills/pdf
  skillport install owner/repo --target .agents/skills
  skillport search pdf
  skillport link pdf --to ../other-project
`;

async function getVersion() {
  const pkgPath = path.join(__dirname, '..', 'package.json');
  const raw = await fs.readFile(pkgPath, 'utf8');
  return JSON.parse(raw).version;
}

async function main() {
  const argv = process.argv.slice(2);
  const [command, ...rest] = argv;

  if (!command || command === '-h' || command === '--help') {
    console.log(HELP);
    return;
  }

  if (command === '--version' || command === '-v') {
    console.log(await getVersion());
    return;
  }

  const { positional, flags } = parseArgs(rest, {
    boolean: ['global-only', 'global', 'help'],
    string: ['target', 'to'],
  });

  if (flags.help) {
    console.log(HELP);
    return;
  }

  switch (command) {
    case 'init': {
      await init();
      break;
    }
    case 'install': {
      const [source] = positional;
      if (!source) {
        throw new Error('Usage: skillport install <source> [--target <dir>] [--global-only]');
      }
      await install(source, {
        target: typeof flags.target === 'string' ? flags.target : undefined,
        globalOnly: Boolean(flags['global-only']),
      });
      break;
    }
    case 'list': {
      await list({ global: Boolean(flags.global) });
      break;
    }
    case 'remove': {
      const [name] = positional;
      if (!name) throw new Error('Usage: skillport remove <name>');
      await remove(name);
      break;
    }
    case 'search': {
      const query = positional.join(' ');
      if (!query) throw new Error('Usage: skillport search <query>');
      await search(query);
      break;
    }
    case 'link': {
      const [name] = positional;
      if (!name) throw new Error('Usage: skillport link <name> --to <path>');
      if (typeof flags.to !== 'string' || !flags.to) {
        throw new Error('Usage: skillport link <name> --to <path>');
      }
      await link(name, { to: flags.to });
      break;
    }
    default: {
      console.error(`Error: unknown command "${command}"\n`);
      console.log(HELP);
      process.exitCode = 1;
      return;
    }
  }
}

main().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
