/**
 * ChangelogVersionPage — single-version detail page.
 *
 * Renders /changelog/:version. Shows only the matching entry plus:
 *   - sticky version sidebar (all releases + filter)
 *   - prev/next release navigation
 *   - "back to all releases" link
 *
 * Falls back to a friendly not-found state for unknown versions.
 */
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, GitCommit } from 'lucide-react';
import SeoHead from '../../shared/SeoHead';
import { ChangelogList, CHANGELOG_DATA } from '../ChangelogList';
import VersionHeader from './VersionHeader';

function findEntry(version: string) {
  return CHANGELOG_DATA.entries.find((e) => e.version === version);
}

function NotFound({ version }: { version: string }) {
  const closest = CHANGELOG_DATA.entries[0]?.version;
  return (
    <div className="min-h-screen bg-[#0c0b06] text-[#cbd3cf] font-suisse-intl antialiased">
      <SeoHead
        title={`${version || 'Unknown version'} — Changelog`}
        description={`Release ${version} not found`}
        canonical="/changelog"
      />
      <main className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-[10px] uppercase tracking-widest text-[#6a6c5d] font-bold mb-3">404 — version not found</p>
        <h1 className="text-2xl font-bold text-white mb-3">
          We couldn't find <code className="font-mono text-yellow-500">{version || 'this version'}</code>
        </h1>
        <p className="text-sm text-[#8a886a] mb-6">
          This release isn't in our changelog. It may not have been published yet, or the version string
          is misspelled.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/changelog"
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-[#181711] text-sm font-bold rounded-xl transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> All releases
          </Link>
          {closest && (
            <Link
              to={`/changelog/${encodeURIComponent(closest)}`}
              className="px-4 py-2 bg-[#1a1915] border border-[#2d2813] hover:border-[#3d3a1e] text-sm font-bold rounded-xl transition-colors"
            >
              View {closest}
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}

export default function ChangelogVersionPage() {
  const { version: rawVersion } = useParams<{ version: string }>();
  const version = rawVersion ? decodeURIComponent(rawVersion) : '';
  const entry = findEntry(version);

  if (!entry) {
    return <NotFound version={version} />;
  }

  const idx = CHANGELOG_DATA.entries.findIndex((e) => e.version === version);
  const prev = idx + 1 < CHANGELOG_DATA.entries.length ? CHANGELOG_DATA.entries[idx + 1] : null;
  const next = idx > 0 ? CHANGELOG_DATA.entries[idx - 1] : null;
  const isLatest = idx === 0;

  return (
    <div className="min-h-screen bg-[#0c0b06] text-[#cbd3cf] font-suisse-intl antialiased">
      <SeoHead
        title={`${entry.version} — Changelog — FIDScript`}
        description={`Release ${entry.version}: ${entry.title}`}
        canonical={`/changelog/${encodeURIComponent(entry.version)}`}
        schema="changelog"
        breadcrumbs={[
          { name: 'Changelog', url: '/changelog' },
          { name: entry.version, url: `/changelog/${encodeURIComponent(entry.version)}` },
        ]}
      />

      <header className="sticky top-0 z-50 bg-[#0c0b06]/95 backdrop-blur-lg border-b border-[#262413]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link
            to="/changelog"
            className="flex items-center gap-1.5 text-xs text-[#8a886a] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> All releases
          </Link>
          <span className="ml-auto text-xs text-[#6a6c5d] font-mono">{CHANGELOG_DATA.entries.length} releases</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 flex gap-6 lg:gap-10">
        {/* Sidebar — version list */}
        <aside className="hidden md:block w-56 lg:w-64 shrink-0 sticky top-16 self-start max-h-[calc(100vh-5rem)] overflow-y-auto">
          <div className="text-[10px] font-bold text-[#6a6c5d] uppercase tracking-widest mb-3 flex items-center gap-2">
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
                        ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30'
                        : 'text-[#a8a99e] hover:bg-[#181711] border border-transparent'
                    }`}
                  >
                    {active && (
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />
                    )}
                    {!active && i === 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6e6c5d] shrink-0" />
                    )}
                    <span className="font-bold">{e.version}</span>
                    {i === 0 && !active && (
                      <span className="ml-auto text-[9px] uppercase tracking-wider text-yellow-500">latest</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ol>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          <VersionHeader entry={entry} isLatest={isLatest} prev={prev} next={next} />

          {/* Render this single entry using the shared timeline renderer with limit=1 */}
          <ChangelogList limit={1} />
        </main>
      </div>
    </div>
  );
}
