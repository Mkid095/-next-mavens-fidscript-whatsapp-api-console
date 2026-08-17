import { Terminal, Code2, BookOpen } from 'lucide-react';
import { LANGUAGES } from '../types.ts';
import type { Lang } from '../types.ts';

export function LangTabs({ active, onChange }: { active: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="flex items-center bg-[#f8f8f8] border border-[#e5e5e5] rounded-xl p-1 gap-1 w-fit">
      {LANGUAGES.map(l => {
        const Icon = l.id === 'curl' ? Terminal : l.id === 'node' ? Code2 : BookOpen;
        return (
          <button
            key={l.id}
            onClick={() => onChange(l.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              active === l.id
                ? 'bg-[#f97316] text-white'
                : 'text-[#525252] hover:text-[#1a1a1a] hover:bg-[#f0f0f0]'
            }`}
          >
            <Icon size={12} />
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
