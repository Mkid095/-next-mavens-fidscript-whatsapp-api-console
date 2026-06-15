import { Terminal, X } from 'lucide-react';

export interface SandboxResponseProps {
  response: string;
  status: number | null;
  onClose: () => void;
}

export default function SandboxResponse({ response, status, onClose }: SandboxResponseProps) {
  return (
    <div className="bg-white border border-[#eaebe4] rounded-3xl overflow-hidden shadow-sm flex-1 flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#f9f9f2] border-b border-[#eaebe4]">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-stone-500" />
          <span className="text-[10px] font-bold text-stone-600">Response</span>
          {status !== null && (
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${status < 300 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {status}
            </span>
          )}
        </div>
        <button onClick={onClose} className="text-stone-400 hover:text-black">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <pre className="text-[11px] font-mono text-stone-700 whitespace-pre-wrap break-all">{response}</pre>
      </div>
    </div>
  );
}
