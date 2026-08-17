import type { ParamRow } from '../types.ts';

export function ParamTable({ params }: { params: ParamRow[] }) {
  if (params.length === 0) return null;

  return (
    <div className="rounded-xl overflow-hidden border border-[#e5e5e5]">
      <table className="w-full text-xs">
        <thead className="bg-[#f8f8f8]">
          <tr>
            {['Name', 'Type', 'Required', 'Description'].map(h => (
              <th key={h} className="text-left px-4 py-2.5 font-bold text-[#525252]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e5e5e5]">
          {params.map(p => (
            <tr key={p.name} className="hover:bg-[#f8f8f8]">
              <td className="px-4 py-2.5 font-mono font-bold text-[#f97316]">{p.name}</td>
              <td className="px-4 py-2.5 font-mono text-[#525252]">{p.type}</td>
              <td className="px-4 py-2.5">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  p.required ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-gray-100 text-gray-500 border border-gray-200'
                }`}>
                  {p.required ? 'Required' : 'Optional'}
                </span>
              </td>
              <td className="px-4 py-2.5 text-[#525252]">{p.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
