import React from 'react';
import { motion } from 'motion/react';
import { METHOD_COLORS } from '../shared.tsx';

export function CLICoverageGuide() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">CLI Coverage</h1>
      <p className="text-sm text-[#8a886a] mb-8">Every <code className="font-mono text-[#eab308]">/api/v1</code> endpoint is wrapped by the <code className="font-mono text-[#eab308]">fidscript</code> CLI. Here is the full mapping.</p>
      <div className="space-y-4">
        {[
          { cmd: 'fidscript send text <instance>', method: 'POST', path: '/messages/text/:instance' },
          { cmd: 'fidscript send media <instance>', method: 'POST', path: '/messages/media/:instance' },
          { cmd: 'fidscript instance list', method: 'GET', path: '/instance/client-instances' },
          { cmd: 'fidscript instance qr <instance>', method: 'GET', path: '/instance/connect/:name' },
          { cmd: 'fidscript tokens', method: 'GET', path: '/usage' },
          { cmd: 'fidscript whoami', method: 'GET', path: '/whoami' },
        ].map(({ cmd, method, path }) => (
          <div key={cmd} className="flex items-center gap-4 bg-[#1a1910] border border-[#262413] rounded-xl px-4 py-3">
            <code className="text-xs font-mono text-yellow-500 min-w-[240px]">{cmd}</code>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono ${METHOD_COLORS[method]}`}>{method}</span>
            <code className="text-xs font-mono text-[#8a886a]">{path}</code>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
