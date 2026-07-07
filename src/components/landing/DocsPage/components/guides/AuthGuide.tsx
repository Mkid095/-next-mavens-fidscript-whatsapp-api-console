import { motion } from 'framer-motion';
import { DocsCodeBlock } from '../../../../shared/DocsCodeBlock';
import { Callout } from '../Callout';
import { PUBLIC_API_BASE } from '../../../../../data/apiEndpoints/index';

export function AuthGuide() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">Authentication</h1>
      <p className="text-sm text-[#8a886a] mb-8">
        All requests require your API key in the{' '}
        <code className="bg-[#1a1910] border border-[#262413] px-1.5 py-0.5 rounded text-yellow-500 font-mono text-xs">
          X-API-Key
        </code>{' '}
        header.
      </p>

      <Callout type="warning">
        <p>
          <strong className="text-white">Keep your API key secret.</strong> If exposed,
          reset it immediately from Settings → API Keys.
        </p>
      </Callout>

      <h2 className="text-lg font-bold text-white mt-8 mb-4">Request Example</h2>
      <DocsCodeBlock
        code={`curl -X GET ${PUBLIC_API_BASE}/usage \\\n  -H "X-API-Key: fidscript_live_your_key_here"`}
        lang="bash"
      />

      <h2 className="text-lg font-bold text-white mt-8 mb-4">Error Codes</h2>
      <div className="space-y-2">
        {[
          { c: 401, m: 'Invalid or missing API key' },
          { c: 403, m: 'Valid key but insufficient permissions' },
          { c: 429, m: 'Rate limit exceeded — slow down' },
          { c: 500, m: 'Server error — retry with backoff' },
        ].map(({ c, m }) => (
          <div key={c} className="flex items-center gap-3 text-xs">
            <span className="font-mono font-bold text-yellow-500 w-8">{c}</span>
            <span className="text-[#8a886a]">{m}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
