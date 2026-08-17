/**
 * ChangelogVersionPage.tsx - single-version detail page.
 *
 * Renders /changelog/:version. Shows only the matching entry plus:
 *   - sticky version sidebar (all releases + filter)
 *   - prev/next release navigation
 *   - "back to all releases" link
 *
 * Falls back to a friendly not-found state for unknown versions.
 */
import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, GitCommit } from 'lucide-react';
import SeoHead from '../shared/SeoHead';
import Header from './Header';
import { ChangelogList, CHANGELOG_DATA } from './ChangelogList';

function findEntry(version: string) {
  return CHANGELOG_DATA.entries.find((e) => e.version === version);
}

export default function ChangelogVersionPage() {
  const [scrolled, setScrolled] = useState(false);
  const { version: rawVersion } = useParams<{ version: string }>();
  const version = rawVersion ? decodeURIComponent(rawVersion) : '';
  const entry = findEntry(version);

  const idx = CHANGELOG_DATA.entries.findIndex((e) => e.version === version);
  const prev = idx + 1 < CHANGELOG_DATA.entries.length ? CHANGELOG_DATA.entries[idx + 1] : null;
  const next = idx > 0 ? CHANGELOG_DATA.entries[idx - 1] : null;
  const isLatest = idx === 0;

  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] font-sans antialiased">
      <SeoHead
        title={`${entry ? entry.version : version} - Changelog - FIDScript`}
        description={entry ? `Release ${entry.version}: ${entry.title}` : `Release ${version}`}
        canonical={entry ? `/changelog/${encodeURIComponent(entry.version)}` : '/changelog'}
        schema="changelog"
        breadcrumbs={[
          { name: 'Changelog', url: '/changelog' },
          ...(entry ? [{ name: entry.version, url: `/changelog/${encodeURIComponent(entry.version)}` }] : []),
        ]}
      />

      <Header scrolled={scrolled} onScroll={() => setScrolled(window.scrollY > 10)} />

      {!entry ? (
        <NotFound version={version} />
      ) : (
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 flex gap-6 lg:gap-10">
          {/* Sidebar - version list */}
          <aside className="hidden md:block w-56 lg:w-64 shrink-0 sticky top-16 self-start max-h-[calc(100vh-5rem)] overflow-y-auto">
            <div className="text-[10px] font-bold text-[#a0a0a0] uppercase tracking-widest mb-3 flex items-center gap-2">
              <GitCommit className="w-3 h-3" /> All releases
            </div>
            <ol className="space-y-0.5">
              {CHANGELOG_DATA.entries.map((e, i) => {
                const active = e.version === entry.version;
                return (
                  <li key={e.version}>
                    <Link
                      to={`/changelog/${encodeURIComponent(e.version)}`}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                        active
                          ? 'bg-[#fff7ed] text-[#f97316] border border-[#fed7aa]'
                          : 'text-[#525252] hover:bg-[#f8f8f8] border border-transparent'
                      }`}
                    >
                      {active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f97316] shrink-0" />
                      )}
                      {!active && i === 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d4d4d4] shrink-0" />
                      )}
                      {!active && i !== 0 && (
                        <span className="w-1.5 h-1.5 shrink-0" />
                      )}
                      <span className="font-semibold">{e.version}</span>
                      {i === 0 && !active && (
                        <span className="ml-auto text-[9px] uppercase tracking-wider text-[#f97316]">latest</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ol>
          </aside>

          {/* Main content - just this entry */}
          <main className="flex-1 min-w-0 pt-4">
            <header className="mb-6">
              {isLatest && (
                <span className="inline-block px-2 py-0.5 bg-[#f97316] text-white text-[10px] font-bold rounded-full uppercase tracking-wider mb-2">
                  Latest
                </span>
              )}
              <h1 className="text-3xl md:text-4xl font-bold text-[#1a1a1a] tracking-tight mb-2">{entry.version}</h1>
              <p className="text-base text-[#525252] leading-snug mb-3">{entry.title}</p>
              <div className="flex flex-wrap items-center gap-2 text-[10px]">
                <span className="px-2 py-0.5 bg-[#f8f8f8] border border-[#e5e5e5] rounded-full text-[#525252]">
                  {new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                {entry.bumpType && (
                  <span className={`px-2 py-0.5 rounded-full font-mono uppercase text-[10px] ${
                    entry.bumpType === 'major' ? 'bg-red-50 text-red-500 border border-red-200'
                    : entry.bumpType === 'minor' ? 'bg-orange-50 text-orange-500 border border-orange-200'
                    : 'bg-green-50 text-green-600 border border-green-200'
                  }`}>
                    {entry.bumpType} bump
                  </span>
                )}
                {entry.category && (
                  <span className="px-2 py-0.5 bg-[#f8f8f8] border border-[#e5e5e5] rounded-full text-[#525252]">
                    {entry.category}
                  </span>
                )}
              </div>
            </header>

            {/* Render this single entry using the shared timeline renderer with limit=1 */}
            <ChangelogList limit={1} />

            {/* Prev/next nav */}
            <nav className="mt-10 grid sm:grid-cols-2 gap-3">
              {prev ? (
                <Link
                  to={`/changelog/${encodeURIComponent(prev.version)}`}
                  className="group flex flex-col gap-1 p-4 rounded-2xl border border-[#e5e5e5] hover:border-[#fed7aa] bg-white transition-colors"
                >
                  <span className="text-[10px] uppercase tracking-wider text-[#a0a0a0] font-bold flex items-center gap-1">
                    <ArrowLeft className="w-3 h-3" /> Older
                  </span>
                  <span className="text-sm font-bold text-[#1a1a1a] group-hover:text-[#f97316] transition-colors">
                    {prev.version}
                  </span>
                  <span className="text-xs text-[#a0a0a0] truncate">{prev.title}</span>
                </Link>
              ) : <div />}
              {next ? (
                <Link
                  to={`/changelog/${encodeURIComponent(next.version)}`}
                  className="group flex flex-col gap-1 p-4 rounded-2xl border border-[#e5e5e5] hover:border-[#fed7aa] bg-white transition-colors text-right"
                >
                  <span className="text-[10px] uppercase tracking-wider text-[#a0a0a0] font-bold flex items-center gap-1 justify-end">
                    Newer <ArrowRight className="w-3 h-3" />
                  </span>
                  <span className="text-sm font-bold text-[#1a1a1a] group-hover:text-[#f97316] transition-colors">
                    {next.version}
                  </span>
                  <span className="text-xs text-[#a0a0a0] truncate">{next.title}</span>
                </Link>
              ) : <div />}
            </nav>
          </main>
        </div>
      )}
    </div>
  );
}

function NotFound({ version }: { version: string }) {
  const closest = CHANGELOG_DATA.entries[0]?.version;
  return (
    <div className="min-h-screen bg-white text-[#1a1a1a] font-sans antialiased flex flex-col">
      <Header scrolled={false} onScroll={() => {}} />
      <main className="max-w-2xl mx-auto px-4 py-24 text-center flex-1">
        <p className="text-[10px] uppercase tracking-widest text-[#a0a0a0] font-bold mb-3">404 - version not found</p>
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-3">
          We couldn't find <code className="font-mono text-[#f97316]">{version || 'this version'}</code>
        </h1>
        <p className="text-sm text-[#525252] mb-6">
          This release isn't in our changelog. It may not have been published yet, or the version string
          is misspelled.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/changelog"
            className="px-4 py-2 bg-[#f97316] hover:bg-[#fb923c] text-white text-sm font-bold rounded-full transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> All releases
          </Link>
          {closest && (
            <Link
              to={`/changelog/${encodeURIComponent(closest)}`}
              className="px-4 py-2 bg-white border border-[#e5e5e5] hover:border-[#fed7aa] text-[#1a1a1a] text-sm font-bold rounded-full transition-colors"
            >
              View {closest}
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
