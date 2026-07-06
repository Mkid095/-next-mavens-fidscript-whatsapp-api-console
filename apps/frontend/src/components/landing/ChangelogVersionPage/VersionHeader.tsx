import React from 'react';
import { ArrowLeft, ArrowRight, GitCommit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ChangelogEntry, CHANGELOG_DATA } from '../ChangelogList';

interface VersionHeaderProps {
  entry: ChangelogEntry;
  isLatest: boolean;
  prev: ChangelogEntry | null;
  next: ChangelogEntry | null;
}

export default function VersionHeader({ entry, isLatest, prev, next }: VersionHeaderProps) {
  return (
    <>
      <header className="mb-6">
        {isLatest && (
          <span className="inline-block px-2 py-0.5 bg-yellow-500 text-[#181711] text-[10px] font-bold rounded-full uppercase tracking-wider mb-2">
            Latest
          </span>
        )}
        <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">{entry.version}</h1>
        <p className="text-base text-[#a8a99e] leading-snug mb-3">{entry.title}</p>
        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          <span className="px-2 py-0.5 bg-[#1a1910] border border-[#262413] rounded-full text-[#8a886a]">
            {new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          {entry.bumpType && (
            <span className={`px-2 py-0.5 rounded-full font-mono uppercase ${
              entry.bumpType === 'major' ? 'bg-red-900/40 text-red-300 border border-red-900/50'
              : entry.bumpType === 'minor' ? 'bg-yellow-900/40 text-yellow-300 border border-yellow-900/50'
              : 'bg-green-900/40 text-green-300 border border-green-900/50'
            }`}>
              {entry.bumpType} bump
            </span>
          )}
          {entry.category && (
            <span className="px-2 py-0.5 bg-[#1a1910] border border-[#262413] rounded-full text-[#8a886a]">
              {entry.category}
            </span>
          )}
        </div>
      </header>

      {/* Prev/next nav */}
      <nav className="mt-10 grid sm:grid-cols-2 gap-3">
        {prev ? (
          <Link
            to={`/changelog/${encodeURIComponent(prev.version)}`}
            className="group flex flex-col gap-1 p-4 rounded-2xl border border-[#262413] hover:border-[#3d3a1e] bg-[#11110a] transition-colors"
          >
            <span className="text-[10px] uppercase tracking-wider text-[#6a6c5d] font-bold flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Older
            </span>
            <span className="text-sm font-bold text-[#cbd3cf] group-hover:text-yellow-500 transition-colors">
              {prev.version}
            </span>
            <span className="text-xs text-[#6a6c5d] truncate">{prev.title}</span>
          </Link>
        ) : <div />}
        {next ? (
          <Link
            to={`/changelog/${encodeURIComponent(next.version)}`}
            className="group flex flex-col gap-1 p-4 rounded-2xl border border-[#262413] hover:border-[#3d3a1e] bg-[#11110a] transition-colors text-right"
          >
            <span className="text-[10px] uppercase tracking-wider text-[#6a6c5d] font-bold flex items-center gap-1 justify-end">
              Newer <ArrowRight className="w-3 h-3" />
            </span>
            <span className="text-sm font-bold text-[#cbd3cf] group-hover:text-yellow-500 transition-colors">
              {next.version}
            </span>
            <span className="text-xs text-[#6a6c5d] truncate">{next.title}</span>
          </Link>
        ) : <div />}
      </nav>
    </>
  );
}
