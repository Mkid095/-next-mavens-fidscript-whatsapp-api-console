/**
 * instance/watch.ts - live SSE stream of connection state + inbound messages.
 *
 * Subscribes to GET /api/sse/instance/:name?token=<jwt> until the instance
 * reaches a stable state (open/connected/closed) or the user interrupts
 * (Ctrl+C / SIGINT).
 */
import pc from 'picocolors';
import { ApiClient } from '../../lib/api-client.js';
import { outputCliError } from '../../lib/api-client.js';
import { openSse } from '../../lib/sse.js';

interface StateChange {
  name: string;
  state: string;
  phoneNumber: string | null;
}

interface NewMessage {
  name: string;
  id: string;
  from_number: string;
  from_name: string;
  message_type: string;
  content: string;
  media_url: string | null;
  timestamp: string;
}

interface Presence {
  name: string;
  chatId: string;
  presence: string;
  fromName: string | null;
}

function formatState(state: string): (s: string) => string {
  switch (state?.toLowerCase()) {
    case 'open':
      return (s) => pc.green(s);
    case 'connecting':
    case 'pending':
      return (s) => pc.yellow(s);
    case 'close':
    case 'closed':
    case 'disconnected':
      return (s) => pc.red(s);
    default:
      return (s) => pc.dim(s);
  }
}

const TERMINAL_STATES = new Set(['open', 'connected', 'close', 'closed']);

export async function watchInstance(name: string, opts: { timeout?: number } = {}): Promise<void> {
  const client = new ApiClient();
  if (!client.hasJwt) {
    outputCliError('NOT_SIGNED_IN', 'Not signed in. Run `fidscript login` first.');
    process.exit(1);
  }

  const stored = (await import('../../lib/credentials.js')).loadCredentials();
  if (!stored?.jwt) {
    outputCliError('NOT_SIGNED_IN', 'JWT not found in credentials. Run `fidscript login`.');
    process.exit(1);
  }

  const url = `${client.configuredBaseUrl}/api/sse/instance/${encodeURIComponent(name)}?token=${encodeURIComponent(stored.jwt)}`;

  console.error(pc.dim(`Subscribing to live state for '${name}'…`));
  if (opts.timeout) console.error(pc.dim(`(timeout ${opts.timeout}s - Ctrl+C to stop earlier)\n`));
  else console.error(pc.dim('(Press Ctrl+C to stop)\n'));

  let aborted = false;
  let reachedTerminal = false;
  const abort = (): void => {
    aborted = true;
  };

  process.on('SIGINT', abort);
  process.on('SIGTERM', abort);

  const sse = await openSse({
    url,
    onOpen: () => {
      console.error(pc.dim('✓ connected - streaming events'));
    },
    onError: (err) => {
      console.error(pc.red('sse error:') + ' ' + err.message);
      sse.abort();
      process.exit(1);
    },
    onEvent: (eventName, payload) => {
      if (eventName === 'stateChange') {
        const d = payload as StateChange;
        const c = formatState(d.state ?? '');
        console.error(`  ${pc.cyan('state')} ${c(d.state ?? 'unknown')} ${d.phoneNumber ? `(${d.phoneNumber})` : ''}`);

        if (TERMINAL_STATES.has((d.state ?? '').toLowerCase())) {
          reachedTerminal = true;
          console.error(pc.dim(`\nReached terminal state '${d.state}'. Exiting watch.`));
          sse.abort();
        }
      } else if (eventName === 'newMessage') {
        const m = payload as NewMessage;
        const preview = (m.content ?? '').slice(0, 80);
        console.error(`  ${pc.green('msg')} ${m.from_name || m.from_number} ${pc.dim('→')} ${preview}`);
      } else if (eventName === 'presence') {
        const p = payload as Presence;
        if (p.presence === 'composing' && p.fromName) {
          console.error(`  ${pc.yellow('typing')} ${p.fromName}`);
        }
      }
    },
  });

  // Poll aborted flag + optional timeout every 200ms (since SSE uses an async loop)
  const startedAt = Date.now();
  const waiter = setInterval(() => {
    if (aborted) {
      sse.abort();
      clearInterval(waiter);
      return;
    }
    if (opts.timeout && (Date.now() - startedAt) >= opts.timeout * 1000) {
      console.error(pc.dim(`\nTimeout (${opts.timeout}s) reached. Exiting watch.`));
      sse.abort();
      clearInterval(waiter);
    }
  }, 200);

  await sse.promise;
  clearInterval(waiter);
  process.off('SIGINT', abort);
  process.off('SIGTERM', abort);

  // Headless-friendly exit codes:
  //   0  = reached a terminal state (open/close) or Ctrl+C
  //   2  = timeout fired without reaching a terminal state
  if (!reachedTerminal && opts.timeout) process.exit(2);
}