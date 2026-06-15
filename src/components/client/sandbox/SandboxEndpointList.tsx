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
    <div className="bg-white border border-[#eaebe4] rounded-3xl overflow-hidden shadow-sm flex flex-col" style={{ maxHeight: '100%' }}>
      <div className="p-3 border-b border-[#eaebe4] bg-[#f9f9f2]">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
          <input
            value={search}
            onChange={e => onSearch(e.target.value)}
            placeholder="Search endpoints…"
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 bg-white"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {groups.map(group => (
          <div key={group.name}>
            <button
              onClick={() => onToggleCategory(group.name)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-forest-deep bg-[#f9f9f2] border-b border-[#eaebe4] hover:bg-stone-100 transition-colors"
            >
              <span className="text-stone-600">{ICON_MAP[group.icon]}</span>
              <span>{group.name}</span>
              <span className="ml-auto text-stone-400">{group.endpoints.length}</span>
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
                      className={`w-full flex items-center gap-2 px-4 py-2 text-[11px] hover:bg-stone-50 transition-colors text-left border-b border-[#eaebe4]/50 ${
                        selectedEndpoint?.path === ep.path && selectedEndpoint?.method === ep.method
                          ? 'bg-yellow-50 border-l-2 border-l-yellow-500'
                          : ''
                      }`}
                    >
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ${METHOD_COLORS[ep.method]}`}>{ep.method}</span>
                      <div className="min-w-0">
                        <p className="font-bold text-forest-deep truncate">{ep.name}</p>
                        <p className="text-[9px] text-stone-400 font-mono truncate">{ep.path.replace(':instanceName', instanceName || ':instance')}</p>
                      </div>
                      {ep.cost !== undefined && ep.cost > 0 && <span className="ml-auto text-[9px] font-bold text-yellow-700 shrink-0">{ep.cost}t</span>}
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
