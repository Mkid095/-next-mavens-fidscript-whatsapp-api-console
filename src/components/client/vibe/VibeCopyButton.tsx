import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function VibeCopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold bg-forest-deep hover:bg-[#33301a] text-white rounded-xl transition-colors">
      {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> {label}</>}
    </button>
  );
}
