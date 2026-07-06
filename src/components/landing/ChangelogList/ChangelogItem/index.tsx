import React from 'react';
import { ChangelogItemMain, type ChangelogEntry } from './ChangelogItemMain';

interface ChangelogItemProps {
  entry: ChangelogEntry;
  isLatest: boolean;
  index: number;
  mounted: boolean;
}

export function ChangelogItem(props: ChangelogItemProps) {
  return <ChangelogItemMain {...props} />;
}

export type { ChangelogEntry };
