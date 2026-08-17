# @fidscript/sdk

Official Node.js / TypeScript SDK for the [FIDScript WhatsApp Business API](https://whatsapp.fidscript.com). Type-safe wrappers for every public endpoint - auth, instance lifecycle, all 10 message types, chatbot CRUD, BYO LLM, and an escape hatch for anything else.

## Install

```bash
npm install @fidscript/sdk
# or pnpm / yarn
```

Requires Node.js 18+ (uses native `fetch`).

## Quick start

```ts
import { Fidscript } from '@fidscript/sdk';

const fs = new Fidscript({ apiKey: process.env.FIDSCRIPT_API_KEY! });

// 1. Verify auth
const me = await fs.whoami();
console.log(`Logged in as ${me.name}, ${me.token_balance} tokens`);

// 2. Send any of the 10 message types
await fs.sends.text('my-bot', {
  number: '+254700000000',
  message: 'Hello from the SDK!',
});

await fs.sends.media('my-bot', {
  number: '+254700000000',
  media_url: 'https://example.com/photo.jpg',
  caption: 'Look at this',
});

await fs.sends.location('my-bot', {
  number: '+254700000000',
  latitude: -1.2921,
  longitude: 36.8219,
  name: 'Nairobi CBD',
});

// 3. Hit any other endpoint with the generic escape hatch
await fs.api('POST', '/api/v1/groups/create', {
  subject: 'My group',
  participants: ['+254712345678'],
});
```

## Logged-in flow (chatbots, instances, BYO LLM)

```ts
import { Fidscript } from '@fidscript/sdk';

const fs = new Fidscript();

// Step 1: request a 6-digit code
await fs.auth.requestCode('me@example.com');
// (user reads the code from their inbox)

// Step 2: verify - the SDK stores both the API key and the JWT on the client
const { client } = await fs.auth.verifyCode('me@example.com', '123456');
console.log(`API key: ${client?.api_key}`);

// Step 3: list/create instances from the DB
const instances = await fs.instances.list();
const inst = await fs.instances.create({ name: 'my-bot' });

// Step 4: build a chatbot
const bot = await fs.chatbots.create({
  instance_id: inst.id,
  name: 'support-bot',
});
await fs.chatbots.setAiConfig(bot.id, {
  provider: 'openai',
  model: 'gpt-4o-mini',
  system_prompt: 'You are a polite support agent.',
  hallucination_policy: 'strict',
});
await fs.chatbots.publish(bot.id);

// Step 5: BYO LLM
const conn = await fs.llm.create({
  provider: 'openai',
  model: 'gpt-4o-mini',
  api_key: process.env.OPENAI_API_KEY!,
  is_default: true,
});
const ok = await fs.llm.test(conn.id);
console.log(`LLM test: ${ok.success ? 'OK' : ok.error}`);
```

## API surface

| Resource | Methods |
|---|---|
| `fs.whoami()` / `fs.tokens()` | Account info, token balance |
| `fs.sends.text/media/location/contact/reaction/poll/list/audio/sticker/status` | All 10 message types |
| `fs.instances.list/create/delete/qr/state` | WhatsApp instance lifecycle |
| `fs.auth.requestCode/verifyCode` | Magic-code login |
| `fs.chatbots.list/get/create/update/delete/setAiConfig/health/publish` | Chatbot CRUD + AI config |
| `fs.llm.list/create/get/update/delete/test` | BYO LLM connections |
| `fs.api(method, path, body?)` | Hit any other endpoint (groups, chats, profile, settings, …) |

The `fs.api()` escape hatch covers everything - auto-picks auth from the path (`/api/v1/*` → X-API-Key, otherwise → Bearer JWT).

## Error handling

```ts
import { Fidscript, FidscriptError } from '@fidscript/sdk';

try {
  await fs.sends.text('bad-instance', { number: '+254700000000', message: 'Hi' });
} catch (err) {
  if (err instanceof FidscriptError) {
    console.error(`${err.code} (${err.status}): ${err.message}`);
    console.error('details:', err.details);
  } else {
    throw err;
  }
}
```

The SDK automatically retries on `429` (rate-limited) and `5xx` (server error) up to 2 times with exponential backoff.

## Configuration

```ts
new Fidscript({
  baseUrl: 'https://whatsapp.fidscript.com',   // default
  apiKey: 'fidscript_live_xxx',                 // for /api/v1/*
  jwt: 'eyJhbGc…',                              // for /api/instance, /api/platform, /api/sse
  timeoutMs: 30_000,                           // default
  retries: 2,                                   // default
});
```

You can swap auth at runtime:

```ts
const fs = new Fidscript({ apiKey: 'fidscript_live_xxx' });
fs.client.setJwt('eyJhbGc…');  // now JWT-authenticated routes work too
```

## License

MIT - see [LICENSE](./LICENSE).