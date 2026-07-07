import { Terminal, Code2, BookOpen } from 'lucide-react';
import { LANGUAGES } from '../types.ts';
import type { Lang } from '../types.ts';

export function LangTabs({ active, onChange }: { active: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="flex items-center bg-[#1a1910] rounded-xl p-1 gap-1 w-fit">
      {LANGUAGES.map(l => {
        const Icon = l.id === 'curl' ? Terminal : l.id === 'node' ? Code2 : BookOpen;
        return (
          <button
            key={l.id}
            onClick={() => onChange(l.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              active === l.id
                ? 'bg-yellow-500 text-stone-950'
                : 'text-[#6a6c5d] hover:text-white'
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
