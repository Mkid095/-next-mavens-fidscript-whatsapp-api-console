import React from 'react';
import { BookOpen } from 'lucide-react';
import { GUIDES, DOC_GROUPS, SECTION_ICONS } from './DocsLandingSection.js';
import { METHOD_COLORS } from './shared.js';

interface DocsDesktopSidebarProps {
  activeTab: 'guides' | 'api-reference' | 'changelog';
  selectedGuide: string;
  setSelectedGuide: (id: string) => void;
  activeSection: string;
  setActiveSection: (s: string) => void;
  selectedEndpoint: (typeof DOC_GROUPS)[0]['endpoints'][0] | null;
  setSelectedEndpoint: (ep: (typeof DOC_GROUPS)[0]['endpoints'][0]) => void;
}

export function DocsDesktopSidebar({
  activeTab, selectedGuide, setSelectedGuide,
  activeSection, setActiveSection, selectedEndpoint, setSelectedEndpoint,
}: DocsDesktopSidebarProps) {
  return (
    <aside className="hidden md:flex w-64 shrink-0 sticky top-[52px] h-[calc(100vh-52px)] overflow-y-auto border-r border-[#262413] flex-col py-4">
      {activeTab === 'guides' && (
        <div className="px-3">
          <div className="text-[10px] font-bold text-[#4a4a3a] uppercase tracking-widest mb-2 px-2">Guides</div>
          {GUIDES.map(g => (
            <button
              key={g.id}
              onClick={() => setSelectedGuide(g.id)}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm mb-1 transition-colors ${selectedGuide === g.id ? 'bg-yellow-500/10 text-yellow-500 font-semibold' : 'text-[#8a886a] hover:text-white hover:bg-[#1a1910]'}`}
            >
              {g.label}
            </button>
          ))}
        </div>
      )}
      {activeTab === 'api-reference' && (
        <div className="flex-1 overflow-y-auto">
          {DOC_GROUPS.map(group => (
            <div key={group.name}>
              <button
                onClick={() => setActiveSection(activeSection === group.name ? '' : group.name)}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b border-[#1a1910] ${activeSection === group.name ? 'text-yellow-500' : 'text-[#6a6c5d]'}`}
              >
                <span className={activeSection === group.name ? 'text-yellow-500' : 'text-[#4a4a3a]'}>{SECTION_ICONS[group.name] || <BookOpen size={13} />}</span>
                {group.name}
                <span className="ml-auto text-[10px] bg-[#1a1910] text-[#6a6c5d] px-1.5 py-0.5 rounded">{group.endpoints.length}</span>
              </button>
              {activeSection === group.name && group.endpoints.map(ep => (
                <button
                  key={ep.path}
                  onClick={() => setSelectedEndpoint(ep)}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-xs border-b border-[#1a1910]/50 ${selectedEndpoint?.path === ep.path && selectedEndpoint?.method === ep.method ? 'text-white bg-[#1a1910]' : 'text-[#8a886a] hover:text-white'}`}
                >
                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ${METHOD_COLORS[ep.method] || 'bg-gray-600 text-white'}`}>{ep.method}</span>
                  <span className="truncate">{ep.name}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
