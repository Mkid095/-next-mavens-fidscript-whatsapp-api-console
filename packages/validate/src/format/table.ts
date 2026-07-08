import type { TestResult, TestCollection, ValidationReport } from '../types.js';

const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const MAGENTA = '\x1b[35m';

function e(c: string) { return c + RESET; }

function sevColor(s?: string) {
  switch (s) {
    case 'critical': return RED;
    case 'high': return MAGENTA;
    case 'medium': return YELLOW;
    case 'low': return DIM;
    default: return YELLOW;
  }
}

function sevTag(s?: string): string {
  if (!s) return '';
  return e(`[${sevColor(s)}${s.toUpperCase()}${RESET}]`);
}

function sym(s: TestResult['status']) {
  switch (s) {
    case 'pass': return e(`${GREEN}✓${RESET}`);
    case 'fail': return e(`${RED}✗${RESET}`);
    case 'skip': return e(`${YELLOW}○${RESET}`);
  }
}

function lat(ms?: number): string {
  if (ms === undefined) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function clip(s: unknown, max = 90): string {
  const str = typeof s === 'string' ? s : JSON.stringify(s ?? '');
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

export function printCollection(col: TestCollection): {
  passed: number; failed: number; skipped: number;
} {
  const pass = col.tests.filter(t => t.status === 'pass');
  const fail = col.tests.filter(t => t.status === 'fail');
  const sk = col.tests.filter(t => t.status === 'skip');

  const denom = pass.length + fail.length;
  const colScore = denom > 0 ? Math.round((pass.length / denom) * 100) : 100;
  const sc = colScore === 100 ? GREEN : colScore >= 75 ? YELLOW : RED;

  console.log(`\n${BOLD}${col.title}${RESET}  ${e(`${sc}${colScore}%${RESET}`)}`);
  console.log('─'.repeat(64));

  for (const t of col.tests) {
    const s = sym(t.status);
    const tag = t.status === 'fail' ? sevTag(t.severity) : '';
    const l = e(`${DIM}${lat(t.latency)}${RESET}`);
    const err = t.error ? e(` ${RED}${clip(t.error, 60)}${RESET}`) : '';
    const detail = t.detail ? `\n    ${DIM}${clip(t.detail, 100)}${RESET}` : '';
    console.log(`  ${s}  ${t.name}${tag}  ${l}${err}${detail}`);
  }

  const total = pass.length + fail.length + sk.length;
  console.log(
    `  ${DIM}${total} tests: ${GREEN}${pass.length}${RESET} passed  ${RED}${fail.length}${RESET} failed  ${YELLOW}${sk.length}${RESET} skipped${RESET}`
  );

  return { passed: pass.length, failed: fail.length, skipped: sk.length };
}

export function printSummary(
  collections: TestCollection[],
  opts: { json?: boolean; gitSha?: string } = {},
): { score: number; failed: number; severity: Record<string, number> } {

  // Print per-collection details in text mode
  for (const col of collections) {
    printCollection(col);
  }

  const all = collections.flatMap(c => c.tests);
  const passed = all.filter(t => t.status === 'pass').length;
  const failed = all.filter(t => t.status === 'fail').length;
  const skipped = all.filter(t => t.status === 'skip').length;

  const denom = passed + failed;
  const score = denom > 0 ? Math.round((passed / denom) * 100) : 100;

  const severity: Record<string, number> = {};
  for (const t of all.filter(t => t.status === 'fail')) {
    const s = t.severity ?? 'high';
    severity[s] = (severity[s] ?? 0) + 1;
  }

  if (opts.json) {
    const report: ValidationReport = {
      score, passed, failed, skipped,
      collections,
      gitSha: opts.gitSha,
      timestamp: new Date().toISOString(),
      severity,
    };
    console.log(JSON.stringify(report, null, 2));
    return { score, failed, severity };
  }

  const sc = score === 100 ? GREEN : score >= 75 ? YELLOW : RED;
  console.log('\n' + '═'.repeat(64));
  console.log(`${BOLD}Overall Score${RESET}  ${e(`${sc}${score}%${RESET}`)}`);
  console.log('═'.repeat(64));
  console.log(`  ${GREEN}${passed}${RESET} / ${denom} tests passed`);

  if (failed > 0) {
    const crit = severity['critical'] ?? 0;
    const hi = severity['high'] ?? 0;
    const med = severity['medium'] ?? 0;
    const lo = severity['low'] ?? 0;
    console.log(`  ${RED}${failed}${RESET} failures: ${
      crit > 0 ? e(`${RED}${crit} critical${RESET}  `) : ''
    }${
      hi > 0 ? e(`${MAGENTA}${hi} high${RESET}  `) : ''
    }${
      med > 0 ? e(`${YELLOW}${med} medium${RESET}  `) : ''
    }${
      lo > 0 ? e(`${DIM}${lo} low${RESET}`) : ''
    }`.trim());
    console.log(`\n  ${DIM}Non-zero exit code — deployment gate failed${RESET}`);
  }

  return { score, failed, severity };
}
