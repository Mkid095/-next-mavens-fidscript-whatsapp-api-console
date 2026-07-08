import type { TestResult, TestCollection } from '../types.js';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

export function formatStatus(status: TestResult['status']): string {
  switch (status) {
    case 'pass': return `${GREEN}✓${RESET}`;
    case 'fail': return `${RED}✗${RESET}`;
    case 'skip': return `${YELLOW}○${RESET}`;
  }
}

export function formatLatency(ms?: number): string {
  if (ms === undefined) return '';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatTable(rows: string[][], colWidths: number[]): string {
  return rows.map(row =>
    row.map((cell, i) => cell.padEnd(colWidths[i])).join('  ')
  ).join('\n');
}

export function printCollection(col: TestCollection): { passed: number; failed: number; total: number } {
  const nameWidth = Math.max(...col.tests.map(t => t.name.length));
  const statusWidth = 6;
  const latencyWidth = 8;
  const errorWidth = 50;

  const headers = [
    'Status'.padEnd(statusWidth),
    'Test'.padEnd(nameWidth),
    'Latency'.padEnd(latencyWidth),
    'Details'.padEnd(errorWidth),
  ];

  console.log(`\n${BOLD}${col.title}${RESET}`);
  console.log('─'.repeat(statusWidth + nameWidth + latencyWidth + errorWidth + 6));
  console.log(formatTable([headers], [statusWidth, nameWidth, latencyWidth, errorWidth]));

  let passed = 0;
  let failed = 0;

  for (const test of col.tests) {
    if (test.status === 'pass') passed++;
    else if (test.status === 'fail') failed++;

    const statusStr = formatStatus(test.status).padEnd(statusWidth);
    const nameStr = test.name.padEnd(nameWidth);
    const latencyStr = formatLatency(test.latency).padEnd(latencyWidth);
    const errorStr = (test.error ?? '').slice(0, errorWidth).padEnd(errorWidth);

    const row = [statusStr, nameStr, latencyStr, errorStr];
    console.log(formatTable([row], [statusWidth, nameWidth, latencyWidth, errorWidth]));
  }

  const total = col.tests.length;
  console.log('─'.repeat(statusWidth + nameWidth + latencyWidth + errorWidth + 6));
  console.log(
    `  ${GREEN}${passed}${RESET} passed  ` +
    `${RED}${failed}${RESET} failed  ` +
    `${DIM}${total - passed - failed}${RESET} skipped`
  );

  return { passed, failed, total: passed + failed };
}

export function printSummary(collections: TestCollection[]): void {
  let totalPassed = 0;
  let totalFailed = 0;
  let totalTests = 0;

  for (const col of collections) {
    const { passed, failed, total } = printCollection(col);
    totalPassed += passed;
    totalFailed += failed;
    totalTests += total;
  }

  const allPassed = totalFailed === 0;
  console.log('\n' + '═'.repeat(60));
  console.log(`${BOLD}Overall: ${allPassed ? GREEN + '✓ ALL PASSED' : RED + '✗ FAILURES DETECTED'}${RESET}`);
  console.log('═'.repeat(60));
  console.log(
    `  ${GREEN}${totalPassed}${RESET} / ${totalTests} tests passed`
  );
  if (totalFailed > 0) {
    console.log(`  ${RED}${totalFailed}${RESET} tests failed — fix before production`);
  }
}
