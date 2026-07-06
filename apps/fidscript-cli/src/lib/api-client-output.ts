/**
 * api-client-output.ts — CLI output helpers (JSON/YAML/error formatting)
 * Extracted from outputHelpers.ts.
 */
import { FidscriptError } from './errors.js';
import { renderJson, renderYaml, renderSuccess } from './render.js';
import YAML from 'yaml';
import pc from 'picocolors';

export type OutputMode = 'default' | 'json' | 'yaml';

export const flags = {
  mode: 'default' as OutputMode,
  noColor: false,
  quiet: false,
};

export function setJsonMode(): void { flags.mode = 'json'; }
export function setYamlMode(): void { flags.mode = 'yaml'; }
export function setNoColor(): void { flags.noColor = true; }

export function outputJson(data: unknown): void {
  console.log(renderJson(data));
}

export function outputYaml(data: unknown): void {
  console.log(renderYaml(data));
}

function errToEnvelope(err: unknown): {
  success: false;
  error: { code: string; message: string; status_code?: number };
} {
  if (err instanceof FidscriptError) {
    return {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.statusCode ? { status_code: err.statusCode } : {}),
      },
    };
  }
  if (err instanceof Error) {
    return { success: false, error: { code: 'INTERNAL_ERROR', message: err.message } };
  }
  return { success: false, error: { code: 'INTERNAL_ERROR', message: String(err) } };
}

export function outputFidscriptError(err: unknown): void {
  const envelope = errToEnvelope(err);

  if (flags.mode === 'json') {
    console.log(JSON.stringify(envelope, null, 2));
    return;
  }
  if (flags.mode === 'yaml') {
    console.log(YAML.stringify(envelope));
    return;
  }
  if (flags.quiet) return;

  if (err instanceof FidscriptError) {
    const suffix = err.statusCode ? ` [${err.code} ${err.statusCode}]` : ` [${err.code}]`;
    console.error(`${pc.red('error:')} ${err.message}${pc.dim(suffix)}`);
  } else if (err instanceof Error) {
    console.error(`${pc.red('error:')} ${err.message}`);
  } else {
    console.error(`${pc.red('error:')} ${String(err)}`);
  }
}

export function outputCliError(code: string, message: string): void {
  outputFidscriptError(new FidscriptError(message, code));
}

export function outputMsg(msg: string): void {
  if (flags.quiet) return;
  if (flags.mode === 'json' || flags.mode === 'yaml') return;
  console.error(renderSuccess(msg));
}
