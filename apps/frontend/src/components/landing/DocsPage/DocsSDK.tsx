/* SDK guide content  -  SDKs & Direct HTTP */
import React from 'react';
import { motion } from 'motion/react';
import { DocsCodeBlock } from '../../shared/DocsCodeBlock.js';

/* ── SDKs & Direct HTTP ── */
export function DocsSDK() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">SDKs & direct HTTP</h1>
      <p className="text-sm text-[#8a886a] mb-8">
        FIDScript ships an official TypeScript SDK on npm. Every endpoint accepts
        standard JSON over HTTPS  -  any HTTP client in any language can integrate.
        Use the SDK for the fastest setup, or hit the API directly from any service.
      </p>

      <h2 className="text-lg font-bold text-white mb-4">1. Node.js / TypeScript SDK (recommended)</h2>
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

      <h2 className="text-lg font-bold text-white mt-10 mb-4">2. Direct HTTP (any language)</h2>
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-[#6a6c5d] uppercase font-bold mb-2">cURL</p>
          <DocsCodeBlock code={`curl -X POST https://whatsapp.fidscript.com/api/v1/messages/text/my-bot \\\n  -H "X-API-Key: $FIDSCRIPT_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"number":"+254700000000","text":"Hello!"}'`} lang="bash" />
        </div>
        <div>
          <p className="text-xs text-[#6a6c5d] uppercase font-bold mb-2">Python (requests)</p>
          <DocsCodeBlock code={`import requests, os\n\nBASE = 'https://whatsapp.fidscript.com/api/v1'\nKEY  = os.environ['FIDSCRIPT_API_KEY']\n\nr = requests.post(\n    f'{BASE}/messages/text/my-bot',\n    headers={'X-API-Key': KEY},\n    json={'number': '+254700000000', 'message': 'Hello!'},\n)\nr.raise_for_status()\nprint(r.json())`} lang="python" />
        </div>
        <div>
          <p className="text-xs text-[#6a6c5d] uppercase font-bold mb-2">Go (net/http)</p>
          <DocsCodeBlock code={`req, _ := http.NewRequest("POST",\n    "https://whatsapp.fidscript.com/api/v1/messages/text/my-bot",\n    strings.NewReader(\`{"number":"+254700000000","message":"Hello!"}\`),\n)\nreq.Header.Set("X-API-Key", os.Getenv("FIDSCRIPT_API_KEY"))\nreq.Header.Set("Content-Type", "application/json")\n\nresp, _ := http.DefaultClient.Do(req)\ndefer resp.Body.Close()\nbody, _ := io.ReadAll(resp.Body)\nfmt.Println(string(body))`} lang="go" />
        </div>
        <div>
          <p className="text-xs text-[#6a6c5d] uppercase font-bold mb-2">PHP (curl)</p>
          <DocsCodeBlock code={`<?php\n$ch = curl_init('https://whatsapp.fidscript.com/api/v1/messages/text/my-bot');\ncurl_setopt_array($ch, [\n    CURLOPT_POST           => true,\n    CURLOPT_RETURNTRANSFER => true,\n    CURLOPT_HTTPHEADER     => [\n        'X-API-Key: ' . getenv('FIDSCRIPT_API_KEY'),\n        'Content-Type: application/json',\n    ],\n    CURLOPT_POSTFIELDS => json_encode([\n        'number'  => '+254700000000',\n        'message' => 'Hello!',\n    ]),\n]);\necho curl_exec($ch);`} lang="php" />
        </div>
      </div>

      <h2 className="text-lg font-bold text-white mt-10 mb-4">3. Generate a typed client for any other language</h2>
      <p className="text-xs text-[#8a886a] mb-3">
        Pull the live OpenAPI spec and feed it to <code className="font-mono text-[#eab308]">openapi-generator-cli</code>.
        Works for Java/Kotlin, Swift, Rust, C#, Ruby, and dozens more:
      </p>
      <DocsCodeBlock
        code={`# Pull the spec\nfidscript openapi > schema.json\n\n# Kotlin / Android\nnpx --yes @openapitools/openapi-generator-cli generate \\\n  -i schema.json -g kotlin -o ./fidscript-kotlin\n\n# Swift\nnpx --yes @openapitools/openapi-generator-cli generate \\\n  -i schema.json -g swift5 -o ./fidscript-swift\n\n# Rust\nnpx --yes @openapitools/openapi-generator-cli generate \\\n  -i schema.json -g rust -o ./fidscript-rust\n\n# C#\nnpx --yes @openapitools/openapi-generator-cli generate \\\n  -i schema.json -g csharp -o ./fidscript-csharp`}
        lang="bash"
      />
    </motion.div>
  );
}

export default DocsSDK;
