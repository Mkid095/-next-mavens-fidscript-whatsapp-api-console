/**
 * LLMTestPanel — test result display modal.
 */
import { motion } from 'motion/react';
import { X, CheckCircle2, AlertCircle, Boxes } from 'lucide-react';
import { TestResult } from './types';

// ─── TestResultModal ────────────────────────────────────────────────────────────

export function TestResultModal({
  providerName,
  result,
  onClose,
}: {
  providerName: string;
  result: TestResult;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 pt-16" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, y: -16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-md overflow-hidden rounded-3xl bg-[#1a1915] border border-[#2d2813] shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#2d2813] px-5 py-4">
          <div className="flex items-center gap-2.5">
            {result.ok ? (
              <div className="flex items-center justify-center w-8 h-8 rounded-xl border bg-emerald-500/10 border-emerald-500/30">
                <CheckCircle2 size={15} className="text-emerald-400" />
              </div>
            ) : (
              <div className="flex items-center justify-center w-8 h-8 rounded-xl border bg-red-500/10 border-red-500/30">
                <AlertCircle size={15} className="text-red-400" />
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold text-[#cbd3cf]">Test: {providerName}</h3>
              <p className="text-[10px] text-[#6e684a]">{result.ok ? 'Connection verified' : 'Connection failed'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#a8a99e] hover:text-[#cbd3cf] hover:bg-[#2d2813] transition-colors" aria-label="Close">
            <X size={15} />
          </button>
        </div>
        <div className="p-5 space-y-3">
          {result.ok ? (
            <>
              <div className="flex items-center gap-2 text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-2.5">
                <CheckCircle2 size={14} className="shrink-0" />
                <span className="text-xs font-semibold">Connection successful</span>
              </div>
              {typeof result.imported === 'number' && result.imported > 0 && (
                <div className="flex items-center gap-2 text-blue-300 bg-blue-500/10 border border-blue-500/30 rounded-lg p-2.5">
                  <Boxes size={14} className="shrink-0" />
                  <span className="text-xs font-semibold">{result.imported} models auto-imported</span>
                  <span className="text-[10px] text-blue-400/70">— now available in chatbots</span>
                </div>
              )}
              {result.models && result.models.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-[#6e684a] uppercase tracking-wider">
                    Discovered models ({result.total ?? result.models.length})
                  </p>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                    {result.models.map((m) => (
                      <span key={m} className="px-2 py-0.5 bg-[#12110c] text-[#cbd3cf] border border-[#2d2813] rounded-md text-[10px] font-mono">{m}</span>
                    ))}
                  </div>
                  {(typeof result.total === 'number' && result.total > result.models.length) && (
                    <p className="text-[9px] text-[#6e684a]">Showing {result.models.length} of {result.total} — all imported</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-start gap-2 text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">{result.error ?? 'Connection failed'}</p>
            </div>
          )}
        </div>
        <div className="flex justify-end border-t border-[#2d2813] px-5 py-3 bg-[#12110c]">
          <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-[#a8a99e] hover:text-[#cbd3cf] transition-colors">
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
