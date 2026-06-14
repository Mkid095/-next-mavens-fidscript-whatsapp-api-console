import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, X } from 'lucide-react';
import { checkForUpdate, dismissUpdate, onUpdateChange } from '../../services/deployNotification';

export function UpdateToast() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const unsub = onUpdateChange((hasUpdate) => {
      setVisible(hasUpdate);
    });
    return unsub;
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleDismiss = () => {
    dismissUpdate();
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-20 right-6 z-50 max-w-xs w-full"
        >
          <div className="bg-amber-50 border border-amber-200 rounded-xl shadow-xl p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <RefreshCw className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-amber-900 leading-snug">
                  New updates available
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Click to refresh and get the latest version.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 text-xs text-amber-700 hover:text-amber-900 hover:bg-amber-100 rounded-md transition-colors"
              >
                Dismiss
              </button>
              <button
                onClick={handleRefresh}
                className="px-3 py-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-md transition-colors font-medium"
              >
                Refresh
              </button>
            </div>
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1 text-amber-400 hover:text-amber-600 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
