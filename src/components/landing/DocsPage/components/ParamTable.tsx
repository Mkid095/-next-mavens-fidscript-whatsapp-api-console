import type { ParamRow } from '../types.ts';

export function ParamTable({ params }: { params: ParamRow[] }) {
  if (params.length === 0) return null;

  return (
    <div className="rounded-xl overflow-hidden border border-[#262413]">
      <table className="w-full text-xs">
        <thead className="bg-[#1a1910]">
          <tr>
            {['Name', 'Type', 'Required', 'Description'].map(h => (
              <th key={h} className="text-left px-4 py-2.5 font-bold text-[#8a886a]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#262413]">
          {params.map(p => (
            <tr key={p.name} className="hover:bg-[#1a1910]/50">
              <td className="px-4 py-2.5 font-mono font-bold text-yellow-500">{p.name}</td>
              <td className="px-4 py-2.5 font-mono text-[#8a886a]">{p.type}</td>
              <td className="px-4 py-2.5">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  p.required ? 'bg-red-950 text-red-400' : 'bg-[#1a1910] text-[#6a6c5d]'
                }`}>
                  {p.required ? 'Required' : 'Optional'}
                </span>
              </td>
              <td className="px-4 py-2.5 text-[#8a886a]">{p.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
