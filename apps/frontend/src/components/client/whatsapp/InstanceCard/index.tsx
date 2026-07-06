import React, { useState, useRef, useEffect } from 'react';
import type { Instance } from '../../../../services/api';
import type { InstanceCardProps } from './types';
import InstanceCardMain from './InstanceCardMain';

export default function InstanceCard({ inst, onConnect, onDisconnect, onDelete, onSettings, onSyncGroups }: InstanceCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
      <InstanceCardMain
        inst={inst}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
        onDelete={onDelete}
        onSettings={onSettings}
        onSyncGroups={onSyncGroups}
        confirming={confirming}
        menuOpen={menuOpen}
        copied={copied}
        menuRef={menuRef}
        onSetConfirming={setConfirming}
        onSetMenuOpen={setMenuOpen}
        onSetCopied={setCopied}
        onCopyName={handleCopyName}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}
