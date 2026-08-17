import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Wrench, GitCommit, ArrowRight, Star } from 'lucide-react';
import { timeAgo, formatLongDate } from './changelogDateUtils';

export interface ChangelogEntry {
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

interface ChangelogItemMainProps {
  entry: ChangelogEntry;
  isLatest: boolean;
  index: number;
  mounted: boolean;
}

export function ChangelogItemMain({ entry, isLatest, index, mounted }: ChangelogItemMainProps) {
  return (
    <motion.article
      initial={mounted ? { opacity: 0, y: 16 } : false}
      animate={mounted ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.35, delay: index * 0.04 }}
      className="relative pl-11"
    >
      <div className={`absolute left-2 top-5 w-4 h-4 rounded-full border-2 ${
        isLatest
          ? 'bg-[#f97316] border-[#f97316]'
          : 'bg-white border-[#e5e5e5]'
      }`} />

      <div className={`bg-white border rounded-2xl p-5 ${
        isLatest ? 'border-[#f97316]/30' : 'border-[#e5e5e5]'
      }`}>
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
            <Link to={`/changelog/${encodeURIComponent(entry.version)}`}
              className="ml-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#525252] hover:text-[#f97316] transition-colors">
              details <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <span className="text-[10px] text-[#a0a0a0] shrink-0" title={entry.date}>
            {timeAgo(entry.date)}
          </span>
        </div>

        <h3 className="text-base font-semibold text-[#1a1a1a] mb-4 leading-snug">{entry.title}</h3>

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

        {entry.commits.length > 0 && (
          <section>
            <header className="flex items-center gap-1.5 text-[10px] font-bold text-[#a0a0a0] uppercase tracking-widest mb-2">
              <GitCommit className="w-3 h-3" /> Commits
            </header>
            <div className="flex flex-wrap gap-1.5">
              {entry.commits.map((c, i) => (
                <a key={i}
                  href={`https://github.com/nextmavens/fidscript-whatsapp-api-console/commit/${c}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#f8f8f8] border border-[#e5e5e5] rounded text-[10px] font-mono text-[#525252] hover:text-[#f97316] hover:border-[#fed7aa] transition-colors">
                  <GitCommit className="w-2.5 h-2.5" /> {c.slice(0, 7)}
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </motion.article>
  );
}
