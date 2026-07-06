/* CLI Guide content  -  CLI, Tools & Integrations, BYO LLM */
import React from 'react';
import { motion } from 'motion/react';
import { Callout, CliComparison } from '../shared.js';
import { DocsCodeBlock } from '../../../shared/DocsCodeBlock.js';
import { PUBLIC_API_BASE } from '../../../../data/apiEndpoints/index.js';

/* ── CLI Guide ── */
export function CLIGuide() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">Use the CLI</h1>
      <p className="text-sm text-[#8a886a] mb-8">
        Every <code className="font-mono text-[#eab308]">/api/v1</code> endpoint is wrapped by
        a single binary called <code className="font-mono text-[#eab308]">fidscript</code>.
        It{"'"}s built for both humans and AI agents  -  every command supports
        <code className="font-mono text-[#eab308]">--json</code> and
        <code className="font-mono text-[#eab308]">--yaml</code> output, and
        <code className="font-mono text-[#eab308]">--verbose</code> prints the underlying
        curl request as it{"'"}s sent.
      </p>
      <h2 className="text-lg font-bold text-white mb-4">Install</h2>
      <DocsCodeBlock code="curl -Ls https://whatsapp.fidscript.com/cli/install.sh | sh" lang="bash" />
      <p className="text-xs text-[#6a6c5d] mt-3">Requires Node.js 18+. The installer will bootstrap it for you.</p>
      <h2 className="text-lg font-bold text-white mt-8 mb-4">Side-by-side: cURL vs CLI</h2>
      <div className="space-y-6">
        <CliComparison op="Send a text message"
          curl={`curl -X POST ${PUBLIC_API_BASE}/messages/text/my-bot \\\n  -H "X-API-Key: $FIDSCRIPT_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"number":"+254700000000","text":"Hello!"}'`}
          cli={`fidscript send text my-bot \\\n  --to +254700000000 \\\n  --text "Hello!"`} />
        <CliComparison op="Check token balance"
          curl={`curl ${PUBLIC_API_BASE}/usage \\\n  -H "X-API-Key: $FIDSCRIPT_API_KEY"`}
          cli={`fidscript tokens`} />
        <CliComparison op="List WhatsApp instances (from DB)"
          curl={`curl ${PUBLIC_API_BASE}/instance/connection-state/my-bot \\\n  -H "X-API-Key: $FIDSCRIPT_API_KEY"`}
          cli={`fidscript instance list          # JWT auth  -  DB-backed list\nfidscript instance watch my-bot    # SSE live state`} />
        <CliComparison op="Create + publish a chatbot"
          curl={`curl -X POST ${PUBLIC_API_BASE}/chatbots \\\n  -H "X-API-Key: $FIDSCRIPT_API_KEY" \\\n  -d '{"name":"my-bot","prompt":"..."}'`}
          cli={`fidscript chatbot setup --instance my-bot   # interactive wizard\nfidscript chatbot publish <id> --watch          # stream live progress`} />
      </div>
      <h2 className="text-lg font-bold text-white mt-10 mb-4">Auth for /api/instance, /api/platform, /api/sse</h2>
      <p className="text-sm text-[#a8a594] mb-4">
        Those routes use a Bearer JWT, not an API key. Run
        <code className="font-mono text-[#eab308] mx-1">fidscript login</code>
        once and your JWT is stored in <code className="font-mono text-[#eab308]">~/.fidscript/credentials</code>.
        After login, the data-backed instance list and the chatbot CRUD commands just work.
      </p>
      <DocsCodeBlock code={`# sign in (passwordless  -  6-digit code via email)\nfidscript login --email you@example.com\n\n# verify\nfidscript whoami\n\n# now unlocked: DB-backed lists, SSE, chatbot CRUD\nfidscript instance list\nfidscript instance watch my-bot\nfidscript chatbot list\nfidscript chatbot setup --instance my-bot`} lang="bash" />
    </motion.div>
  );
}
