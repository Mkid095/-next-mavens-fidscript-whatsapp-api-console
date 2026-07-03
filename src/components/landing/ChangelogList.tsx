/**
 * ChangelogList.tsx — shared rendering of the changelog entries.
 *
 * Used by both:
 *  - ChangelogPage.tsx (the standalone /changelog page)
 *  - DocsPage.tsx   (the embedded "changelog" tab inside the docs UI)
 *
 * Renders all entries from src/data/changelog.json with highlights, fixes,
 * commits, version badges, and the latest-marker dot.
 */
import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Wrench, GitCommit, Github } from 'lucide-react';
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
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
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

interface ChangelogListProps {
  /** Optional cap on how many entries to render (default: all). */
  limit?: number;
}

export function ChangelogList({ limit }: ChangelogListProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const entries = limit ? data.entries.slice(0, limit) : data.entries;

  return (
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
                    <h2 className="text-lg font-bold text-white">{entry.version}</h2>
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

                {/* Commits */}
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
  );
}

/** Public so other components can render summary stats (e.g. on landing page). */
export const CHANGELOG_DATA = data;