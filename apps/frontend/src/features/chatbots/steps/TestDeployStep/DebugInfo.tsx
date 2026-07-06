import React from 'react';
import { AlertCircle, Rocket } from 'lucide-react';

interface DebugPayload {
  matched_trigger?: string;
  matched_rule?: string;
  knowledge_sources?: string[];
  tokens_used?: number;
  latency_ms?: number;
  confidence?: number;
  ai_response?: string;
}

interface DebugInfoProps {
  debug: DebugPayload | null;
  canPublish: boolean;
}

export default function DebugInfo({ debug, canPublish }: DebugInfoProps) {
  return (
    <>
      {debug && (
        <div className="bg-[#0d0c0a] border border-[#2d2813] rounded-xl p-3">
          <p className="text-[10px] font-bold text-[#8f834a] uppercase tracking-wider mb-2">Debug</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
            {debug.matched_trigger && <div><span className="text-[#6e684a]">Trigger:</span> <span className="text-yellow-400">{debug.matched_trigger}</span></div>}
            {typeof debug.confidence === 'number' && (
              <div>
                <span className="text-[#6e684a]">Confidence:</span>{' '}
                <span className={debug.confidence >= 0.8 ? 'text-emerald-400' : debug.confidence >= 0.5 ? 'text-yellow-400' : 'text-red-400'}>
                  {Math.round(debug.confidence * 100)}%
                </span>
              </div>
            )}
            {typeof debug.latency_ms === 'number' && <div><span className="text-[#6e684a]">Latency:</span> <span className="text-white">{debug.latency_ms}ms</span></div>}
            {typeof debug.tokens_used === 'number' && <div><span className="text-[#6e684a]">Tokens:</span> <span className="text-white">{debug.tokens_used}</span></div>}
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-yellow-500/5 to-transparent border border-yellow-500/20 rounded-2xl p-6 text-center">
        <Rocket size={28} className="mx-auto text-yellow-400 mb-2" />
        <h3 className="text-sm font-bold text-white mb-1">Ready to deploy?</h3>
        <p className="text-[11px] text-[#8f834a] mb-4">
          Publishing makes your bot live on the selected WhatsApp number.
        </p>
        {!canPublish && (
          <p className="text-[10px] text-amber-400 mb-3 flex items-center justify-center gap-1">
            <AlertCircle size={12} /> Complete the required steps first (container + AI model)
          </p>
        )}
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', metaKey: true }))}
          disabled={!canPublish}
          className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 text-stone-900 font-bold text-sm rounded-xl hover:bg-yellow-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Rocket size={16} /> Publish Bot
        </button>
      </div>
    </>
  );
}
