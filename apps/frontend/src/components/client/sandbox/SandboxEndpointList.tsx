import { Search, ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ICON_MAP, METHOD_COLORS, ENDPOINT_GROUPS } from '../sandboxHelpers.js';
import type { EndpointDef, CategoryGroup } from './types.js';

export interface SandboxEndpointListProps {
  search: string;
  onSearch: (v: string) => void;
  expandedCategories: Set<string>;
  onToggleCategory: (name: string) => void;
  selectedEndpoint: EndpointDef | null;
  onSelectEndpoint: (ep: EndpointDef) => void;
  instanceName: string;
}

const filterGroups = (search: string): CategoryGroup[] => {
  if (!search) return ENDPOINT_GROUPS;
  const q = search.toLowerCase();
  return ENDPOINT_GROUPS
    .map(g => ({
      ...g,
      endpoints: g.endpoints.filter(
        ep => ep.name.toLowerCase().includes(q) || ep.path.toLowerCase().includes(q) || ep.desc.toLowerCase().includes(q)
      ),
    }))
    .filter(g => g.endpoints.length > 0);
};

export default function SandboxEndpointList({
  search,
  onSearch,
  expandedCategories,
  onToggleCategory,
  selectedEndpoint,
  onSelectEndpoint,
  instanceName,
}: SandboxEndpointListProps) {
  const groups = filterGroups(search);

  return (
    <div className="bg-[#1a1915] border border-[#2d2813] rounded-3xl overflow-hidden shadow-sm flex flex-col min-w-0" style={{ maxHeight: '100%' }}>
      <div className="p-3 border-b border-[#2d2813] bg-[#181711] shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5a554a] pointer-events-none" />
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search endpoints…"
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#2d2813] rounded-xl focus:outline-none focus:border-yellow-500 bg-[#181711] text-[#a8a99e]"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {groups.map(group => (
          <div key={group.name}>
            <button
              onClick={() => onToggleCategory(group.name)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-[#cbd3cf] bg-[#181711] border-b border-[#2d2813] hover:bg-[#2d2813] transition-colors"
            >
              <span className="text-[#a8a99e]">{ICON_MAP[group.icon]}</span>
              <span>{group.name}</span>
              <span className="ml-auto text-[#5a554a]">{group.endpoints.length}</span>
              {expandedCategories.has(group.name) ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            <AnimatePresence>
              {expandedCategories.has(group.name) && (
                <motion.div
                  initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  {group.endpoints.map(ep => (
                    <button
                      key={ep.path + ep.method}
                      onClick={() => onSelectEndpoint(ep)}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-[11px] hover:bg-[#2d2813] transition-colors text-left border-b border-[#2d2813] ${
                        selectedEndpoint?.path === ep.path && selectedEndpoint?.method === ep.method
                          ? 'bg-yellow-900/30 border-l-2 border-l-yellow-500'
                          : ''
                      }`}
                    >
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ${METHOD_COLORS[ep.method]}`}>{ep.method}</span>
                      <div className="min-w-0">
                        <p className="font-bold text-[#cbd3cf] truncate">{ep.name}</p>
                        <p className="text-[9px] text-[#5a554a] font-mono truncate">{ep.path.replace(':instanceName', instanceName || ':instance')}</p>
                      </div>
                      {ep.cost !== undefined && ep.cost > 0 && <span className="ml-auto text-[9px] font-bold text-yellow-500 shrink-0">{ep.cost}t</span>}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
