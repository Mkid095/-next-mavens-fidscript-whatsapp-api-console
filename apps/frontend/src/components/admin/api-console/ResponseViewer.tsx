import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Terminal, Copy, RefreshCw, ShieldCheck, CheckCircle2, Braces } from 'lucide-react';

interface ResponseViewerProps {
  isRunning: boolean;
  responseCode: number | null;
  responseBody: string;
  endpointPath: string;
}

export default function ResponseViewer({ isRunning, responseCode, responseBody, endpointPath }: ResponseViewerProps) {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(responseBody || 'No active response payload');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="lg:col-span-3 bg-[#0d1613] border border-[#162721] rounded-3xl overflow-hidden flex flex-col justify-between shadow-lg">
      <div className="p-4 bg-[#11211b] border-b border-[#1b3129] flex items-center justify-between text-[#cbd4d0]">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-[11px] font-bold">FIDScript Gateway Terminal</span>
        </div>
        {responseCode && (
          <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold font-mono bg-[#10b981]/15 text-emerald-400 border border-emerald-500/20">
            HTTP {responseCode} OK
          </span>
        )}
      </div>

      <div className="p-5 flex-1 min-h-[300px] font-mono text-[11px] whitespace-pre overflow-auto bg-[#09100e] text-emerald-300">
        {isRunning ? (
          <div className="h-full flex flex-col items-center justify-center text-[#567a68] space-y-3 pb-8">
            <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
            <span className="font-bold">POST {endpointPath} HTTP/1.1</span>
            <span>Resolving remote node handshakes...</span>
          </div>
        ) : responseBody ? (
          <motion.code
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="block text-[#c4ebd8] leading-relaxed"
          >
            {responseBody}
          </motion.code>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-[#415e50]/70 text-center space-y-2 py-12">
            <Braces className="w-8 h-8 text-[#263e32]" />
            <p className="font-bold">Ready to dispatch requests.</p>
            <p className="text-[10px] text-[#416252]">
              API Sandbox targets: <code className="font-mono text-emerald-400 bg-emerald-950/40 px-1 py-0.5 rounded">{endpointPath}</code>
            </p>
          </div>
        )}
      </div>

      <div className="p-4 bg-[#0d1613] border-t border-[#162721] flex items-center justify-between text-[#4e6a5b]">
        <span className="text-[9px] font-mono font-bold flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>SSL HANDSHAKE DEPLOYED</span>
        </span>
        {responseBody && (
          <button
            onClick={copyToClipboard}
            className="inline-flex items-center gap-1.5 text-[10px] text-[#cbd4d0] hover:text-white bg-[#14231e] hover:bg-[#192e27] border border-[#203a31] px-3 py-1.5 rounded-lg transition-colors focus:outline-none"
          >
            {isCopied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy JSON</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}