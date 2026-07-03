import { BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PUBLIC_API_BASE } from '../../data/apiEndpoints/index';
import { METHOD_COLORS } from './docsHelpers.js';
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

/** Header action button (Export / Postman / SDK). Dark-mode tint. */
function HeaderAction({
  onClick, title, tone, label,
}: { onClick: () => void; title: string; tone: 'yellow' | 'blue' | 'purple'; label: string }) {
  const palette: Record<typeof tone, string> = {
    yellow: 'text-yellow-400 bg-yellow-900/30 border-yellow-900/50 hover:bg-yellow-900/50',
    blue:   'text-blue-400 bg-blue-900/30 border-blue-900/50 hover:bg-blue-900/50',
    purple: 'text-purple-400 bg-purple-900/30 border-purple-900/50 hover:bg-purple-900/50',
  };
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-bold border rounded-lg transition-colors shrink-0 ${palette[tone]}`}
      title={title}
    >
      {label}
    </button>
  );
}

/** Single endpoint row in the sidebar. */
function EndpointRow({ ep, selected, onSelect }: { ep: DocEndpoint; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-2 px-4 py-2 text-[10px] hover:bg-[#2d2813] transition-colors border-b border-[#2d2813]/50 text-left min-w-0 ${
        selected
          ? 'bg-yellow-900/20 border-l-2 border-l-yellow-500 text-[#eab308]'
          : 'text-[#a8a99e]'
      }`}
    >
      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ${METHOD_COLORS[ep.method] || 'bg-[#2d2813] text-[#a8a99e]'}`}>{ep.method}</span>
      <span className="font-bold truncate">{ep.name}</span>
    </button>
  );
}

export default function EndpointSidebar({
  groups, activeCategory, setActiveCategory,
  selectedEndpoint, setSelectedEndpoint, apiKey, onSdkClick,
}: EndpointSidebarProps) {
  return (
    <div className="w-72 shrink-0 bg-[#1a1915] border border-[#2d2813] rounded-3xl overflow-hidden flex flex-col shadow-sm">
      <div className="p-4 bg-[#181711] border-b border-[#2d2813]">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-bold text-[#cbd3cf] flex items-center gap-1.5 w-full sm:w-auto">
            <BookOpen className="w-4 h-4 text-yellow-500" /> API Reference
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <HeaderAction
              label="Export All"
              title="Download full API reference"
              tone="yellow"
              onClick={() => {
                import('../../data/apiEndpoints/index.js').then(({ API_ENDPOINTS }) => {
                  const doc = buildMarkdownReference(API_ENDPOINTS, apiKey ?? '');
                  const blob = new Blob([doc], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'fidscript-api-reference.md';
                  a.click();
                  URL.revokeObjectURL(url);
                });
              }}
            />
            <HeaderAction
              label="Postman"
              title="Download Postman collection"
              tone="blue"
              onClick={() => { window.open(`${PUBLIC_API_BASE}/postman-collection.json`, '_blank'); }}
            />
            <HeaderAction
              label="SDK"
              title="Download SDK"
              tone="purple"
              onClick={onSdkClick}
            />
          </div>
        </div>
        <p className="text-[10px] text-[#6e684a] hidden sm:block">All FIDScript API endpoints.</p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {groups.map(group => (
          <div key={group.name}>
            <button
              onClick={() => setActiveCategory(group.name)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-[11px] font-bold hover:bg-[#2d2813] transition-colors border-b border-[#2d2813]/50 ${
                activeCategory === group.name
                  ? 'bg-yellow-900/20 text-[#eab308]'
                  : 'text-[#a8a99e]'
              }`}
            >
              <span className="text-[#6e684a] text-[10px]">{group.name}</span>
              <span className="ml-auto text-[9px] text-[#5a554a]">{group.endpoints.length}</span>
            </button>
            <AnimatePresence>
              {activeCategory === group.name && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-[#181711]/50">
                  {group.endpoints.map(ep => (
                    <EndpointRow
                      key={ep.path + ep.method}
                      ep={ep}
                      selected={selectedEndpoint?.path === ep.path}
                      onSelect={() => setSelectedEndpoint(ep)}
                    />
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