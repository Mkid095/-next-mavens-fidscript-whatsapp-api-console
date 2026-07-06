/**
 * Shared UI primitives for LLM Providers view (small utilities only).
 */
import { useState } from 'react';
import { motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';

// ─── DarkInput ──────────────────────────────────────────────────────────────────

export function DarkInput({
  label,
  hint,
  error,
  children,
}: {
  label?: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div>
      {label && (
        <label className="block text-[10px] font-bold text-[#6e684a] uppercase tracking-wider mb-1.5">
          {label}
        </label>
      )}
      {children}
      {hint && !error && <p className="mt-1 text-[10px] text-[#6e684a]">{hint}</p>}
      {error && (
        <p className="mt-1.5 text-[11px] text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-2 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

// ─── ToggleSwitch ──────────────────────────────────────────────────────────────

export function ToggleSwitch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); if (!disabled) onChange(!checked); }}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (!disabled) onChange(!checked); } }}
      className={`relative inline-flex items-center w-8 h-5 rounded-full transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-yellow-500/40 disabled:opacity-40 disabled:cursor-not-allowed ${
        checked ? 'bg-yellow-500' : 'bg-[#3d3a1e]'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-3' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

// ─── CapabilityChip ─────────────────────────────────────────────────────────────

export function CapabilityChip({
  icon,
  label,
  variant = 'default',
}: {
  icon?: React.ReactNode;
  label: string;
  variant?: 'default' | 'tools' | 'json' | 'fast' | 'slow';
}) {
  const styles: Record<string, string> = {
    default: 'bg-[#2d2813] text-[#a8a99e] border-[#3d3a1e]',
    tools:    'bg-blue-500/10 text-blue-400 border-blue-500/30',
    json:     'bg-purple-500/10 text-purple-400 border-purple-500/30',
    fast:     'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    slow:     'bg-orange-500/10 text-orange-400 border-orange-500/30',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${styles[variant]}`}>
      {icon}
      {label}
    </span>
  );
}

// ─── Copyable monospace text ───────────────────────────────────────────────────

export function CopyText({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className={`inline-flex items-center gap-1 text-[10px] font-mono text-[#6e684a] hover:text-[#a8a99e] transition-colors ${className ?? ''}`}
      title="Click to copy"
    >
      <span className="truncate">{text}</span>
      {copied ? (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400"><polyline points="20 6 9 17 4 12"/></svg>
      ) : (
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      )}
    </button>
  );
}
