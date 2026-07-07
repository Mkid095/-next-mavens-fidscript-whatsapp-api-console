import React from 'react';
import { Brain } from 'lucide-react';
import { ProviderSelector } from './ProviderSelector';
import { ModelSelector } from './ModelSelector';
import { MemorySettings } from './MemorySettings';
import { SystemPromptEditor } from './SystemPromptEditor';
import { AdvancedSettings } from './AdvancedSettings';
import { KnowledgeBoundary } from './KnowledgeBoundary';

export default function AIBrainStep() {
  return (
    <div className="space-y-8">
      <ProviderSelector />
      <ModelSelector />
      <MemorySettings />
      <SystemPromptEditor />
      <AdvancedSettings />
      <KnowledgeBoundary />
    </div>
  );
}
