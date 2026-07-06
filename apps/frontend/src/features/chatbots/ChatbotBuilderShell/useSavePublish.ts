import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotBuilderStore, clearDraft } from '../store/chatbotBuilderStore';
import { fetchApi } from '../../../services/api';
import type { PublishJob } from '../types';

export function useSavePublish(botId?: string, isEditMode?: boolean, clientToken?: string) {
  const navigate = useNavigate();
  const draft = useChatbotBuilderStore(s => s.draft);

  const buildPayload = () => ({
    name: draft.general.name,
    description: draft.general.description,
    instance_id: draft.instanceId,
    priority: draft.general.priority,
    enabled: draft.general.enabled,
    config_json: JSON.stringify({
      template: draft.general.template,
      audience: draft.audience,
      aiBrain: draft.aiBrain,
      knowledge: draft.knowledge,
      dataConnections: draft.dataConnections,
      tools: draft.tools,
      groups: draft.groups,
      handoff: draft.handoff,
    }),
  });

  const handleSave = useCallback(async () => {
    if (!draft.general.name.trim() || !clientToken) return;
    const method = isEditMode ? 'PUT' : 'POST';
    const path = isEditMode ? `/api/platform/chatbots/${botId}` : '/api/platform/chatbots';
    useChatbotBuilderStore.getState().setSaving(true);
    try {
      const res = await fetchApi(path, {
        method,
        headers: { Authorization: `Bearer ${clientToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      }) as { success: boolean };
      if (res.success) { clearDraft(botId); navigate('/client/chatbots'); }
    } finally {
      useChatbotBuilderStore.getState().setSaving(false);
    }
  }, [draft, isEditMode, botId, clientToken, navigate]);

  const handlePublish = useCallback(async (setPublishJob: (job: PublishJob | null) => void) => {
    if (!draft.general.name.trim() || !botId || !clientToken) return;
    useChatbotBuilderStore.getState().setSaving(true);
    try {
      const res = await fetchApi(`/api/platform/chatbots/${botId}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${clientToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft_json: JSON.stringify(draft) }),
      }) as { success: boolean; jobId?: string; error?: string };
      if (!res.success || !res.jobId) return;
      setPublishJob({
        id: res.jobId, status: 'pending', progress: 0,
        current_step: null, message: null, error: null, result_json: null,
        created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      });
    } finally {
      useChatbotBuilderStore.getState().setSaving(false);
    }
  }, [draft, botId, clientToken]);

  return { handleSave, handlePublish };
}
