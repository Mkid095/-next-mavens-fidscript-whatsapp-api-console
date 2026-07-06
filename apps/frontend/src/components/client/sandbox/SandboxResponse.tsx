import { Terminal, X } from 'lucide-react';

export interface SandboxResponseProps {
  response: string;
  status: number | null;
  onClose: () => void;
}

export default function SandboxResponse({ response, status, onClose }: SandboxResponseProps) {
  return (
    <div className="bg-[#1a1915] border border-[#2d2813] rounded-3xl overflow-hidden shadow-sm flex-1 flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#181711] border-b border-[#2d2813]">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#6e684a]" />
          <span className="text-[10px] font-bold text-[#a8a99e]">Response</span>
          {status !== null && (
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${status < 300 ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
              {status}
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-[#5a554a] hover:text-[#cbd3cf]">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <pre className="text-[11px] font-mono text-[#a8a99e] whitespace-pre-wrap break-all">{response}</pre>
      </div>
    </div>
  );
}
