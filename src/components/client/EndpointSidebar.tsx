import { BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PUBLIC_API_BASE } from '../../data/apiEndpoints/index';
import { METHOD_COLORS, CopyButton } from './docsHelpers.js';
import { buildMarkdownReference } from '../../utils/codegen';

export interface DocGroup { name: string; icon: string; endpoints: DocEndpoint[]; }
export interface DocEndpoint {
  method: 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT';
  path: string;
  name: string;
  desc: string;
  params: Array<{ name: string; type: string; required: boolean; desc: string }>;
  cost?: number;
  category: string;
}

interface EndpointSidebarProps {
  groups: DocGroup[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  selectedEndpoint: DocEndpoint | null;
  setSelectedEndpoint: (ep: DocEndpoint) => void;
  apiKey?: string;
  onSdkClick: () => void;
}

export default function EndpointSidebar({
  groups, activeCategory, setActiveCategory,
  selectedEndpoint, setSelectedEndpoint, apiKey, onSdkClick,
}: EndpointSidebarProps) {
  return (
    <div className="w-72 shrink-0 bg-white border border-[#eaebe4] rounded-3xl overflow-hidden flex flex-col shadow-sm">
      <div className="p-4 bg-[#f9f9f2] border-b border-[#eaebe4]">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-bold text-forest-deep flex items-center gap-1.5 w-full sm:w-auto">
            <BookOpen className="w-4 h-4 text-yellow-700" /> API Reference
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                // Lazy import the registry to avoid a circular dep with the endpoint helper file
                import('../../data/apiEndpoints/index.js').then(({ API_ENDPOINTS }) => {
                  const doc = buildMarkdownReference(API_ENDPOINTS, apiKey);
                  const blob = new Blob([doc], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'fidscript-api-reference.md';
                  a.click();
                  URL.revokeObjectURL(url);
                });
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-bold text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-lg border border-yellow-200 transition-colors shrink-0"
              title="Download full API reference"
            >
              Export All
            </button>
            <button
              onClick={() => { window.open(`${PUBLIC_API_BASE}/postman-collection.json`, '_blank'); }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors shrink-0"
              title="Download Postman collection"
            >
              Postman
            </button>
            <button
              onClick={onSdkClick}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors shrink-0"
              title="Download SDK"
            >
              SDK
            </button>
          </div>
        </div>
        <p className="text-[10px] text-graphite hidden sm:block">All FIDScript WhatsApp API endpoints.</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {groups.map(group => (
          <div key={group.name}>
            <button
              onClick={() => setActiveCategory(group.name)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-[11px] font-bold hover:bg-stone-50 transition-colors border-b border-[#eaebe4]/50 ${activeCategory === group.name ? 'bg-yellow-50 text-forest-deep' : 'text-graphite'}`}
            >
              <span className="text-stone-500 text-[10px]">{group.name}</span>
              <span className="ml-auto text-[9px] text-stone-400">{group.endpoints.length}</span>
            </button>
            <AnimatePresence>
              {activeCategory === group.name && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-stone-50/50">
                  {group.endpoints.map(ep => (
                    <button
                      key={ep.path + ep.method}
                      onClick={() => setSelectedEndpoint(ep)}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-[10px] hover:bg-yellow-50 transition-colors border-b border-[#eaebe4]/30 text-left ${selectedEndpoint?.path === ep.path ? 'bg-yellow-50 border-l-2 border-l-yellow-500 text-forest-deep' : 'text-stone-600'}`}
                    >
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ${METHOD_COLORS[ep.method] || 'bg-gray-400 text-white'}`}>{ep.method}</span>
                      <span className="font-bold truncate">{ep.name}</span>
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
