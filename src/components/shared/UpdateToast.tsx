import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, X, ChevronRight, Zap } from 'lucide-react';
import { onUpdateChange, dismissUpdate, type VersionInfo } from '../../services/deployNotification';

function parseChangelog(changelog: string | null): string[] {
  if (!changelog) return [];
  return changelog.split(';;').map((s) => s.trim()).filter(Boolean).slice(0, 5);
}

export function UpdateToast() {
  const [info, setInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    const unsub = onUpdateChange((v) => {
      setInfo(v);
    });
    return unsub;
  }, []);

  const handleRefresh = () => {
    dismissUpdate();
    window.location.reload();
  };

  const handleDismiss = () => {
    dismissUpdate();
    setInfo(null);
  };

  const commits = info ? parseChangelog(info.changelog) : [];
  const prev = info?.previous_version && info.previous_version !== '0.0.0'
    ? info.previous_version
    : null;

  return (
    <AnimatePresence>
      {info && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="fixed bottom-20 right-4 left-4 sm:left-auto sm:right-6 z-50 sm:max-w-sm w-full sm:w-80"
        >
          <div className="bg-[#181711] border border-[#383416] rounded-2xl shadow-2xl overflow-hidden">
            {/* Accent bar */}
            <div className="h-0.5 bg-yellow-500 w-full" />

            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center shrink-0">
                    <Zap className="w-3.5 h-3.5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">
                      New update deployed
                    </p>
                    <p className="text-[10px] text-yellow-500 font-mono mt-0.5">
                      v{info.version}
                      {prev && <span className="text-[#6a6c5d] ml-1">← v{prev}</span>}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-[#6a6c5d] hover:text-white transition-colors p-0.5 -mr-1 -mt-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Changes list */}
              {commits.length > 0 && (
                <div className="mb-3 space-y-1">
                  {commits.map((commit, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-[#a8a594]">
                      <span className="text-yellow-500/60 mt-0.5 shrink-0">•</span>
                      <span className="leading-relaxed">{commit}</span>
                    </div>
                  ))}
                </div>
              )}

              {info.changes_summary && (
                <p className="text-[10px] text-[#6a6c5d] mb-3 leading-relaxed italic">
                  {info.changes_summary}
                </p>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Link
                  to="/changelog"
                  onClick={handleDismiss}
                  className="flex-1 flex items-center justify-center gap-1 py-2 text-[10px] text-[#a8a594] hover:text-white border border-[#262413] hover:border-[#383416] rounded-lg transition-colors"
                >
                  Full changelog
                  <ChevronRight className="w-3 h-3" />
                </Link>
                <button
                  onClick={handleRefresh}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] bg-yellow-500 hover:bg-yellow-400 text-stone-950 font-bold rounded-lg transition-colors"
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh
                </button>
              </div>

              {/* Dismiss hint */}
              <p className="text-[9px] text-[#3d3a1e] text-center mt-2">
                Auto-dismissed after 30 minutes ·{" "}
                <button onClick={handleDismiss} className="underline hover:text-[#6a6c5d] transition-colors">
                  Dismiss for now
                </button>
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
