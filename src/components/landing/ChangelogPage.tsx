/**
 * ChangelogPage.tsx — public release history.
 *
 * Renders entries from src/data/changelog.json via the shared ChangelogList.
 * Add a new entry to that file (or run `scripts/update-changelog.sh`) after
 * each deploy.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Zap, GitCommit, Github, ArrowRight } from 'lucide-react';
import SeoHead from '../shared/SeoHead';
import { ChangelogList, CHANGELOG_DATA } from './ChangelogList';

export default function ChangelogPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const totalHighlights = CHANGELOG_DATA.entries.reduce((acc, e) => acc + e.highlights.length, 0);
  const totalFixes = CHANGELOG_DATA.entries.reduce((acc, e) => acc + e.fixes.length, 0);

  return (
    <div className="min-h-screen bg-[#0c0b06] text-[#cbd3cf] font-suisse-intl antialiased">
      <SeoHead
        title="Changelog — FIDScript WhatsApp API"
        description="FIDScript release history: features, fixes, and deployments across frontend, backend, CLI, and SDK. Updated on every release."
        canonical="/changelog"
        schema="changelog"
        breadcrumbs={[{ name: 'Changelog', url: '/changelog' }]}
      />

      <header className="sticky top-0 z-50 bg-[#0c0b06]/95 backdrop-blur-lg border-b border-[#262413]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-[#8a886a] hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />Back to Home
          </Link>
          <div className="flex items-center gap-3 ml-auto">
            <img src="/logo.png" alt="FIDScript" className="h-8" />
            <div className="flex flex-col">
              <span className="font-bold text-sm text-white tracking-tight leading-none">FIDSCRIPT</span>
              <span className="text-[9px] text-yellow-500">by Next Mavens</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        {/* Hero */}
        <motion.div
          initial={mounted ? { opacity: 0, y: 20 } : false}
          animate={mounted ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-4">
            <GitCommit className="w-3.5 h-3.5 text-yellow-500" />
            <span className="text-xs font-semibold text-yellow-500">Release History</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Changelog</h1>
          <p className="text-sm text-[#8a886a] max-w-2xl mb-4">
            Every update shipped to FIDScript. New endpoints, BYO-LLM guides, CLI subcommands,
            dark-mode fixes — captured here on every release.
          </p>

          {/* Aggregated stats strip */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="px-2.5 py-1 bg-[#1a1910] border border-[#262413] rounded-full text-[#a8a99e]">
              {CHANGELOG_DATA.entries.length} releases
            </span>
            <span className="px-2.5 py-1 bg-[#1a1910] border border-[#262413] rounded-full text-[#a8a99e]">
              <span className="text-yellow-500 font-bold">{totalHighlights}</span> features
            </span>
            <span className="px-2.5 py-1 bg-[#1a1910] border border-[#262413] rounded-full text-[#a8a99e]">
              <span className="text-green-400 font-bold">{totalFixes}</span> fixes
            </span>
            <a
              href={CHANGELOG_DATA.feed}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1a1910] border border-[#262413] rounded-full text-[#a8a99e] hover:text-white hover:border-[#3d3a1e] transition-colors"
            >
              <Github className="w-3 h-3" /> Commit feed
            </a>
          </div>
        </motion.div>

        {/* Timeline — shared component */}
        <ChangelogList />

        {/* How to stay updated */}
        <motion.div
          initial={mounted ? { opacity: 0 } : false}
          animate={mounted ? { opacity: 1 } : undefined}
          transition={{ delay: 0.4 }}
          className="mt-16 grid sm:grid-cols-3 gap-3"
        >
          <Link
            to="/docs"
            className="group flex items-center gap-3 bg-[#11110a] hover:bg-[#181711] border border-[#262413] hover:border-[#3d3a1e] rounded-2xl px-4 py-3.5 transition-colors"
          >
            <Zap className="w-5 h-5 text-yellow-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Docs</p>
              <p className="text-[10px] text-[#6a6c5d] truncate">Full reference</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#6a6c5d] ml-auto group-hover:text-yellow-500 group-hover:translate-x-0.5 transition-all" />
          </Link>
          <a
            href="https://www.npmjs.com/package/@fidscript/sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 bg-[#11110a] hover:bg-[#181711] border border-[#262413] hover:border-[#3d3a1e] rounded-2xl px-4 py-3.5 transition-colors"
          >
            <Github className="w-5 h-5 text-yellow-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">SDK</p>
              <p className="text-[10px] text-[#6a6c5d] truncate">@fidscript/sdk</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#6a6c5d] ml-auto group-hover:text-yellow-500 group-hover:translate-x-0.5 transition-all" />
          </a>
          <a
            href={`${CHANGELOG_DATA.feed}/commits/main.atom`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 bg-[#11110a] hover:bg-[#181711] border border-[#262413] hover:border-[#3d3a1e] rounded-2xl px-4 py-3.5 transition-colors"
          >
            <GitCommit className="w-5 h-5 text-yellow-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Atom feed</p>
              <p className="text-[10px] text-[#6a6c5d] truncate">RSS / feed reader</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#6a6c5d] ml-auto group-hover:text-yellow-500 group-hover:translate-x-0.5 transition-all" />
          </a>
        </motion.div>
      </main>
    </div>
  );
}