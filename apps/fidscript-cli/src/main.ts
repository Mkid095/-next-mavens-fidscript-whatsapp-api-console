#!/usr/bin/env node
/**
 * main.ts - CLI entry point
 * Handles global flags (--api-key, --json, --yaml, --verbose, --no-color)
 * and delegates to the commander-based CLI tree.
 *
 * IMPORTANT: the shebang on line 1 is required for `npm install -g` to
 * create a working `fidscript` symlink. tsc preserves shebangs, so this
 * stays intact in the built dist/main.js.
 */
import { cli } from './cli.js';

cli.parseAsync(process.argv).catch((err) => {
  console.error(`fidscript: ${err.message}`);
  process.exit(1);
});
