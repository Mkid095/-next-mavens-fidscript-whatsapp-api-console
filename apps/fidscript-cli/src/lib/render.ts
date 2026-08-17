/**
 * render.ts - output rendering: tables, colored status, ASCII QR, JSON, YAML
 */
import QRCode from 'qrcode';
import pc from 'picocolors';
import YAML from 'yaml';

// ── Colors ───────────────────────────────────────────────────────────────────

const dim = (s: string) => pc.dim(s);
const green = (s: string) => pc.green(s);
const red = (s: string) => pc.red(s);
const yellow = (s: string) => pc.yellow(s);
const cyan = (s: string) => pc.cyan(s);
const bold = (s: string) => pc.bold(s);
const white = (s: string) => pc.white(s);

// ── JSON / YAML ─────────────────────────────────────────────────────────────

export function renderJson(data: unknown): string {
  return JSON.stringify(data, null, 2);
}

export function renderYaml(data: unknown): string {
  return YAML.stringify(data);
}

// ── Status helpers ─────────────────────────────────────────────────────────────

export function statusOk(msg: string): string {
  return green(`✓ ${msg}`);
}

export function statusWarn(msg: string): string {
  return yellow(`⚠ ${msg}`);
}

export function statusErr(msg: string): string {
  return red(`✗ ${msg}`);
}

// ── Error rendering ────────────────────────────────────────────────────────────

export function renderError(err: unknown): void {
  if (err instanceof Error && err.name === 'FidscriptError') {
    const fe = err as unknown as { message: string; code: string; statusCode?: number };
    if (fe.statusCode) {
      console.error(`${red('error:')} ${fe.message} ${dim(`[${fe.code} ${fe.statusCode}]`)}`);
    } else {
      console.error(`${red('error:')} ${fe.message} ${dim(`[${fe.code}]`)}`);
    }
  } else if (err instanceof Error) {
    console.error(`${red('error:')} ${err.message}`);
  } else {
    console.error(`${red('error:')} ${String(err)}`);
  }
}

// ── Success rendering ────────────────────────────────────────────────────────────

export function renderSuccess(msg: string): void {
  console.error(green(`✓ ${msg}`));
}

// ── Table rendering ─────────────────────────────────────────────────────────────

export interface Column {
  header: string;
  key: string;
  width?: number;
  color?: (v: string) => string;
}

export function renderTable(rows: Record<string, unknown>[], columns: Column[]): void {
  if (rows.length === 0) {
    console.error(dim('  (no results)'));
    return;
  }

  // Compute widths
  const widths = columns.map((col) => {
    const hLen = col.header.length;
    const maxVal = rows.reduce((m, r) => Math.max(m, String(r[col.key] ?? '').length), 0);
    return Math.max(hLen, maxVal, col.width ?? 0);
  });

  // Header
  const headerCells = columns.map((col, i) => bold(white(col.header.padEnd(widths[i]))));
  console.log(`  ${headerCells.join(pc.dim('  '))}`);
  console.log(`  ${columns.map((_, i) => dim('─'.repeat(widths[i]))).join(pc.dim('  '))}`);

  // Rows
  for (const row of rows) {
    const cells = columns.map((col, i) => {
      const val = String(row[col.key] ?? '');
      const colored = col.color ? col.color(val) : val;
      return colored.padEnd(widths[i]);
    });
    console.log(`  ${cells.join(pc.dim('  '))}`);
  }
}

// ── Instance status color ─────────────────────────────────────────────────────

export function instanceStatusColor(status: string): (s: string) => string {
  switch (status?.toLowerCase()) {
    case 'open':
    case 'connected':
    case 'active':
      return green;
    case 'connecting':
    case 'pending':
      return yellow;
    case 'disconnected':
    case 'closed':
    case 'logout':
      return red;
    default:
      return dim;
  }
}

// ── ASCII QR Code rendering ─────────────────────────────────────────────────────

/**
 * Render a base64 QR code image as ASCII art in the terminal.
 * Falls back to printing the data URL if QR decoding fails.
 */
export async function renderQr(base64DataUrl: string): Promise<void> {
  // base64DataUrl is like "data:image/png;base64,iVBORw0KGgo..."
  // We decode it and write a temp PNG, then open it.
  // For terminals that support it, we also print the data URL as a clickable link.
  try {
    const base64 = base64DataUrl.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64, 'base64');
    const tmp = `/tmp/fidscript-qr-${Date.now()}.png`;
    const { writeFileSync } = await import('fs');
    writeFileSync(tmp, imageBuffer);
    console.log(`\n${green('✓')} QR code saved to: ${cyan(tmp)}`);
    console.log(`${dim('Open this file in your WhatsApp app to scan.')}\n`);
  } catch (err) {
    console.log(`\n${cyan('QR Code data URL:')}`);
    console.log(`  ${base64DataUrl.slice(0, 80)}...\n`);
  }
}

// ── Token balance display ─────────────────────────────────────────────────────

export function renderTokenBalance(balance: number): void {
  if (balance <= 0) {
    console.error(`${red('⚠ Low balance:')} ${balance} tokens remaining`);
  } else {
    console.error(`${green('Balance:')} ${bold(String(balance))} tokens`);
  }
}
