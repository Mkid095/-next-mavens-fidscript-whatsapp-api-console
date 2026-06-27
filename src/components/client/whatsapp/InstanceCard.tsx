import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QrCode, Link2Off, RefreshCw, Wifi, WifiOff, Trash2, AlertTriangle, X, Settings2, MoreHorizontal, Copy, MessageSquare, BarChart3 } from 'lucide-react';
import type { Instance } from '../../../services/api';

interface InstanceCardProps {
  inst: Instance;
  onConnect: (inst: Instance) => void;
  onDisconnect: (inst: Instance) => void;
  onDelete: (inst: Instance) => void;
  onSettings: (inst: Instance) => void;
  onSyncGroups?: (inst: Instance) => void;
}

export default function InstanceCard({ inst, onConnect, onDisconnect, onDelete, onSettings, onSyncGroups }: InstanceCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isConnected = inst.status === 'connected';
  const isConnecting = inst.status === 'connecting';

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleCopyName = () => {
    navigator.clipboard.writeText(inst.name).then(() => {
      setCopied(true);
      setMenuOpen(false);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleConfirmDelete = () => {
    onDelete(inst);
    setConfirming(false);
  };

  return (
    <div className="bg-[#f9f9f2] border border-[#eaebe4] rounded-2xl p-4 flex flex-col justify-between min-h-[140px]">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="font-mono text-[9px] uppercase tracking-wider text-yellow-800 font-bold">Container</span>
          <h4 className="text-base font-bold text-forest-deep font-mono">{inst.name}</h4>
          <div className="text-[11px] text-[#6a6c5d] flex items-center gap-1.5">
            {isConnected ? <Wifi className="w-3 h-3 text-green-500" /> : <WifiOff className="w-3 h-3 text-stone-400" />}
            {inst.phone_number ? (
              <code className="font-mono bg-[#eaebe4] px-1 py-0.5 rounded text-xs">{inst.phone_number}</code>
            ) : isConnected ? (
              <span className="text-[10px] text-amber-600 italic">Number after first message</span>
            ) : (
              <code className="font-mono text-stone-400">—</code>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Quick actions menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-forest-deep hover:bg-stone-100 transition-all"
              title="More actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#eaebe4] rounded-xl shadow-lg z-20 py-1 overflow-hidden"
                >
                  <button
                    onClick={() => { setMenuOpen(false); onSettings(inst); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-stone-600 hover:bg-stone-50 transition-colors"
                  >
                    <Settings2 className="w-3.5 h-3.5 text-stone-400" /> Settings
                  </button>
                  <button
                    onClick={handleCopyName}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-stone-600 hover:bg-stone-50 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-stone-400" />
                    {copied ? 'Copied!' : 'Copy name'}
                  </button>
                  {isConnected && (
                    <>
                      <div className="h-px bg-stone-100 my-1" />
                      <button
                        onClick={() => { setMenuOpen(false); onSyncGroups?.(inst); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-stone-600 hover:bg-stone-50 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-stone-400" /> Sync Groups
                      </button>
                      <button
                        onClick={() => { setMenuOpen(false); onDisconnect(inst); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Link2Off className="w-3.5 h-3.5" /> Disconnect
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
            isConnected ? 'bg-green-100 text-green-800 border border-green-200' :
            isConnecting ? 'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse' :
            'bg-red-100 text-red-600 border border-red-100'
          }`}>
            {inst.status}
          </span>
        </div>
      </div>

      {/* Instance stats row */}
      {isConnected && (
        <div className="flex items-center gap-3 mt-2 text-[10px] text-stone-400">
          {inst.message_count !== undefined && (
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {inst.message_count.toLocaleString()} msgs
            </span>
          )}
          {inst.last_active && (
            <span>
              Active {new Date(inst.last_active).toLocaleDateString()}
            </span>
          )}
        </div>
      )}

      {/* Always rendered — card height is fixed, AnimatePresence cross-fades between them */}
      <AnimatePresence mode="wait">
        {!confirming ? (
          <motion.div
            key="actions"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="pt-3 border-t border-[#eaebe4] flex items-center justify-between mt-3"
          >
            <span className="text-[10px] text-stone-400 font-semibold">
              {inst.last_active ? `Active: ${new Date(inst.last_active).toLocaleDateString()}` : 'Never active'}
            </span>
            <div className="flex items-center gap-1.5">
              {!isConnected && !isConnecting && (
                <>
                  <button
                    onClick={() => onConnect(inst)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1"
                  >
                    <QrCode className="w-3 h-3" /> QR
                  </button>
                </>
              )}
              {isConnecting && (
                <button onClick={() => onConnect(inst)} className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              )}
              {isConnected && (
                <button onClick={() => onDisconnect(inst)} className="bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1">
                  <Link2Off className="w-3 h-3" /> Disconnect
                </button>
              )}
              <button
                onClick={() => onSettings(inst)}
                className="text-stone-400 hover:text-forest-deep p-1.5 bg-white border border-stone-200 hover:border-[#d4d4bc] rounded-lg transition-all"
                title="Settings"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setConfirming(true)}
                className="text-stone-400 hover:text-red-700 p-1.5 bg-white border border-stone-200 hover:border-red-200 rounded-lg transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="pt-3 border-t border-red-200 mt-3 flex flex-col gap-3"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-700">Delete "{inst.name}"?</p>
                <p className="text-[10px] text-stone-500 mt-0.5">This cannot be undone.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] py-2 rounded-lg transition-all"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold text-[10px] py-2 rounded-lg border border-stone-200 transition-all flex items-center justify-center gap-1"
              >
                <X className="w-3 h-3" /> Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
