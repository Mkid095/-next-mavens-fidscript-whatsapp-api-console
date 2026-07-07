import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, Menu, BookOpen, ExternalLink,
} from 'lucide-react';
import SeoHead from '../../../components/shared/SeoHead.tsx';
import { ChangelogList } from '../../../components/landing/ChangelogList.tsx';
import { API_ENDPOINTS, API_CATEGORIES } from '../../../data/apiEndpoints/index';
import type { ApiEndpoint, BodyField } from '../../../data/apiEndpoints/index';
import { MobileSidebar } from './components/MobileSidebar.tsx';
import { GuideContent } from './components/guides/index.tsx';
import { ApiRefContent } from './components/ApiRefContent.tsx';
import { METHOD_COLORS } from './types.ts';

/* ── derived data (formerly inline in the big file) ── */

function flattenFields(fields: BodyField[], prefix = ''): { name: string; type: string; required: boolean; desc: string }[] {
  return fields.flatMap(f => {
    const name = prefix ? `${prefix}.${f.key}` : f.key;
    if (f.fields) return flattenFields(f.fields, name);
    return [{ name, type: f.type, required: !!f.required, desc: f.desc || '' }];
  });
}

const DOC_GROUPS = API_CATEGORIES
  .filter(cat => cat.name !== 'Receiving')
  .map(cat => ({
    name: cat.name,
    icon: cat.icon,
    endpoints: API_ENDPOINTS
      .filter((ep: ApiEndpoint) => ep.category === cat.name && ep.path.startsWith('/api/v1'))
      .map((ep: ApiEndpoint) => ({
        method: ep.method,
        path: ep.path.replace('/api/v1', '').replace(':instance', ':instanceName'),
        name: ep.name,
        desc: ep.desc,
        params: flattenFields(ep.bodyFields),
        cost: ep.cost,
        category: ep.category,
      })),
  }))
  .filter(g => g.endpoints.length > 0);

const GUIDES = [
  { id: 'quickstart',            label: 'Quick Start' },
  { id: 'authentication',        label: 'Authentication' },
  { id: 'cli',                   label: 'CLI' },
  { id: 'webhooks',              label: 'Webhooks' },
  { id: 'tools-integrations',     label: 'Tools & Integrations' },
  { id: 'byo-llm',               label: 'Bring Your Own LLM' },
  { id: 'meta-policy',           label: 'WhatsApp Meta Policy' },
  { id: 'chatbot-api',           label: 'Chatbot API' },
  { id: 'llm-api',               label: 'LLM API' },
  { id: 'rate-limits',           label: 'Rate Limits' },
  { id: 'ai-providers',          label: 'AI Providers' },
  { id: 'sdks',                  label: 'Direct HTTP (no SDK)' },
];

