/**
 * chatbot/publish.ts — kick off the publish pipeline + optional SSE watch.
 * Auth: JWT.
 *
 *   POST /api/platform/chatbots/:id/publish  { draft_json: '...' }
 *   GET  /api/sse/publish-jobs/:jobId?token=<jwt>   (with --watch)
 */
import pc from 'picocolors';
import {
  ApiClient,
  flags,
  outputJson,
  outputYaml,
  outputFidscriptError,
  outputCliError,
} from '../../lib/api-client.js';
import { openSse } from '../../lib/sse.js';

interface PublishResp {
  jobId: string;
  message: string;
}

interface JobUpdate {
  id: string;
  status: string;
  progress: number;
  current_step: string | null;
  message: string | null;
  error: string | null;
}

const TERMINAL_STATUSES = new Set(['completed', 'failed', 'cancelled']);

export async function publishChatbot(id: string, opts: { watch?: boolean; draft?: string; timeout?: number }): Promise<void> {
  const client = new ApiClient();
  if (!client.hasJwt) {
    outputCliError('NOT_SIGNED_IN', 'Not signed in. Run `fidscript login` first.');
    process.exit(1);
  }

  // Resolve draft_json: --draft flag, --draft @file, or empty (server will use stored config)
  let draftJson = opts.draft ?? '';
  if (draftJson.startsWith('@')) {
    const fs = await import('node:fs');
    draftJson = fs.readFileSync(draftJson.slice(1), 'utf-8');
  }

  let resp: PublishResp;
  try {
    resp = await client.jwtPostData<PublishResp>(
      `/api/platform/chatbots/${encodeURIComponent(id)}/publish`,
      draftJson ? { draft_json: draftJson } : {},
    );
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }

  if (flags.mode === 'json') {
    outputJson({ success: true, data: resp });
    return;
  }
  if (flags.mode === 'yaml') {
    outputYaml({ success: true, data: resp });
    return;
  }

  console.error(`✓ Publish job started. jobId=${resp.jobId}`);
  console.error(`  Watching progress: ${pc.dim(`GET /api/sse/publish-jobs/${resp.jobId}`)}`);

  if (!opts.watch) {
    console.error('  (use --watch to stream progress live)');
    return;
  }

  // Stream SSE
  const stored = (await import('../../lib/credentials.js')).loadCredentials();
  if (!stored?.jwt) {
    outputCliError('NOT_SIGNED_IN', 'No JWT for SSE auth.');
    process.exit(1);
  }

  const url = `${client.configuredBaseUrl}/api/sse/publish-jobs/${encodeURIComponent(resp.jobId)}?token=${encodeURIComponent(stored.jwt)}`;

  let aborted = false;
  process.on('SIGINT', () => { aborted = true; });

  const sse = await openSse({
    url,
    onError: (err) => {
      console.error(pc.red('sse error:') + ' ' + err.message);
      process.exit(1);
    },
    onEvent: (name, payload) => {
      if (name !== 'jobUpdate') return;
      const j = payload as JobUpdate;
      const bar = '█'.repeat(Math.floor((j.progress ?? 0) / 5)) + '░'.repeat(20 - Math.floor((j.progress ?? 0) / 5));
      const statusColor = j.status === 'completed' ? pc.green
        : j.status === 'failed' ? pc.red
        : pc.yellow;
      console.error(`  [${bar}] ${(j.progress ?? 0).toString().padStart(3)}%  ${statusColor(j.status)}  ${j.current_step ?? ''}  ${j.message ?? ''}`);

      if (TERMINAL_STATUSES.has((j.status ?? '').toLowerCase())) {
        reachedTerminal = true;
        sse.abort();
      }
    },
  });

  const startedAt = Date.now();
  let reachedTerminal = false;
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
  process.off('SIGINT', () => { aborted = true; });

  if (!reachedTerminal && opts.timeout) process.exit(2);
}