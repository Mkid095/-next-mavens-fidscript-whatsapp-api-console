import type { AudienceContactMode, ResponseScope, GroupMode, AIProvider, ToolDefinition, GroupSetting, HandoffTrigger, MemorySetting, KnowledgeSourceType, KnowledgeDraft, DataConnectionsDraft, ChatbotTemplate, AudienceDraft, AIBrainDraft, HandoffDraft, KnowledgeSource } from '../types';

export function buildInitEditData(botId: string, apiData: Record<string, unknown>) {
  let parsedConfig: Record<string, unknown> = {};
  try { const raw = apiData.config_json as string | undefined; if (raw?.trim()) parsedConfig = JSON.parse(raw); } catch { /* ignore */ }

  const aiCfg = ((apiData.aiConfig ?? []) as Array<Record<string, unknown>>)[0] ?? {};
  const knowledgeRows = (apiData.knowledge ?? []) as Array<{ id: string; source_type: string; content: string; status: string; chunk_count: number; name: string; ref: string }>;
  const ruleRows = (apiData.rules ?? []) as Array<{ id: string; name: string; conditions_json: string; action: string; action_config_json: string }>;
  const groupSettingRows = (apiData.groupSettings ?? []) as Array<{ group_jid: string; group_name: string; respond_when_mentioned: number; respond_to_all: number; silence_on_bot_reply: number; cooldown_seconds: number }>;
  const handoffRows = (apiData.handoffRules ?? []) as Array<{ id: string; conditions_json: string; target_team_id: string; target_team_name: string }>;
  const policy = ((apiData.policies ?? []) as Array<Record<string, unknown>>)[0] ?? {};

  const audienceFromConfig = (parsedConfig.audience ?? {}) as Partial<AudienceDraft>;
  const aiBrainFromConfig = (parsedConfig.aiBrain ?? {}) as Partial<AIBrainDraft>;
  const toolsFromConfig = (parsedConfig.tools ?? {}) as { tools: ToolDefinition[] };
  const groupsFromConfig = (parsedConfig.groups ?? {}) as { settings: GroupSetting[] };
  const handoffFromConfig = (parsedConfig.handoff ?? {}) as Partial<HandoffDraft>;

  const systemPrompt = (aiCfg.system_prompt as string) ?? (aiBrainFromConfig.systemPrompt as string) ?? '';
  const llmConnectionId = (aiCfg.llm_connection_id as string) ?? (aiBrainFromConfig.llmConnectionId as string) ?? '';
  const model = (aiCfg.model as string) ?? (aiBrainFromConfig.model as string) ?? '';
  const provider = (aiCfg.provider as string) ?? (aiBrainFromConfig.provider as string) ?? 'fidscript';

  return {
    id: botId,
    instanceId: (apiData.instance_id as string) ?? '',
    createdAt: (apiData.created_at as string) ?? '',
    general: {
      name: (apiData.name as string) ?? '',
      description: (apiData.description as string) ?? '',
      template: (parsedConfig.template as ChatbotTemplate) ?? 'custom',
      priority: (apiData.priority as number) ?? 50,
      enabled: Boolean(apiData.enabled),
    },
    audience: {
      contactMode: (audienceFromConfig.contactMode ?? 'everyone') as AudienceContactMode,
      responseScope: (audienceFromConfig.responseScope ?? 'all') as ResponseScope,
      tags: (audienceFromConfig.tags ?? []) as string[],
      contactIds: (audienceFromConfig.contactIds ?? []) as string[],
      priority: (audienceFromConfig.priority ?? 50) as number,
      groupMode: (audienceFromConfig.groupMode ?? 'disabled') as GroupMode,
      groupIds: (audienceFromConfig.groupIds ?? []) as string[],
      allowNewContacts: audienceFromConfig.allowNewContacts ?? true,
    },
    aiBrain: {
      provider: (provider as AIProvider),
      providerName: (aiBrainFromConfig.providerName ?? '') as string,
      baseUrl: (aiBrainFromConfig.baseUrl ?? '') as string,
      apiKey: (aiBrainFromConfig.apiKey ?? '') as string,
      apiFormat: (aiBrainFromConfig.apiFormat ?? 'chat_completions') as string,
      llmConnectionId,
      model,
      contextLength: (aiBrainFromConfig.contextLength ?? 4096) as number,
      maxOutputTokens: (aiBrainFromConfig.maxOutputTokens ?? 1024) as number,
      temperature: (aiBrainFromConfig.temperature ?? 0.7) as number,
      memorySettings: (aiBrainFromConfig.memorySettings ?? [
        { enabled: true, label: 'Customer names', description: 'Remember customer names across conversations' },
        { enabled: true, label: 'Preferences', description: 'Remember stated preferences & likes' },
        { enabled: false, label: 'Order history', description: 'Remember past orders & purchases' },
        { enabled: false, label: 'Custom attributes', description: 'Remember custom contact fields' },
      ]) as MemorySetting[],
      systemPrompt,
      hallucinationPolicy: ((aiCfg.hallucination_policy as string) ?? 'balanced') as 'strict' | 'balanced' | 'creative',
    },
    knowledge: {
      sources: knowledgeRows.length > 0
        ? knowledgeRows.map(k => ({ id: k.id, type: (k.source_type ?? 'text') as KnowledgeSourceType, name: k.name, status: (k.status ?? 'active') as KnowledgeSource['status'], chunkCount: k.chunk_count ?? 0, ref: k.ref ?? '', content: k.content ?? '', createdAt: '', updatedAt: '' }))
        : (parsedConfig.knowledge as KnowledgeDraft)?.sources ?? [],
    },
    dataConnections: (parsedConfig.dataConnections ?? { connections: [] }) as DataConnectionsDraft,
    tools: ruleRows.length > 0 ? { tools: ruleRows.map(r => { let actionConfig: Record<string, unknown> = {}; try { actionConfig = JSON.parse(r.action_config_json); } catch { /* ignore */ } return { id: r.id, name: r.name, description: r.conditions_json, type: 'webhook' as const, enabled: true, requireConfirmation: false, costUnits: 0, config: actionConfig } as ToolDefinition; }) } : (toolsFromConfig ?? { tools: [] }),
    groups: groupSettingRows.length > 0 ? { settings: groupSettingRows.map(g => ({ groupJid: g.group_jid, groupName: g.group_name ?? '', respondWhenMentioned: Boolean(g.respond_when_mentioned), respondToAll: Boolean(g.respond_to_all), silenceOnBotReply: Boolean(g.silence_on_bot_reply), cooldownSeconds: g.cooldown_seconds ?? 0 })) } : (groupsFromConfig ?? { settings: [] }),
    handoff: {
      triggers: handoffRows.length > 0 ? handoffRows.map(h => h.conditions_json).filter(Boolean) as HandoffTrigger[] : (handoffFromConfig.triggers ?? []),
      targetTeamId: (handoffFromConfig.targetTeamId ?? (handoffRows[0]?.target_team_id as string) ?? '') as string,
      targetTeamName: (handoffFromConfig.targetTeamName ?? (handoffRows[0]?.target_team_name as string) ?? '') as string,
      maxRetries: (handoffFromConfig.maxRetries ?? 3) as number,
      fallbackReply: (handoffFromConfig.fallbackReply ?? (policy.fallback_reply as string) ?? "I'm not sure I can help with that. Let me connect you with a team member.") as string,
    },
    test: { messages: [], testCases: [] },
    currentStep: 'setup',
    completedSteps: [],
    isDirty: false,
    isSaving: false,
    errors: {},
  };
}
