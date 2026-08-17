/**
 * version.ts - exposes the CLI version (synced from package.json).
 *
 * We use a `.json` import (ESM JSON modules) instead of `require('../package.json')`
 * which would fail in ESM. The build copies the value at build time via tsc - but
 * since `package.json` isn't in `src/`, we use createRequire at runtime to read
 * it from the package root. This works under `"type": "module"`.
 */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
export const CLI_VERSION: string = require('../package.json').version as string;