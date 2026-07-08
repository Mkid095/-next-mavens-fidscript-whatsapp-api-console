import { useChatbotBuilderStore } from '../store/chatbotBuilderStore';

/**
 * Build the PUT /api/platform/chatbots payload for `updateChatbot`.
 *
 * The backend (`chatbotCrudHandlers/handlers.ts:107`) only persists a few
 * top-level columns on chatbot_configs plus the entire `config_json` blob.
 * Sub-resources (triggers, rules, AI config, group settings, handoff rules)
 * are written to their dedicated tables ONLY when the publish pipeline runs
 * (POST /:id/publish). For "Save without Publish" to round-trip, we therefore
 * store the audience + non-tabular fields in `config_json` and read them back
 * via `loadBot` in ChatbotBuilderShellMain.
 */
export function buildApiPayload(draft: ReturnType<typeof useChatbotBuilderStore.getState>['draft']): Record<string, unknown> {
  return {
    name: draft.general.name,
    description: draft.general.description,
    instance_id: draft.instanceId,
    priority: draft.general.priority,
    enabled: draft.general.enabled,
    config_json: JSON.stringify({
      template: draft.general.template,
      // Audience fields stored at top of config_json so loadBot can read them
      // back without a dedicated column.
      contact_mode: draft.audience.contactMode,
      group_mode: draft.audience.groupMode,
      tags: draft.audience.tags,
      contact_ids: draft.audience.contactIds,
      group_ids: draft.audience.groupIds,
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