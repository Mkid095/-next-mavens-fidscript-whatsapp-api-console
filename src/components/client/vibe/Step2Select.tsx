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
          <button onClick={selectAll} className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${state.global === 'all' ? 'bg-forest-deep text-white border-forest-deep' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}`}>
            All {totalEps}
          </button>
          <button onClick={selectNone} className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${state.global === 'none' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'}`}>
            None
          </button>
        </div>
        <span className="text-[10px] font-bold text-stone-500">{selectedCount} of {totalEps} selected</span>
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
            <div key={cat.name} className="border border-[#eaebe4] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-[#f9f9f2]">
                <button onClick={() => toggleCat(cat.name)} className="flex items-center gap-2 flex-1 text-left">
                  <span className="text-stone-500"><Settings className="w-4 h-4" /></span>
                  <span className="text-xs font-bold text-forest-deep">{cat.name}</span>
                  <span className="text-[9px] text-stone-400 bg-white border border-stone-200 px-1.5 py-0.5 rounded font-mono">{catEps.length}</span>
                  {expanded ? <ChevronDown className="w-3.5 h-3.5 text-stone-400 ml-auto" /> : <ChevronRight className="w-3.5 h-3.5 text-stone-400 ml-auto" />}
                </button>
                <div className="flex items-center gap-1.5 ml-3">
                  <button onClick={() => setCatSelection(cat.name, 'all')}
                    className={`px-2 py-1 text-[8px] font-bold rounded border transition-all ${catSel === 'all' ? 'bg-forest-deep text-white border-forest-deep' : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'}`}>
                    All
                  </button>
                  <button onClick={() => setCatSelection(cat.name, 'none')}
                    className={`px-2 py-1 text-[8px] font-bold rounded border transition-all ${catSel === 'none' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-stone-500 border-stone-200 hover:bg-stone-50'}`}>
                    None
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expanded && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="divide-y divide-[#eaebe4]/50">
                      {catEps.map(ep => {
                        const sel = state.selectedEndpoints.has(ep.id);
                        return (
                          <div key={ep.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-stone-50 transition-colors">
                            <button onClick={() => toggleEndpoint(ep.id)} className="shrink-0">
                              {sel
                                ? <CheckSquare className="w-4 h-4 text-forest-deep" />
                                : <Square className="w-4 h-4 text-stone-400" />}
                            </button>
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ${ep.method === 'POST' ? 'bg-yellow-100 text-yellow-800' : ep.method === 'DELETE' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                              {ep.method}
                            </span>
                            <span className="text-[10px] font-bold text-stone-700 flex-1">{ep.name}</span>
                            {ep.cost !== undefined && (
                              <span className="text-[8px] font-mono text-stone-400 shrink-0">{ep.cost === 0 ? 'free' : `${ep.cost}t`}</span>
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
        <button onClick={onBack} className="px-4 py-2.5 border border-stone-200 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50 transition-colors inline-flex items-center gap-1"><ArrowLeft size={12} /> Back</button>
        <button onClick={onNext} disabled={selectedCount === 0}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-forest-deep hover:bg-[#33301a] disabled:bg-stone-300 text-white text-xs font-bold rounded-xl transition-all">
          Generate Prompt ({selectedCount} endpoint{selectedCount !== 1 ? 's' : ''}) <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