/* ── main page ── */
export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<'guides' | 'api-reference' | 'changelog'>('guides');
  const [activeSection, setActiveSection] = useState('');
  const [selectedGuide, setSelectedGuide] = useState('quickstart');
  const [selectedEndpoint, setSelectedEndpoint] = useState<typeof DOC_GROUPS[0]['endpoints'][0] | null>(null);
  const [lang, setLang] = useState<'curl' | 'node' | 'python' | 'php' | 'go'>('curl');
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0c0b06] text-[#cbd3cf] font-suisse-intl antialiased">
      <SeoHead
        title="Documentation — WhatsApp API"
        description="FIDScript WhatsApp API documentation: quick start guide, authentication, webhooks, rate limits, SDKs, and complete REST API reference with code examples in cURL, Node.js, Python, PHP, and Go."
        canonical="/docs"
        schema="docs"
        breadcrumbs={[{ name: 'Documentation', url: '/docs' }]}
      />

      {/* ── TOPBAR ── */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[52px] bg-[#0c0b06] border-b border-[#262413] flex items-center px-4 gap-0">
        <Link to="/" className="flex items-center gap-2 mr-6 shrink-0">
          <img src="/logo.png" alt="FIDScript" className="h-7 w-7 object-contain" />
          <span className="font-bold text-sm text-white tracking-tight">FIDScript</span>
        </Link>

        <nav className="hidden md:flex flex-1">
          {([
            { id: 'guides',        label: 'Guides' },
            { id: 'api-reference', label: 'API Reference' },
            { id: 'changelog',    label: 'Changelog' },
          ] as const).map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (item.id !== 'api-reference') setSelectedEndpoint(null);
              }}
              className={`h-[52px] px-5 text-sm border-b-2 transition-colors ${
                activeTab === item.id
                  ? 'text-white border-yellow-500'
                  : 'text-[#8a886a] border-transparent hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-2 bg-[#1a1910] border border-[#262413] rounded-lg px-3 py-1.5 w-48 cursor-text">
            <Search size={13} className="text-[#6a6c5d] shrink-0" />
            <span className="text-xs text-[#6a6c5d]">Search docs…</span>
            <span className="ml-auto text-[10px] text-[#4a4a3a] bg-[#262413] rounded px-1.5 py-0.5">
              ⌘K
            </span>
          </div>
          <Link to="/register" className="text-xs text-[#8a886a] hover:text-white transition-colors">
            Get API Key
          </Link>
          <Link to="/contact" className="text-xs text-[#8a886a] hover:text-white transition-colors">
            Support
          </Link>
          <Link to="/changelog" className="text-xs text-[#8a886a] hover:text-white transition-colors">
            Changelog
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(true)}
          className="ml-auto md:hidden p-2 text-[#8a886a]"
        >
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile sidebar */}
      <MobileSidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onSelectGuide={setSelectedGuide}
        onSelectEndpoint={(ep) => {
          setSelectedEndpoint(ep as typeof DOC_GROUPS[0]['endpoints'][0]);
          setActiveTab('api-reference');
        }}
        guides={GUIDES}
        docGroups={DOC_GROUPS}
        methodColors={METHOD_COLORS}
      />

      {/* ── SHELL ── */}
      <div className="flex pt-[52px] min-h-screen">

        {/* ── DESKTOP SIDEBAR ── */}
        <aside className="hidden md:flex w-64 shrink-0 sticky top-[52px] h-[calc(100vh-52px)] overflow-y-auto border-r border-[#262413] flex-col py-4">
          {activeTab === 'guides' && (
            <div className="px-3">
              <div className="text-[10px] font-bold text-[#4a4a3a] uppercase tracking-widest mb-2 px-2">
                Guides
              </div>
              {GUIDES.map(g => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGuide(g.id)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm mb-1 transition-colors ${
                    selectedGuide === g.id
                      ? 'bg-yellow-500/10 text-yellow-500 font-semibold'
                      : 'text-[#8a886a] hover:text-white hover:bg-[#1a1910]'
                  }`}
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
                    className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b border-[#1a1910] ${
                      activeSection === group.name ? 'text-yellow-500' : 'text-[#6a6c5d]'
                    }`}
                  >
                    <span className={activeSection === group.name ? 'text-yellow-500' : 'text-[#4a4a3a]'}>
                      {group.name}
                    </span>
                    <span className="ml-auto text-[10px] bg-[#1a1910] text-[#6a6c5d] px-1.5 py-0.5 rounded">
                      {group.endpoints.length}
                    </span>
                  </button>
                  {activeSection === group.name &&
                    group.endpoints.map(ep => (
                      <button
                        key={ep.path}
                        onClick={() => setSelectedEndpoint(ep)}
                        className={`w-full flex items-center gap-2 px-4 py-2 text-xs border-b border-[#1a1910]/50 ${
                          selectedEndpoint?.path === ep.path && selectedEndpoint?.method === ep.method
                            ? 'text-white bg-[#1a1910]'
                            : 'text-[#8a886a] hover:text-white'
                        }`}
                      >
                        <span
                          className={`text-[8px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ${
                            METHOD_COLORS[ep.method] || 'bg-gray-600 text-white'
                          }`}
                        >
                          {ep.method}
                        </span>
                        <span className="truncate">{ep.name}</span>
                      </button>
                    ))}
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 min-w-0 px-6 py-10 max-w-3xl pb-24">
          {activeTab === 'guides' && <GuideContent id={selectedGuide} />}
          {activeTab === 'api-reference' && (
            <ApiRefContent endpoint={selectedEndpoint} lang={lang} setLang={setLang} />
          )}
          {activeTab === 'changelog' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-3xl font-bold text-white mb-2">Changelog</h1>
              <p className="text-sm text-[#8a886a] mb-8">
                Every update shipped to FIDScript — new endpoints, BYO-LLM guides, CLI
                subcommands, dark-mode fixes. One entry per release.
              </p>
              <ChangelogList />
            </motion.div>
          )}
        </main>

        {/* ── TOC (desktop only, guides) ── */}
        {activeTab === 'guides' && (
          <aside className="hidden xl:block w-48 shrink-0 sticky top-[52px] h-[calc(100vh-52px)] overflow-y-auto py-10 px-4">
            <div className="text-[10px] font-bold text-[#4a4a3a] uppercase tracking-widest mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500/30 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-yellow-500" />
              </div>
              On this page
            </div>
            <ul className="space-y-1">
              {GUIDES.map(g => (
                <li key={g.id}>
                  <button
                    onClick={() => setSelectedGuide(g.id)}
                    className={`text-xs w-full text-left py-1 px-2 rounded border-l-2 transition-colors ${
                      selectedGuide === g.id
                        ? 'text-white border-yellow-500 bg-yellow-500/5'
                        : 'text-[#6a6c5d] border-transparent hover:text-white'
                    }`}
                  >
                    {g.label}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-8 pt-6 border-t border-[#262413]">
              <div className="text-[10px] font-bold text-[#4a4a3a] uppercase tracking-widest mb-3">
                Need help?
              </div>
              <Link
                to="/contact"
                className="text-xs text-yellow-500 hover:text-yellow-400 transition-colors flex items-center gap-1"
              >
                Contact support <ExternalLink size={11} />
              </Link>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
