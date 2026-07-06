import React from 'react';
import { Link } from 'react-router-dom';
import { GitCommit } from 'lucide-react';
import { CHANGELOG_DATA } from '../ChangelogList';

interface VersionContentProps {
  version: string;
}

export default function VersionContent({ version }: VersionContentProps) {
  const entry = CHANGELOG_DATA.entries.find((e) => e.version === version);
  if (!entry) return null;

  return (
    <>
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
    </>
  );
}
