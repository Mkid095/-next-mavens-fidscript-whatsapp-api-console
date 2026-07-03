/**
 * ChangelogPage.tsx — public release history.
 *
 * Renders entries from src/data/changelog.json. Add a new entry to that file
 * (or run `scripts/update-changelog.sh`) after each deploy.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Zap, Sparkles, Wrench, GitCommit, Github, ArrowRight } from 'lucide-react';
import SeoHead from '../shared/SeoHead';
import changelogData from '../../data/changelog.json';

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  highlights: string[];
  fixes: string[];
  commits: string[];
}

interface ChangelogShape {
  latest: string;
  feed: string;
  entries: ChangelogEntry[];
}

const data = changelogData as ChangelogShape;

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

function formatLongDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function ChangelogPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const entries = data.entries;

  const totalHighlights = entries.reduce((acc, e) => acc + e.highlights.length, 0);
  const totalFixes = entries.reduce((acc, e) => acc + e.fixes.length, 0);

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
              {entries.length} releases
            </span>
            <span className="px-2.5 py-1 bg-[#1a1910] border border-[#262413] rounded-full text-[#a8a99e]">
              <span className="text-yellow-500 font-bold">{totalHighlights}</span> features
            </span>
            <span className="px-2.5 py-1 bg-[#1a1910] border border-[#262413] rounded-full text-[#a8a99e]">
              <span className="text-green-400 font-bold">{totalFixes}</span> fixes
            </span>
            <a
              href={data.feed}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#1a1910] border border-[#262413] rounded-full text-[#a8a99e] hover:text-white hover:border-[#3d3a1e] transition-colors"
            >
              <Github className="w-3 h-3" /> Commit feed
            </a>
          </div>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          <div className="absolute left-[18px] top-0 bottom-0 w-px bg-[#262413]" />

          <div className="space-y-6">
            {entries.map((entry, idx) => {
              const isLatest = idx === 0;

              return (
                <motion.article
                  key={entry.version}
                  initial={mounted ? { opacity: 0, y: 16 } : false}
                  animate={mounted ? { opacity: 1, y: 0 } : undefined}
                  transition={{ duration: 0.35, delay: idx * 0.04 }}
                  className="relative pl-11"
                >
                  {/* Timeline dot */}
                  <div className={`absolute left-2 top-5 w-4 h-4 rounded-full border-2 ${
                    isLatest
                      ? 'bg-yellow-500 border-yellow-500 shadow-[0_0_0_4px_rgba(234,179,8,0.15)]'
                      : 'bg-[#0c0b06] border-[#383416]'
                  }`} />

                  <div className={`bg-[#11110a] border rounded-2xl p-5 ${
                    isLatest ? 'border-yellow-500/30' : 'border-[#262413]'
                  }`}>
                    {/* Header */}
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        {isLatest && (
                          <span className="px-2 py-0.5 bg-yellow-500 text-[#181711] text-[10px] font-bold rounded-full uppercase tracking-wider">
                            Latest
                          </span>
                        )}
                        <h2 className="text-lg font-bold text-white">
                          {entry.version}
                        </h2>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#6a6c5d] bg-[#1a1910] border border-[#262413] px-2 py-0.5 rounded-full">
                          {formatLongDate(entry.date)}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#5a554a] shrink-0" title={entry.date}>
                        {timeAgo(entry.date)}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-[#cbd3cf] mb-4 leading-snug">
                      {entry.title}
                    </h3>

                    {/* Highlights */}
                    {entry.highlights.length > 0 && (
                      <section className="mb-4">
                        <header className="flex items-center gap-1.5 text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-2">
                          <Sparkles className="w-3 h-3" /> Highlights
                        </header>
                        <ul className="space-y-1.5">
                          {entry.highlights.map((h, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-[#cbd3cf] leading-relaxed">
                              <span className="text-yellow-500 mt-0.5 select-none shrink-0">+</span>
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {/* Fixes */}
                    {entry.fixes.length > 0 && (
                      <section className="mb-4">
                        <header className="flex items-center gap-1.5 text-[10px] font-bold text-green-400 uppercase tracking-widest mb-2">
                          <Wrench className="w-3 h-3" /> Fixes &amp; improvements
                        </header>
                        <ul className="space-y-1.5">
                          {entry.fixes.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-[#a8a99e] leading-relaxed">
                              <span className="text-green-400 mt-0.5 select-none shrink-0">·</span>
                              <span>{f}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {/* Commits (collapsible when long) */}
                    {entry.commits.length > 0 && (
                      <section>
                        <header className="flex items-center gap-1.5 text-[10px] font-bold text-[#6a6c5d] uppercase tracking-widest mb-2">
                          <GitCommit className="w-3 h-3" /> Commits
                        </header>
                        <div className="flex flex-wrap gap-1.5">
                          {entry.commits.map((c, i) => (
                            <a
                              key={i}
                              href={`https://github.com/Mkid095/-next-mavens-fidscript-whatsapp-api-console/commit/${c}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#1a1910] border border-[#262413] rounded text-[10px] font-mono text-[#8a886a] hover:text-yellow-500 hover:border-[#3d3a1e] transition-colors"
                            >
                              <GitCommit className="w-2.5 h-2.5" /> {c.slice(0, 7)}
                            </a>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>

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
            href={`${data.feed}/commits/main.atom`}
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