import { useState, Dispatch, SetStateAction } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronDown, Settings, CheckSquare, Square, ArrowRight, ArrowLeft } from 'lucide-react';
import { API_ENDPOINTS, API_CATEGORIES } from '../../../data/apiEndpoints/index';

export type CategorySelection = 'all' | 'none' | 'custom';

export interface Step2State {
  global: CategorySelection;
  categories: Record<string, CategorySelection>;
  selectedEndpoints: Set<string>;
}

interface Step2SelectProps {
  state: Step2State;
  setState: Dispatch<SetStateAction<Step2State>>;
  onBack: () => void;
  onNext: () => void;
}

export default function Step2Select({ state, setState, onBack, onNext }: Step2SelectProps) {
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  const toggleCat = (cat: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const selectAll = () => {
    const allIds = new Set(API_ENDPOINTS.filter(e => e.path.startsWith('/api/v1')).map(e => e.id));
    setState({ global: 'all', categories: {}, selectedEndpoints: allIds });
  };

  const selectNone = () => {
    setState({ global: 'none', categories: {}, selectedEndpoints: new Set() });
  };

  const setCatSelection = (cat: string, sel: 'all' | 'none') => {
    setState(s => {
      const newCats = { ...s.categories, [cat]: sel };
      const newGlobal = Object.values(newCats).every(v => v === 'all') ? 'all'
        : Object.values(newCats).every(v => v === 'none') ? 'none' : 'custom';
      const newEps = new Set(s.selectedEndpoints);
      if (sel === 'all') {
        API_ENDPOINTS.filter(e => e.category === cat && e.path.startsWith('/api/v1')).forEach(e => newEps.add(e.id));
      } else {
        API_ENDPOINTS.filter(e => e.category === cat && e.path.startsWith('/api/v1')).forEach(e => newEps.delete(e.id));
      }
      return { global: newGlobal, categories: newCats, selectedEndpoints: newEps };
    });
  };

  const toggleEndpoint = (epId: string) => {
    setState(s => {
      const next = new Set(s.selectedEndpoints);
      if (next.has(epId)) next.delete(epId); else next.add(epId);
      return { ...s, selectedEndpoints: next };
    });
  };

  const totalEps = API_ENDPOINTS.filter(e => e.path.startsWith('/api/v1')).length;
  const selectedCount = state.selectedEndpoints.size;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={selectAll} className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${state.global === 'all' ? 'bg-[#eab308] text-[#181711] border-[#eab308]' : 'bg-[#1a1915] text-[#a8a99e] border-[#2d2813] hover:bg-[#3d3a1e]'}`}>
            All {totalEps}
          </button>
          <button onClick={selectNone} className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${state.global === 'none' ? 'bg-red-600 text-white border-red-600' : 'bg-[#1a1915] text-[#a8a99e] border-[#2d2813] hover:bg-[#3d3a1e]'}`}>
            None
          </button>
        </div>
        <span className="text-[10px] font-bold text-[#5a554a]">{selectedCount} of {totalEps} selected</span>
      </div>

      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        {API_CATEGORIES.filter(c => c.name !== 'Receiving').map(cat => {
          const catEps = API_ENDPOINTS.filter(e => e.category === cat.name && e.path.startsWith('/api/v1'));
          if (!catEps.length) return null;
          const catSel = state.categories[cat.name] ||
            (catEps.every(e => state.selectedEndpoints.has(e.id))) ? 'all' :
            (catEps.some(e => state.selectedEndpoints.has(e.id))) ? 'custom' : 'none';
          const expanded = expandedCats.has(cat.name);

          return (
            <div key={cat.name} className="border border-[#2d2813] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-[#1a1915]">
                <button onClick={() => toggleCat(cat.name)} className="flex items-center gap-2 flex-1 text-left">
                  <span className="text-[#5a554a]"><Settings className="w-4 h-4" /></span>
                  <span className="text-xs font-bold text-[#a8a99e]">{cat.name}</span>
                  <span className="text-[9px] text-[#5a554a] bg-[#181711] border border-[#2d2813] px-1.5 py-0.5 rounded font-mono">{catEps.length}</span>
                  {expanded ? <ChevronDown className="w-3.5 h-3.5 text-[#5a554a] ml-auto" /> : <ChevronRight className="w-3.5 h-3.5 text-[#5a554a] ml-auto" />}
                </button>
                <div className="flex items-center gap-1.5 ml-3">
                  <button onClick={() => setCatSelection(cat.name, 'all')}
                    className={`px-2 py-1 text-[8px] font-bold rounded border transition-all ${catSel === 'all' ? 'bg-[#eab308] text-[#181711] border-[#eab308]' : 'bg-[#1a1915] text-[#a8a99e] border-[#2d2813] hover:bg-[#3d3a1e]'}`}>
                    All
                  </button>
                  <button onClick={() => setCatSelection(cat.name, 'none')}
                    className={`px-2 py-1 text-[8px] font-bold rounded border transition-all ${catSel === 'none' ? 'bg-red-600 text-white border-red-600' : 'bg-[#1a1915] text-[#a8a99e] border-[#2d2813] hover:bg-[#3d3a1e]'}`}>
                    None
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expanded && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="divide-y divide-[#2d2813]/50">
                      {catEps.map(ep => {
                        const sel = state.selectedEndpoints.has(ep.id);
                        return (
                          <div key={ep.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#3d3a1e] transition-colors">
                            <button onClick={() => toggleEndpoint(ep.id)} className="shrink-0">
                              {sel
                                ? <CheckSquare className="w-4 h-4 text-[#eab308]" />
                                : <Square className="w-4 h-4 text-[#5a554a]" />}
                            </button>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ${ep.method === 'POST' ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700/50' : ep.method === 'DELETE' ? 'bg-red-900/50 text-red-400 border border-red-700/50' : 'bg-blue-900/50 text-blue-400 border border-blue-700/50'}`}>
                              {ep.method}
                            </span>
                            <span className="text-[10px] font-bold text-[#a8a99e] flex-1">{ep.name}</span>
                            {ep.cost !== undefined && (
                              <span className="text-[8px] font-mono text-[#5a554a] shrink-0">{ep.cost === 0 ? 'free' : `${ep.cost}t`}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button onClick={onBack} className="px-4 py-2.5 border border-[#2d2813] rounded-xl text-xs font-bold text-[#a8a99e] hover:bg-[#3d3a1e] transition-colors inline-flex items-center gap-1"><ArrowLeft size={12} /> Back</button>
        <button onClick={onNext} disabled={selectedCount === 0}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#eab308] hover:bg-[#c4940a] disabled:bg-[#2d2813] disabled:text-[#5a554a] text-[#181711] text-xs font-bold rounded-xl transition-all">
          Generate Prompt ({selectedCount} endpoint{selectedCount !== 1 ? 's' : ''}) <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
