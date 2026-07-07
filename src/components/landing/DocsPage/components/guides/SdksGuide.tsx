import { motion } from 'framer-motion';
import { DocsCodeBlock } from '../../../../shared/DocsCodeBlock';

export function SdksGuide() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">SDKs &amp; direct HTTP</h1>
      <p className="text-sm text-[#8a886a] mb-8">
        FIDScript ships an official TypeScript SDK on npm. Every endpoint accepts standard JSON
        over HTTPS — any HTTP client in any language can integrate. Use the SDK for the fastest
        setup, or hit the API directly from any service.
      </p>

      <h2 className="text-lg font-bold text-white mb-4">
        1. Node.js / TypeScript SDK (recommended)
      </h2>
      <DocsCodeBlock code="npm install @fidscript/sdk" lang="bash" />
      <p className="text-xs text-[#8a886a] mt-3 mb-3">Type-safe wrappers for every endpoint:</p>
      <DocsCodeBlock
        code={`import { Fidscript, FidscriptError } from '@fidscript/sdk';

const fs = new Fidscript({ apiKey: process.env.FIDSCRIPT_API_KEY! });

// Send any of the 10 message types
await fs.sends.text('my-bot', { number: '+254700000000', message: 'Hello!' });
await fs.sends.media('my-bot', {
  number: '+254700000000',
  media_url: 'https://example.com/photo.jpg',
  caption: 'Look',
});

// Logged-in flow: chatbots, BYO LLM
const { client } = await fs.auth.requestCode('me@example.com').then(() =>
  fs.auth.verifyCode('me@example.com', '123456'),
);
await fs.instances.list();
await fs.chatbots.create({ instance_id: 'inst_abc', name: 'support-bot' });
await fs.llm.create({
  provider: 'openai',
  model: 'gpt-4o-mini',
  api_key: process.env.OPENAI_API_KEY!,
  is_default: true,
});

// Hit anything else via the generic escape hatch
await fs.api('POST', '/api/v1/groups/create', {
  subject: 'My group',
  participants: ['+254712345678'],
});

// Errors are typed
try { await fs.sends.text('bad', { number: '+254700000000', message: 'hi' }); }
catch (err) {
  if (err instanceof FidscriptError) {
    console.error(\`\${err.code} (\${err.status}): \${err.message}\`);
  }
}`}
        lang="typescript"
      />

      <h2 className="text-lg font-bold text-white mt-10 mb-4">
        2. Direct HTTP (any language)
      </h2>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-[#6a6c5d] uppercase font-bold mb-2">cURL</p>
          <DocsCodeBlock
            code={`curl -X POST https://whatsapp.fidscript.com/api/v1/messages/text/my-bot \\
  -H "X-API-Key: $FIDSCRIPT_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"number":"+254700000000","text":"Hello!"}'`}
            lang="bash"
          />
        </div>
        <div>
          <p className="text-xs text-[#6a6c5d] uppercase font-bold mb-2">Python (requests)</p>
          <DocsCodeBlock
            code={`import requests, os

BASE = 'https://whatsapp.fidscript.com/api/v1'
KEY  = os.environ['FIDSCRIPT_API_KEY']

r = requests.post(
    f'{BASE}/messages/text/my-bot',
    headers={'X-API-Key': KEY},
    json={'number': '+254700000000', 'message': 'Hello!'},
)
r.raise_for_status()
print(r.json())`}
            lang="python"
          />
        </div>
        <div>
          <p className="text-xs text-[#6a6c5d] uppercase font-bold mb-2">Go (net/http)</p>
          <DocsCodeBlock
            code={`req, _ := http.NewRequest("POST",
    "https://whatsapp.fidscript.com/api/v1/messages/text/my-bot",
    strings.NewReader(\`{"number":"+254700000000","message":"Hello!"}\`),
)
req.Header.Set("X-API-Key", os.Getenv("FIDSCRIPT_API_KEY"))
req.Header.Set("Content-Type", "application/json")

resp, _ := http.DefaultClient.Do(req)
defer resp.Body.Close()
body, _ := io.ReadAll(resp.Body)
fmt.Println(string(body))`}
            lang="go"
          />
        </div>
        <div>
          <p className="text-xs text-[#6a6c5d] uppercase font-bold mb-2">PHP (curl)</p>
          <DocsCodeBlock
            code={`<?php
$ch = curl_init('https://whatsapp.fidscript.com/api/v1/messages/text/my-bot');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'X-API-Key: ' . getenv('FIDSCRIPT_API_KEY'),
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
        'number'  => '+254700000000',
        'message' => 'Hello!',
    ]),
]);
echo curl_exec($ch);`}
            lang="php"
          />
        </div>
      </div>

      <h2 className="text-lg font-bold text-white mt-10 mb-4">
        3. Generate a typed client for any other language
      </h2>
      <p className="text-xs text-[#8a886a] mb-3">
        Pull the live OpenAPI spec and feed it to{' '}
        <code className="font-mono text-[#eab308]">openapi-generator-cli</code>. Works for
        Java/Kotlin, Swift, Rust, C#, Ruby, and dozens more:
      </p>
      <DocsCodeBlock
        code={`# Pull the spec
fidscript openapi > schema.json

# Kotlin / Android
npx --yes @openapitools/openapi-generator-cli generate \\
  -i schema.json -g kotlin -o ./fidscript-kotlin

# Swift
npx --yes @openapitools/openapi-generator-cli generate \\
  -i schema.json -g swift5 -o ./fidscript-swift

# Rust
npx --yes @openapitools/openapi-generator-cli generate \\
  -i schema.json -g rust -o ./fidscript-rust

# C#
npx --yes @openapitools/openapi-generator-cli generate \\
  -i schema.json -g csharp -o ./fidscript-csharp`}
        lang="bash"
      />
    </motion.div>
  );
}
