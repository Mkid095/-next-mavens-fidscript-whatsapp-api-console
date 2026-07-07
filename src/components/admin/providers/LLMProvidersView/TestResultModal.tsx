/**
 * TestResultModal — shows connection test result with model list.
 */
import { TestTube, CheckCircle2, X, AlertCircle } from 'lucide-react';

export function TestResultModal({
  providerName,
  result,
  onClose,
}: {
  providerName: string;
  result: { ok: boolean; models?: string[]; total?: number; error?: string };
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <TestTube size={14} className="text-yellow-600" />
            <h3 className="text-sm font-semibold text-stone-800">Test: {providerName}</h3>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700"><X size={15} /></button>
        </div>
        <div className="p-4 space-y-3">
          {result.ok ? (
            <>
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 size={16} />
                <span className="text-xs font-semibold">Connection successful</span>
              </div>
              {result.models && result.models.length > 0 && (
                <div>
                  <p className="text-[10px] text-stone-500 uppercase tracking-wider mb-1">
                    Available models ({result.total})
                  </p>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                    {result.models.map((m) => (
                      <span key={m} className="px-2 py-0.5 bg-stone-100 text-stone-700 rounded-full text-[10px] font-mono">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-start gap-2 text-red-600">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p className="text-xs">{result.error ?? 'Connection failed'}</p>
            </div>
          )}
        </div>
        <div className="flex justify-end border-t border-stone-200 px-4 py-3">
          <button onClick={onClose} className="px-3 py-2 text-xs font-medium text-stone-600 hover:text-stone-800">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
