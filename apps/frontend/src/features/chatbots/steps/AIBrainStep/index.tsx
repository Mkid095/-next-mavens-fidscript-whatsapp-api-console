/**
 * AIBrainStep — Step 3 of the Chatbot Builder.
 *
 * Sections:
 * - Provider: FIDScript defaults (shared by admin) vs Your Connections (BYOK)
 * - Model: Select model with context info
 * - Memory: Toggle memory capabilities (user-friendly labels)
 * - System Prompt: Write the bot's personality/instructions
 * - Response Settings: Temperature, hallucination policy (user-friendly)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useChatbotBuilderStore } from '../../store/chatbotBuilderStore';
import type { AIProvider } from '../../types';
import { fetchApi } from '../../../../data/api/client.js';
import ProviderSection from './LLMSelector';
import ModelSelector from './ModelSelector';
import MemorySettings from './MemorySettings';
import SystemPromptEditor from './SystemPromptEditor';
import AdvancedSettings from './AdvancedSettings';
import KnowledgeBoundary from './KnowledgeBoundary';
import type { SharedProvider, WorkspaceConnection, ProviderModel } from './types';

export default function AIBrainStep() {
  const { draft, updateAIBrain } = useChatbotBuilderStore();
  const { aiBrain } = draft;

  const [sharedProviders, setSharedProviders] = useState<SharedProvider[]>([]);
  const [connections, setConnections] = useState<WorkspaceConnection[]>([]);
  const [models, setModels] = useState<ProviderModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(true);

  // Load FIDScript shared providers + workspace connections
  useEffect(() => {
    (async () => {
      try {
        const [sharedRes, connRes] = await Promise.all([
          fetchApi<SharedProvider[]>('/api/platform/llm-connections/available-providers'),
          fetchApi<WorkspaceConnection[]>('/api/platform/llm-connections'),
        ]);
        if (sharedRes.success && sharedRes.data) setSharedProviders(sharedRes.data);
        if (connRes.success && connRes.data) setConnections(connRes.data.filter((c) => c.enabled));
      } catch { /* ignore */ } finally {
        setLoadingProviders(false);
      }
    })();
  }, []);

  // Load models when a shared provider is selected
  const loadModels = useCallback(async (providerRegistryId: string) => {
    if (!providerRegistryId) { setModels([]); return; }
    setLoadingModels(true);
    try {
      const res = await fetchApi<ProviderModel[]>(`/api/platform/llm-connections/available-providers/${providerRegistryId}/models`);
      if (res.success && res.data) setModels(res.data);
    } catch { /* ignore */ } finally { setLoadingModels(false); }
  }, []);

  const selectSharedProvider = (sp: SharedProvider) => {
    updateAIBrain({ provider: 'fidscript' as AIProvider, providerName: sp.name, baseUrl: sp.base_url, llmConnectionId: sp.id, model: '' });
    loadModels(sp.id);
  };

  const selectConnection = (conn: WorkspaceConnection) => {
    updateAIBrain({ provider: (conn.provider || 'custom') as AIProvider, providerName: conn.name, baseUrl: conn.endpoint, llmConnectionId: conn.id, model: conn.model || '' });
    setModels([]);
  };

  const selectedSharedProvider = sharedProviders.find((p) => p.id === aiBrain.llmConnectionId);
  const selectedConnection = connections.find((c) => c.id === aiBrain.llmConnectionId);
  const isUsingShared = aiBrain.provider === 'fidscript' && !!selectedSharedProvider;

  return (
    <div className="space-y-8">
      {loadingProviders ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-[#6e684a]" />
        </div>
      ) : (
        <>
          <ProviderSection
            sharedProviders={sharedProviders}
            connections={connections}
            isUsingShared={isUsingShared}
            selectedSharedProvider={selectedSharedProvider}
            selectedConnection={selectedConnection}
            onSharedSelect={selectSharedProvider}
            onConnectionSelect={selectConnection}
          />

          <ModelSelector
            models={models}
            loadingModels={loadingModels}
            isUsingShared={isUsingShared}
            selectedConnection={selectedConnection}
            onModelChange={(model, contextLength) => updateAIBrain({ model, contextLength })}
          />
        </>
      )}

      <MemorySettings />
      <SystemPromptEditor />
      <AdvancedSettings />
      <KnowledgeBoundary />
    </div>
  );
}
