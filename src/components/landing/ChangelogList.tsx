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
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Wrench, GitCommit, Github, ArrowRight, Star } from 'lucide-react';
import changelogData from '../../data/changelog.json';

interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  highlights: string[];
  fixes: string[];
  commits: string[];
  bumpType?: string;
  category?: string;
  tags?: string[];
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
      <div className="absolute left-[18px] top-0 bottom-0 w-px bg-[#e5e5e5]" />

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
                  ? 'bg-[#f97316] border-[#f97316]'
                  : 'bg-white border-[#e5e5e5]'
              }`} />

              <div className={`bg-white border rounded-2xl p-5 ${
                isLatest ? 'border-[#f97316]/30' : 'border-[#e5e5e5]'
              }`}>
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    {isLatest && (
                      <span className="px-2 py-0.5 bg-[#f97316] text-white text-[10px] font-bold rounded-full uppercase tracking-wider">
                        Latest
                      </span>
                    )}
                    <h2 className="text-lg font-bold text-[#1a1a1a]">{entry.version}</h2>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#a0a0a0] bg-[#f8f8f8] border border-[#e5e5e5] px-2 py-0.5 rounded-full">
                      {formatLongDate(entry.date)}
                    </span>
                    {entry.bumpType && (
                      <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded font-mono ${
                        entry.bumpType === 'major' ? 'bg-red-50 text-red-500 border border-red-200'
                        : entry.bumpType === 'minor' ? 'bg-orange-50 text-orange-500 border border-orange-200'
                        : 'bg-green-50 text-green-600 border border-green-200'
                      }`}>{entry.bumpType}</span>
                    )}
                    <Link
                      to={`/changelog/${encodeURIComponent(entry.version)}`}
                      className="ml-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#525252] hover:text-[#f97316] transition-colors"
                    >
                      details <ArrowRight className="w-3 h-3 text-[#f97316]" />
                    </Link>
                  </div>
                  <span className="text-[10px] text-[#a0a0a0] shrink-0" title={entry.date}>
                    {timeAgo(entry.date)}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-[#1a1a1a] mb-4 leading-snug">
                  {entry.title}
                </h3>

                {/* Highlights */}
                {entry.highlights.length > 0 && (
                  <section className="mb-4">
                    <header className="flex items-center gap-1.5 text-[10px] font-bold text-[#f97316] uppercase tracking-widest mb-2">
                      <Star className="w-3 h-3" /> What's New
                    </header>
                    <ul className="space-y-1.5">
                      {entry.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-[#525252] leading-relaxed">
                          <span className="text-[#f97316] mt-0.5 select-none shrink-0">+</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Fixes */}
                {entry.fixes.length > 0 && (
                  <section className="mb-4">
                    <header className="flex items-center gap-1.5 text-[10px] font-bold text-[#16a34a] uppercase tracking-widest mb-2">
                      <Wrench className="w-3 h-3" /> Fixes &amp; improvements
                    </header>
                    <ul className="space-y-1.5">
                      {entry.fixes.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-[#525252] leading-relaxed">
                          <span className="text-[#16a34a] mt-0.5 select-none shrink-0">·</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Commits */}
                {entry.commits.length > 0 && (
                  <section>
                    <header className="flex items-center gap-1.5 text-[10px] font-bold text-[#a0a0a0] uppercase tracking-widest mb-2">
                      <GitCommit className="w-3 h-3" /> Commits
                    </header>
                    <div className="flex flex-wrap gap-1.5">
                      {entry.commits.map((c, i) => (
                        <a
                          key={i}
                          href={`https://github.com/nextmavens/fidscript-whatsapp-api-console/commit/${c}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#f8f8f8] border border-[#e5e5e5] rounded text-[10px] font-mono text-[#525252] hover:text-[#f97316] hover:border-[#fed7aa] transition-colors"
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