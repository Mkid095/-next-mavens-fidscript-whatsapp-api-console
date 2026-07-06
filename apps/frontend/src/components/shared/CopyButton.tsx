/**
 * CopyButton.tsx — shared dark-mode copy-to-clipboard button.
 *
 * Used by code blocks, install commands, and API key displays.
 * Shows a brief "Copied" confirmation for 2s after click.
 */
import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  className?: string;
  label?: string;
}

export function CopyButton({ text, className = '', label = 'Copy' }: CopyButtonProps): React.ReactElement {
  const [copied, setCopied] = useState(false);

  const onClick = (): void => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {
        /* fall back to no-op; user can manually copy */
      });
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={copied ? 'Copied' : label}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#8a886a] hover:text-white bg-[#1e1c10] border border-[#262413] rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-500/40 ${className}`}
    >
      {copied ? (
        <>
          <Check size={12} className="text-green-400" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy size={12} />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}

export default CopyButton;