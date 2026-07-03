/**
 * main.ts — CLI entry point
 * Handles global flags (--api-key, --json, --yaml, --verbose, --no-color)
 * and delegates to the commander-based CLI tree.
 */
import { cli } from './cli.js';

cli.parseAsync(process.argv).catch((err) => {
  console.error(`fidscript: ${err.message}`);
  process.exit(1);
});
