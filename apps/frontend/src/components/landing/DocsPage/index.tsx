/* DocsPage/index.tsx — Thin shell: owns all state, renders top-level layout */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Search, Menu, ExternalLink } from 'lucide-react';
import SeoHead from '../../shared/SeoHead.js';
import { ChangelogList } from '../ChangelogList';
import { DocsMobileSidebar } from './DocsMobileSidebar.js';
import { DocsDesktopSidebar } from './DocsDesktopSidebar.js';
import { DocsTableOfContents } from './DocsTableOfContents.js';
import { DocsGuideContent } from './DocsGuideContent/index.js';
import { DocsApiRefContent } from './DocsApiRefContent.js';
import { LANGUAGES, METHOD_COLORS, buildCodeSnippet, flattenFields } from './shared.js';
import { DOC_GROUPS } from './DocsLandingSection.js';
import type { Lang } from './shared.js';

export type { Lang };
export { LANGUAGES, METHOD_COLORS, buildCodeSnippet, flattenFields, DOC_GROUPS };

/* ── MAIN PAGE ── */
export default function DocsPage() {
  const [activeTab, setActiveTab] = useState<'guides' | 'api-reference' | 'changelog'>('guides');
  const [activeSection, setActiveSection] = useState('');
  const [selectedGuide, setSelectedGuide] = useState('quickstart');
  const [selectedEndpoint, setSelectedEndpoint] = useState<typeof DOC_GROUPS[0]['endpoints'][0] | null>(null);
  const [lang, setLang] = useState<Lang>('curl');
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0c0b06] text-[#cbd3cf] font-suisse-intl antialiased">
      <SeoHead
        title="Documentation  -  WhatsApp API"
        description="FIDScript WhatsApp API documentation: quick start guide, authentication, webhooks, rate limits, SDKs, and complete REST API reference."
        canonical="/docs" schema="docs"
        breadcrumbs={[{ name: 'Documentation', url: '/docs' }]}
      />

      {/* TOPBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 h-[52px] bg-[#0c0b06] border-b border-[#262413] flex items-center px-4">
        <Link to="/" className="flex items-center gap-2 mr-6 shrink-0">
          <img src="/logo.png" alt="FIDScript" className="h-7 w-7 object-contain" />
          <span className="font-bold text-sm text-white tracking-tight">FIDScript</span>
        </Link>
        <nav className="hidden md:flex flex-1">
          {[
            { id: 'guides', label: 'Guides' },
            { id: 'api-reference', label: 'API Reference' },
            { id: 'changelog', label: 'Changelog' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as typeof activeTab); if (item.id !== 'api-reference') setSelectedEndpoint(null); }}
              className={`h-[52px] px-5 text-sm border-b-2 transition-colors ${activeTab === item.id ? 'text-white border-yellow-500' : 'text-[#8a886a] border-transparent hover:text-white'}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-2 bg-[#1a1910] border border-[#262413] rounded-lg px-3 py-1.5 w-48 cursor-text">
            <Search size={13} className="text-[#6a6c5d] shrink-0" />
            <span className="text-xs text-[#6a6c5d]">Search docs…</span>
            <span className="ml-auto text-[10px] text-[#4a4a3a] bg-[#262413] rounded px-1.5 py-0.5">⌘K</span>
          </div>
          <Link to="/register" className="text-xs text-[#8a886a] hover:text-white transition-colors">Get API Key</Link>
          <Link to="/contact" className="text-xs text-[#8a886a] hover:text-white transition-colors">Support</Link>
          <Link to="/changelog" className="text-xs text-[#8a886a] hover:text-white transition-colors">Changelog</Link>
        </div>
        <button onClick={() => setMobileOpen(true)} className="ml-auto md:hidden p-2 text-[#8a886a]">
          <Menu size={20} />
        </button>
      </header>

      <DocsMobileSidebar
        open={mobileOpen} onClose={() => setMobileOpen(false)}
        activeTab={activeTab} setActiveTab={setActiveTab}
        activeSection={activeSection} setActiveSection={setActiveSection}
        onSelectGuide={setSelectedGuide}
        onSelectEndpoint={(ep) => { setSelectedEndpoint(ep); setActiveTab('api-reference'); }}
      />

      <div className="flex pt-[52px] min-h-screen">
        <DocsDesktopSidebar
          activeTab={activeTab}
          selectedGuide={selectedGuide} setSelectedGuide={setSelectedGuide}
          activeSection={activeSection} setActiveSection={setActiveSection}
          selectedEndpoint={selectedEndpoint} setSelectedEndpoint={setSelectedEndpoint}
        />

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0 px-6 py-10 max-w-3xl pb-24">
          {activeTab === 'guides' && <DocsGuideContent id={selectedGuide} />}
          {activeTab === 'api-reference' && <DocsApiRefContent endpoint={selectedEndpoint} lang={lang} setLang={setLang} />}
          {activeTab === 'changelog' && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-3xl font-bold text-white mb-2">Changelog</h1>
              <p className="text-sm text-[#8a886a] mb-8">Every update shipped to FIDScript — new endpoints, BYO-LLM guides, CLI subcommands, dark-mode fixes.</p>
              <ChangelogList />
            </motion.div>
          )}
        </main>

        {/* TOC */}
        {activeTab === 'guides' && <DocsTableOfContents selectedGuide={selectedGuide} onSelect={setSelectedGuide} />}
      </div>
    </div>
  );
}
