import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { GitCommit, Github, ArrowRight, Package } from 'lucide-react';
import SeoHead from '../shared/SeoHead';
import Header from './Header';
import { ChangelogList, CHANGELOG_DATA } from './ChangelogList';

export default function ChangelogPage() {
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const totalHighlights = CHANGELOG_DATA.entries.reduce((acc, e) => acc + e.highlights.length, 0);
  const totalFixes = CHANGELOG_DATA.entries.reduce((acc, e) => acc + e.fixes.length, 0);

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] antialiased">
      <SeoHead
        title="Changelog - FIDScript WhatsApp API"
        description="FIDScript release history: features, fixes, and deployments across frontend, backend, CLI, and SDK."
        canonical="/changelog"
        schema="changelog"
        breadcrumbs={[{ name: 'Changelog', url: '/changelog' }]}
      />

      <Header scrolled={scrolled} onScroll={() => setScrolled(window.scrollY > 10)} />

      <div className="max-w-6xl mx-auto px-4 pt-[72px] pb-8 md:pt-[80px] md:pb-12 flex gap-8 lg:gap-10">
        {/* Sidebar - version list */}
        <aside className="hidden md:block w-52 lg:w-60 shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto">
          <div className="text-[10px] font-bold text-[#a0a0a0] uppercase tracking-widest mb-3 flex items-center gap-2">
            <Package className="w-3 h-3" /> Versions
          </div>
          <ol className="space-y-0.5">
            {CHANGELOG_DATA.entries.map((e, i) => (
              <li key={e.version}>
                <Link
                  to={`/changelog/${encodeURIComponent(e.version)}`}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-colors border ${
                    i === 0
                      ? 'bg-[#fff7ed] text-[#f97316] border-[#fed7aa]'
                      : 'text-[#525252] hover:bg-[#f8f8f8] border-transparent'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    i === 0 ? 'bg-[#f97316]' : 'bg-[#d4d4d4]'
                  }`} />
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold">{e.version}</span>
                    <span className="text-[10px] text-[#a0a0a0] truncate">
                      {new Date(e.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  {e.bumpType && (
                    <span className={`ml-auto text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      e.bumpType === 'major' ? 'bg-red-50 text-red-500'
                      : e.bumpType === 'minor' ? 'bg-orange-50 text-orange-500'
                      : 'bg-green-50 text-green-600'
                    }`}>
                      {e.bumpType[0]}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ol>
          <p className="text-[10px] text-[#a0a0a0] mt-4 leading-relaxed">
            Click any version for full details, prev/next navigation, and commit links.
          </p>
        </aside>

        <main className="flex-1 min-w-0 max-w-3xl">
          {/* Hero */}
          <motion.div
            initial={mounted ? { opacity: 0, y: 20 } : false}
            animate={mounted ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.4 }}
            className="mb-10"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#fff7ed] border border-[#fed7aa] rounded-full mb-4">
              <GitCommit className="w-3.5 h-3.5 text-[#f97316]" />
              <span className="text-xs font-semibold text-[#f97316]">Release History</span>
            </div>
            <h1
              className="text-[clamp(28px,4vw,40px)] font-bold text-[#1a1a1a] leading-tight mb-3"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Changelog
            </h1>
            <p className="text-sm text-[#525252] max-w-2xl mb-4 leading-relaxed">
              Every update shipped to FIDScript. New endpoints, CLI subcommands, and fixes - captured here on every release.
            </p>

            {/* Stats strip */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="px-2.5 py-1 bg-[#f8f8f8] border border-[#e5e5e5] rounded-full text-[#525252]">
                {CHANGELOG_DATA.entries.length} releases
              </span>
              <span className="px-2.5 py-1 bg-[#f8f8f8] border border-[#e5e5e5] rounded-full text-[#525252]">
                <span className="text-[#f97316] font-bold">{totalHighlights}</span> features
              </span>
              <span className="px-2.5 py-1 bg-[#f8f8f8] border border-[#e5e5e5] rounded-full text-[#525252]">
                <span className="text-[#16a34a] font-bold">{totalFixes}</span> fixes
              </span>
              <a
                href={CHANGELOG_DATA.feed}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#f8f8f8] border border-[#e5e5e5] rounded-full text-[#525252] hover:text-[#1a1a1a] hover:border-[#d4d4d4] transition-colors"
              >
                <Github className="w-3 h-3" /> Commit feed
              </a>
            </div>
          </motion.div>

          {/* Timeline */}
          <ChangelogList />

          {/* Stay updated cards */}
          <motion.div
            initial={mounted ? { opacity: 0 } : false}
            animate={mounted ? { opacity: 1 } : undefined}
            transition={{ delay: 0.4 }}
            className="mt-12 grid sm:grid-cols-3 gap-3"
          >
            <Link
              to="/docs"
              className="group flex items-center gap-3 bg-[#f8f8f8] hover:bg-[#f0f0f0] border border-[#e5e5e5] hover:border-[#d4d4d4] rounded-2xl px-4 py-3.5 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-[#fff7ed] flex items-center justify-center shrink-0">
                <ArrowRight className="w-4 h-4 text-[#f97316]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1a1a1a]">Docs</p>
                <p className="text-[10px] text-[#a0a0a0] truncate">Full reference</p>
              </div>
            </Link>
            <a
              href="https://www.npmjs.com/package/@fidscript/sdk"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 bg-[#f8f8f8] hover:bg-[#f0f0f0] border border-[#e5e5e5] hover:border-[#d4d4d4] rounded-2xl px-4 py-3.5 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-[#fff7ed] flex items-center justify-center shrink-0">
                <Github className="w-4 h-4 text-[#f97316]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1a1a1a]">SDK</p>
                <p className="text-[10px] text-[#a0a0a0] truncate">@fidscript/sdk</p>
              </div>
            </a>
            <a
              href={`${CHANGELOG_DATA.feed}/commits/main.atom`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 bg-[#f8f8f8] hover:bg-[#f0f0f0] border border-[#e5e5e5] hover:border-[#d4d4d4] rounded-2xl px-4 py-3.5 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-[#fff7ed] flex items-center justify-center shrink-0">
                <GitCommit className="w-4 h-4 text-[#f97316]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#1a1a1a]">Atom feed</p>
                <p className="text-[10px] text-[#a0a0a0] truncate">RSS / feed reader</p>
              </div>
            </a>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
