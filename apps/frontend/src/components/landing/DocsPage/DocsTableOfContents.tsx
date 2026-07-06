import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { GUIDES } from './DocsLandingSection.js';

interface DocsTableOfContentsProps { selectedGuide: string; onSelect: (id: string) => void; }

export function DocsTableOfContents({ selectedGuide, onSelect }: DocsTableOfContentsProps) {
  return (
    <aside className="hidden xl:block w-48 shrink-0 sticky top-[52px] h-[calc(100vh-52px)] overflow-y-auto py-10 px-4">
      <div className="text-[10px] font-bold text-[#4a4a3a] uppercase tracking-widest mb-3 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-yellow-500/30 flex items-center justify-center"><div className="w-1 h-1 rounded-full bg-yellow-500" /></div>
        On this page
      </div>
      <ul className="space-y-1">
        {GUIDES.map(g => (
          <li key={g.id}>
            <button
              onClick={() => onSelect(g.id)}
              className={`text-xs w-full text-left py-1 px-2 rounded border-l-2 transition-colors ${selectedGuide === g.id ? 'text-white border-yellow-500 bg-yellow-500/5' : 'text-[#6a6c5d] border-transparent hover:text-white'}`}
            >
              {g.label}
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-8 pt-6 border-t border-[#262413]">
        <div className="text-[10px] font-bold text-[#4a4a3a] uppercase tracking-widest mb-3">Need help?</div>
        <Link to="/contact" className="text-xs text-yellow-500 hover:text-yellow-400 transition-colors flex items-center gap-1">
          Contact support <ExternalLink size={11} />
        </Link>
      </div>
    </aside>
  );
}
