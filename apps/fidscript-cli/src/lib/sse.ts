/**
 * sse.ts - Server-Sent Events client for Node (no browser EventSource available).
 *
 * Parses an SSE-formatted stream manually:
 *   - "event: <name>\n"
 *   - "data: <json>\n"
 *   - blank line terminates an event
 *   - ": comment" lines are ignored (heartbeats)
 *
 * Calls `onEvent(name, payload)` for each event. Returns an AbortController
 * the caller can use to stop the stream.
 */
export interface SseClient {
  abort: () => void;
  promise: Promise<void>;
}

export interface SseOptions {
  url: string;
  headers?: Record<string, string>;
  onEvent: (name: string, data: unknown) => void;
  onError?: (err: Error) => void;
  onOpen?: () => void;
}

export async function openSse(opts: SseOptions): Promise<SseClient> {
  const controller = new AbortController();

  const promise = (async (): Promise<void> => {
    let res: Response;
    try {
      res = await fetch(opts.url, {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
          ...(opts.headers ?? {}),
        },
        signal: controller.signal,
      });
    } catch (err) {
      opts.onError?.(err instanceof Error ? err : new Error(String(err)));
      return;
    }

    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => '');
      opts.onError?.(new Error(`SSE connection failed: HTTP ${res.status} ${text.slice(0, 100)}`));
      return;
    }

    opts.onOpen?.();

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    let eventName = 'message';
    let dataLines: string[] = [];

    const flush = (): void => {
      if (dataLines.length === 0) {
        eventName = 'message';
        return;
      }
      const raw = dataLines.join('\n');
      eventName = 'message';
      dataLines = [];
      let payload: unknown = raw;
      try {
        payload = JSON.parse(raw);
      } catch {
        /* keep raw string */
      }
      opts.onEvent(eventName || 'message', payload);
    };

    while (true) {
      let read: { value: Uint8Array; done: boolean };
      try {
        read = await reader.read();
      } catch (err) {
        opts.onError?.(err instanceof Error ? err : new Error(String(err)));
        return;
      }
      if (read.done) return;
      buffer += decoder.decode(read.value, { stream: true });

      let nlIdx = buffer.indexOf('\n');
      while (nlIdx !== -1) {
        const line = buffer.slice(0, nlIdx).replace(/\r$/, '');
        buffer = buffer.slice(nlIdx + 1);

        if (line === '') {
          flush();
        } else if (line.startsWith(':')) {
          /* comment / heartbeat */
        } else {
          const colon = line.indexOf(':');
          let value = '';
          if (colon !== -1) {
            value = colon + 1 < line.length ? line.slice(colon + 1).trimStart() : '';
          }
          if (line.startsWith('event:')) {
            eventName = value;
          } else if (line.startsWith('data:')) {
            dataLines.push(value);
          } else if (line.startsWith('id:')) {
            /* last-event-id, ignore for now */
          }
        }

        nlIdx = buffer.indexOf('\n');
      }
    }
  })();

  return {
    abort: (): void => controller.abort(),
    promise,
  };
}