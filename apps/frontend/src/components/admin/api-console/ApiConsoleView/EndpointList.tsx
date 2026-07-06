import type { ApiEndpoint } from '../../../../data/apiEndpoints/index';

interface EndpointListProps {
  endpoints: ApiEndpoint[];
  selectedId: string;
  onSelect: (id: string) => void;
}

function methodColor(m: string): string {
  if (m === 'GET') return 'text-blue-400 bg-blue-900/40 border-blue-900/50';
  if (m === 'POST') return 'text-emerald-400 bg-emerald-900/40 border-emerald-900/50';
  if (m === 'PATCH') return 'text-yellow-400 bg-yellow-900/40 border-yellow-900/50';
  return 'text-[#6e684a] bg-[#181711] border-[#2d2813]';
}

export function EndpointList({ endpoints, selectedId, onSelect }: EndpointListProps) {
  return (
    <div className="w-full lg:w-72 shrink-0 space-y-1 max-h-[70vh] overflow-y-auto pr-1">
      {endpoints.map((ep) => (
        <button
          key={ep.id}
          onClick={() => onSelect(ep.id)}
          className={`w-full text-left p-2.5 rounded-xl border text-xs flex flex-col gap-0.5 transition-all ${
            selectedId === ep.id
              ? 'bg-emerald-900/40 text-emerald-300 border-emerald-900/50'
              : 'bg-[#1a1915] text-[#a8a99e] border-[#2d2813] hover:bg-[#2d2813]'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${methodColor(ep.method)}`}>
              {ep.method}
            </span>
            <span className="font-mono font-semibold truncate">{ep.path}</span>
          </span>
          <span className="text-[10px] text-[#5a554a] pl-[52px] truncate">{ep.desc}</span>
        </button>
      ))}
    </div>
  );
}
