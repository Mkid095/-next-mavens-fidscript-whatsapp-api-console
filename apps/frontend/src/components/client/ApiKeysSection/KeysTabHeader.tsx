import { Key, Copy } from 'lucide-react';
import { PUBLIC_API_BASE } from '../../../data/apiEndpoints/index';

interface KeysTabHeaderProps {
  onCreateKey: () => void;
  copyToClipboard: (text: string) => void;
}

export default function KeysTabHeader({ onCreateKey, copyToClipboard }: KeysTabHeaderProps) {
  return (
    <>
      {/* Base URL banner */}
      <div className="bg-[#181711] border border-[#2d2813] rounded-2xl p-4">
        <p className="text-[10px] font-bold text-[#6e684a] mb-2">FidScript API Base URL</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-[11px] font-mono bg-[#1a1915] border border-[#2d2813] px-3 py-2 rounded-xl text-[#a8a99e] overflow-x-auto break-all">
            {PUBLIC_API_BASE}
          </code>
          <button
            onClick={() => copyToClipboard(PUBLIC_API_BASE)}
            className="p-2 text-[#6e684a] hover:text-[#eab308] bg-[#1a1915] border border-[#2d2813] rounded-xl transition-colors shrink-0"
            title="Copy URL"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#a8a99e] flex items-center gap-1.5">
            <Key className="w-4 h-4 text-[#eab308]" /> FidScript API Credentials
          </h3>
          <p className="text-xs text-[#6e684a] mt-0.5">Manage API keys for integrating with FidScript endpoints.</p>
        </div>
        <button
          onClick={onCreateKey}
          className="bg-[#eab308] hover:bg-yellow-400 text-[#181711] text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shrink-0"
        >
          Generate Key
        </button>
      </div>
    </>
  );
}
