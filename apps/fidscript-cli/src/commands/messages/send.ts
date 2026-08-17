/**
 * messages/send.ts - All 10 WhatsApp message types.
 *
 * Wraps the public /api/v1/messages/<type>/:instance endpoints.
 *
 * Usage (each subcommand takes --to <number> plus type-specific options):
 *   fidscript send text     my-bot --to +254700000000 --text "Hello"
 *   fidscript send media    my-bot --to +254700000000 --media-url https://…/x.jpg --media-type image --caption "Look"
 *   fidscript send location my-bot --to +254700000000 --lat -1.29 --lng 36.82 --name "Nairobi CBD"
 *   fidscript send contact  my-bot --to +254700000000 --contacts '[{"fullName":"Jane","phoneNumber":"+254…"}]'
 *   fidscript send reaction my-bot --to +254700000000 --message-key '{"remoteJid":"…@s.whatsapp.net","fromMe":false,"id":"…"}' --reaction "👍"
 *   fidscript send poll     my-bot --to +254700000000 --name "Meet where?" --selectable-count 1 --options '["Cafe","Office"]'
 *   fidscript send list     my-bot --to +254700000000 --title "Menu" --button-text "View" --sections @sections.json
 *   fidscript send audio    my-bot --to +254700000000 --audio https://…/voice.ogg
 *   fidscript send sticker  my-bot --to +254700000000 --sticker https://…/sticker.webp
 *   fidscript send status   my-bot --type text --content "On vacation" --all-contacts
 *
 * Anything more complex (e.g. nested objects) accepts inline JSON via
 * --contacts / --sections / --message-key / --status-jid-list - or pass
 * the whole body via `fidscript api POST /api/v1/messages/<type>/<inst> -d @body.json`.
 */
import { Command } from 'commander';
import {
  ApiClient,
  flags,
  outputJson,
  outputFidscriptError,
  outputCliError,
} from '../../lib/api-client.js';
import { renderSuccess } from '../../lib/render.js';

interface SendResponse { key?: { id?: string }; message?: string; timestamp?: string; }

async function loadJson(value: string | undefined, label: string): Promise<unknown | undefined> {
  if (value === undefined) return undefined;
  if (value.startsWith('@')) {
    const fs = await import('node:fs');
    return JSON.parse(fs.readFileSync(value.slice(1), 'utf-8'));
  }
  try {
    return JSON.parse(value);
  } catch (err) {
    outputCliError('INVALID_JSON', `--${label} must be valid JSON: ${(err as Error).message}`);
    process.exit(1);
  }
}

async function postSend(
  path: string,
  body: Record<string, unknown>,
  to: string,
  label: string,
): Promise<void> {
  const client = new ApiClient();
  if (!client.hasCredentials) {
    outputCliError('NO_API_KEY', 'No API key found. Pass --api-key or set FIDSCRIPT_API_KEY');
    process.exit(1);
  }

  if (flags.mode === 'json') {
    const res = await client.post<SendResponse>(path, body);
    outputJson(res);
    return;
  }

  console.error(`Sending ${label} to ${to}...`);
  try {
    const res = await client.post<SendResponse>(path, body);
    if (res.success) {
      const id = res.data?.key?.id;
      renderSuccess(`Sent${id ? ` (ID: ${id})` : ''}`);
    } else {
      outputCliError('SEND_FAILED', res.error ?? 'Send failed');
      process.exit(1);
    }
  } catch (err) {
    outputFidscriptError(err);
    process.exit(1);
  }
}

