import React from 'react';
import { CLIGuide } from './CLIGuideContent.js';
import { ToolsGuide } from './ToolsGuideContent.js';
import { BYOllmGuide } from './BYOllmGuideContent.js';

export function DocsCLIGuide({ id }: { id: string }) {
  if (id === 'cli') return <CLIGuide />;
  if (id === 'tools-integrations') return <ToolsGuide />;
  if (id === 'byo-llm') return <BYOllmGuide />;
  return null;
}

export default DocsCLIGuide;
