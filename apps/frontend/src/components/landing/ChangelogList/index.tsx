/**
 * ChangelogList — thin shell that renders the full changelog timeline.
 *
 * Used by both:
 *  - ChangelogPage.tsx (the standalone /changelog page)
 *  - DocsPage.tsx       (the embedded "changelog" tab inside the docs UI)
 */
import React, { useEffect, useState } from 'react';
import changelogData from '../../../data/changelog.json';
import { ChangelogItem } from './ChangelogItem.js';

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
        {entries.map((entry, idx) => (
          <ChangelogItem
            key={entry.version}
            entry={entry}
            isLatest={idx === 0}
            index={idx}
            mounted={mounted}
          />
        ))}
      </div>
    </div>
  );
}

/** Public so other components can render summary stats (e.g. on landing page). */
export const CHANGELOG_DATA = data;