/** Required by Commander dynamic-import flow - register all subcommands on `parent`. */
export function registerSendCommands(parent: Command): void {
  parent
    .command('text <instance>')
    .description('Send a plain-text WhatsApp message')
    .requiredOption('--to <number>', 'Recipient phone (E.164 format, e.g. +254700000000)')
    .requiredOption('--text <message>', 'Message body')
    .action(async (instance: string, opts: { to: string; text: string }) => {
      await postSend(
        `/api/v1/messages/text/${encodeURIComponent(instance)}`,
        { number: opts.to, message: opts.text },
        opts.to,
        'text',
      );
    });

  parent
    .command('media <instance>')
    .description('Send image/video/document/audio by URL')
    .requiredOption('--to <number>', 'Recipient phone')
    .requiredOption('--media-url <url>', 'Public HTTPS URL of the media')
    .option('--media-type <type>', 'image | video | document | audio', 'image')
    .option('--caption <text>', 'Optional caption')
    .action(async (instance: string, opts: { to: string; mediaUrl: string; mediaType?: string; caption?: string }) => {
      await postSend(
        `/api/v1/messages/media/${encodeURIComponent(instance)}`,
        {
          number: opts.to,
          media_url: opts.mediaUrl,
          media_type: opts.mediaType ?? 'image',
          ...(opts.caption ? { caption: opts.caption } : {}),
        },
        opts.to,
        `${opts.mediaType ?? 'image'}`,
      );
    });

  parent
    .command('location <instance>')
    .description('Share a geographic location pin')
    .requiredOption('--to <number>', 'Recipient phone')
    .requiredOption('--lat <latitude>', 'Latitude (decimal degrees)')
    .requiredOption('--lng <longitude>', 'Longitude (decimal degrees)')
    .option('--name <text>', 'Location name')
    .option('--address <text>', 'Street address')
    .action(async (instance: string, opts: { to: string; lat: string; lng: string; name?: string; address?: string }) => {
      await postSend(
        `/api/v1/messages/location/${encodeURIComponent(instance)}`,
        {
          number: opts.to,
          latitude: Number(opts.lat),
          longitude: Number(opts.lng),
          ...(opts.name ? { name: opts.name } : {}),
          ...(opts.address ? { address: opts.address } : {}),
        },
        opts.to,
        'location',
      );
    });

  parent
    .command('contact <instance>')
    .description('Share one or more contact cards')
    .requiredOption('--to <number>', 'Recipient phone')
    .requiredOption('--contacts <json-or-@file>', 'Array of contact objects (JSON or @file.json)')
    .action(async (instance: string, opts: { to: string; contacts: string }) => {
      const contacts = await loadJson(opts.contacts, 'contacts');
      await postSend(
        `/api/v1/messages/contact/${encodeURIComponent(instance)}`,
        { number: opts.to, contact: contacts },
        opts.to,
        'contact',
      );
    });

  parent
    .command('reaction <instance>')
    .description('React to an existing message with an emoji')
    .requiredOption('--to <number>', 'Recipient phone')
    .requiredOption('--message-key <json-or-@file>', 'Key of the message to react to: {remoteJid, fromMe, id}')
    .requiredOption('--reaction <emoji>', 'A single emoji (or empty string to remove)')
    .action(async (instance: string, opts: { to: string; messageKey: string; reaction: string }) => {
      const key = await loadJson(opts.messageKey, 'message-key');
      await postSend(
        `/api/v1/messages/reaction/${encodeURIComponent(instance)}`,
        { number: opts.to, key, reaction: opts.reaction },
        opts.to,
        'reaction',
      );
    });

  parent
    .command('poll <instance>')
    .description('Send an interactive poll')
    .requiredOption('--to <number>', 'Recipient phone')
    .requiredOption('--name <question>', 'The poll question')
    .requiredOption('--selectable-count <n>', 'How many options a voter can pick', parseInt)
    .requiredOption('--options <json-or-@file>', 'Array of option strings (JSON or @file.json)')
    .action(async (instance: string, opts: { to: string; name: string; selectableCount: number; options: string }) => {
      const values = await loadJson(opts.options, 'options');
      await postSend(
        `/api/v1/messages/poll/${encodeURIComponent(instance)}`,
        { number: opts.to, name: opts.name, selectableCount: opts.selectableCount, values },
        opts.to,
        'poll',
      );
    });

  parent
    .command('list <instance>')
    .description('Send an interactive list menu')
    .requiredOption('--to <number>', 'Recipient phone')
    .requiredOption('--title <text>', 'Title')
    .requiredOption('--button-text <text>', 'Button label')
    .requiredOption('--sections <json-or-@file>', 'Array of {title, rows:[{title,description,rowId}]}')
    .option('--description <text>', 'Description')
    .option('--footer <text>', 'Footer text')
    .action(async (instance: string, opts: { to: string; title: string; buttonText: string; sections: string; description?: string; footer?: string }) => {
      const sections = await loadJson(opts.sections, 'sections');
      await postSend(
        `/api/v1/messages/list/${encodeURIComponent(instance)}`,
        {
          number: opts.to,
          title: opts.title,
          buttonText: opts.buttonText,
          sections,
          ...(opts.description ? { description: opts.description } : {}),
          ...(opts.footer ? { footerText: opts.footer } : {}),
        },
        opts.to,
        'list',
      );
    });

  parent
    .command('audio <instance>')
    .description('Send a native WhatsApp voice note (PTT) from an audio URL')
    .requiredOption('--to <number>', 'Recipient phone')
    .requiredOption('--audio <url>', 'Public HTTPS URL of the audio (.ogg/opus preferred)')
    .action(async (instance: string, opts: { to: string; audio: string }) => {
      await postSend(
        `/api/v1/messages/audio/${encodeURIComponent(instance)}`,
        { number: opts.to, audio: opts.audio },
        opts.to,
        'audio',
      );
    });

  parent
    .command('sticker <instance>')
    .description('Send a WhatsApp sticker from a .webp URL')
    .requiredOption('--to <number>', 'Recipient phone')
    .requiredOption('--sticker <url>', 'Public HTTPS URL of the sticker image (.webp)')
    .action(async (instance: string, opts: { to: string; sticker: string }) => {
      await postSend(
        `/api/v1/messages/sticker/${encodeURIComponent(instance)}`,
        { number: opts.to, sticker: opts.sticker },
        opts.to,
        'sticker',
      );
    });

  parent
    .command('status <instance>')
    .description('Post a status/story update (text, image, or audio)')
    .requiredOption('--type <text|image|audio>', 'Status type')
    .requiredOption('--content <text-or-url>', 'Text content, or media URL for image/audio')
    .option('--caption <text>', 'Optional caption')
    .option('--background <hex>', 'Background color (default #008000)')
    .option('--font <1-4>', 'Font code (1=SERIF 2=NORICAN 3=BRYNDAN 4=BEBAS_NEUE)', parseInt)
    .option('--all-contacts', 'Visible to all contacts (default)', true)
    .option('--no-all-contacts', 'Limit to --status-jid-list')
    .option('--status-jid-list <json-or-@file>', 'Array of recipient phone numbers')
    .action(async (instance: string, opts: {
      type: string; content: string; caption?: string; background?: string; font?: number;
      allContacts?: boolean; statusJidList?: string;
    }) => {
      const jidList = opts.statusJidList ? await loadJson(opts.statusJidList, 'status-jid-list') : undefined;
      await postSend(
        `/api/v1/messages/status/${encodeURIComponent(instance)}`,
        {
          type: opts.type,
          content: opts.content,
          ...(opts.caption ? { caption: opts.caption } : {}),
          ...(opts.background ? { backgroundColor: opts.background } : {}),
          ...(opts.font !== undefined ? { font: opts.font } : {}),
          allContacts: opts.allContacts !== false,
          ...(jidList ? { statusJidList: jidList } : {}),
        },
        '',
        'status',
      );
    });
}

// Keep `sendText` exported for backward compatibility with the existing CLI tree.
export async function sendText(instance: string, opts: { to: string; text: string }): Promise<void> {
  await postSend(
    `/api/v1/messages/text/${encodeURIComponent(instance)}`,
    { number: opts.to, message: opts.text },
    opts.to,
    'text',
  );
}