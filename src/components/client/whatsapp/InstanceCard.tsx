import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QrCode, Link2Off, RefreshCw, Wifi, WifiOff, Trash2, AlertTriangle, X, Settings2, MoreHorizontal, Copy, MessageSquare } from 'lucide-react';
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
    <div className="bg-[#1a1915] border border-[#2d2813] rounded-2xl p-4 flex flex-col justify-between min-h-[140px]">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <span className="font-mono text-[9px] uppercase tracking-wider text-yellow-500 font-bold">Container</span>
          <h4 className="text-base font-bold text-[#a8a99e] font-mono">{inst.name}</h4>
          <div className="text-[11px] text-[#6e684a] flex items-center gap-1.5">
            {isConnected ? <Wifi className="w-3 h-3 text-green-400" /> : <WifiOff className="w-3 h-3 text-[#5a554a]" />}
            {inst.phone_number ? (
              <code className="font-mono bg-[#2d2813] text-[#a8a99e] px-1.5 py-0.5 rounded text-xs">{inst.phone_number}</code>
            ) : isConnected ? (
              <span className="text-[10px] text-yellow-600 italic">Number after first message</span>
            ) : (
              <code className="font-mono text-[#5a554a]">—</code>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Quick actions menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="p-1.5 rounded-lg text-[#6e684a] hover:text-[#a8a99e] hover:bg-[#2d2813] transition-all"
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
                  className="absolute right-0 top-full mt-1 w-44 bg-[#1a1915] border border-[#2d2813] rounded-xl shadow-xl z-20 py-1 overflow-hidden"
                >
                  <button
                    onClick={() => { setMenuOpen(false); onSettings(inst); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-[#a8a99e] hover:bg-[#2d2813] transition-colors"
                  >
                    <Settings2 className="w-3.5 h-3.5 text-[#6e684a]" /> Settings
                  </button>
                  <button
                    onClick={handleCopyName}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-[#a8a99e] hover:bg-[#2d2813] transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#6e684a]" />
                    {copied ? 'Copied!' : 'Copy name'}
                  </button>
                  {isConnected && (
                    <>
                      <div className="h-px bg-[#2d2813] my-1" />
                      <button
                        onClick={() => { setMenuOpen(false); onSyncGroups?.(inst); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-[#a8a99e] hover:bg-[#2d2813] transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-[#6e684a]" /> Sync Groups
                      </button>
                      <button
                        onClick={() => { setMenuOpen(false); onDisconnect(inst); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] text-red-400 hover:bg-red-900/20 transition-colors"
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
            isConnected ? 'bg-green-900/40 text-green-400 border border-green-800/50' :
            isConnecting ? 'bg-yellow-900/30 text-yellow-500 border border-yellow-700/50 animate-pulse' :
            'bg-red-900/30 text-red-400 border border-red-800/40'
          }`}>
            {inst.status}
          </span>
        </div>
      </div>

      {/* Instance stats row */}
      {isConnected && (
        <div className="flex items-center gap-3 mt-2 text-[10px] text-[#6e684a]">
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
            className="pt-3 border-t border-[#2d2813] flex items-center justify-between mt-3"
          >
            <span className="text-[10px] text-[#5a554a] font-semibold">
              {inst.last_active ? `Active: ${new Date(inst.last_active).toLocaleDateString()}` : 'Never active'}
            </span>
            <div className="flex items-center gap-1.5">
              {!isConnected && !isConnecting && (
                <button
                  onClick={() => onConnect(inst)}
                  className="bg-yellow-500 hover:bg-yellow-400 text-[#181711] font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all"
                >
                  <QrCode className="w-3 h-3" /> QR
                </button>
              )}
              {isConnecting && (
                <button onClick={() => onConnect(inst)} className="bg-yellow-500 hover:bg-yellow-400 text-[#181711] font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all">
                  <RefreshCw className="w-3 h-3" /> Retry
                </button>
              )}
              {isConnected && (
                <button onClick={() => onDisconnect(inst)} className="bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-all">
                  <Link2Off className="w-3 h-3" /> Disconnect
                </button>
              )}
              <button
                onClick={() => onSettings(inst)}
                className="text-[#6e684a] hover:text-[#a8a99e] p-1.5 bg-[#1a1915] border border-[#2d2813] hover:border-[#3d3a1e] rounded-lg transition-all"
                title="Settings"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setConfirming(true)}
                className="text-[#6e684a] hover:text-red-400 p-1.5 bg-[#1a1915] border border-[#2d2813] hover:border-red-800/50 rounded-lg transition-all"
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
            className="pt-3 border-t border-red-900/40 mt-3 flex flex-col gap-3"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-red-400">Delete "{inst.name}"?</p>
                <p className="text-[10px] text-[#5a554a] mt-0.5">This cannot be undone.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold text-[10px] py-2 rounded-lg transition-all"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 bg-[#2d2813] hover:bg-[#3d3a1e] text-[#a8a99e] font-bold text-[10px] py-2 rounded-lg border border-[#2d2813] transition-all flex items-center justify-center gap-1"
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
