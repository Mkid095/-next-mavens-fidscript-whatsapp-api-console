import { useChatbotBuilderStore } from '../store/chatbotBuilderStore';

export function buildApiPayload(draft: ReturnType<typeof useChatbotBuilderStore.getState>['draft']): Record<string, unknown> {
  return {
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
  };
}
