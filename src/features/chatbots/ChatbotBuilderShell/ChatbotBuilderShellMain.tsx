/**
 * ChatbotBuilderShellMain — step navigation, layout orchestration, and core logic.
 * The steps themselves are rendered here; the sidebar and toolbar are extracted components.
 */
import React, { useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  useChatbotBuilderStore,
  scheduleAutosave,
  restoreDraft,
  clearDraft,
} from '../store/chatbotBuilderStore';
import {
  BUILDER_STEPS,
  type BuilderStepId,
  type PublishJob,
  type AudienceContactMode,
  type GroupMode,
  type AIProvider,
  type ToolDefinition,
  type GroupSetting,
  type HandoffTrigger,
} from '../types';
import PublishProgressScreen from '../components/PublishProgressScreen';
import GeneralStep from '../steps/GeneralStep';
import AudienceStep from '../steps/AudienceStep';
import AIBrainStep from '../steps/AIBrainStep';
import KnowledgeStep from '../steps/KnowledgeStep';
import DataConnectionsStep from '../steps/DataConnectionsStep';
import ToolsStep from '../steps/ToolsStep';
import GroupsStep from '../steps/GroupsStep';
import HandoffStep from '../steps/HandoffStep';
import TestStep from '../steps/TestStep';
import AnalyticsStep from '../steps/AnalyticsStep';
import { fetchApi } from '../../../services/api';
import { buildApiPayload } from './buildApiPayload';
import StepNavigator from './StepNavigator';
import BuilderToolbar from './BuilderToolbar';

const STEP_COMPONENTS: Record<BuilderStepId, React.ComponentType> = {
  'general':           GeneralStep,
  'audience':          AudienceStep,
  'ai-brain':          AIBrainStep,
  'knowledge':         KnowledgeStep,
  'data-connections':  DataConnectionsStep,
  'tools':             ToolsStep,
  'groups':            GroupsStep,
  'handoff':           HandoffStep,
  'test':              TestStep,
  'analytics':         AnalyticsStep,
};

interface ChatbotBuilderShellMainProps {
  clientToken: string;
  instances: { id: string; name: string }[];
}

export default function ChatbotBuilderShellMain({ clientToken, instances }: ChatbotBuilderShellMainProps) {
  const navigate = useNavigate();
  const { id: botId } = useParams<{ id: string }>();
  const isEditMode = Boolean(botId);
  const hasLoadedRef = useRef(false);

  // Expose botId + clientToken to all step components via the store
  useEffect(() => {
    useChatbotBuilderStore.setState({ botId: botId ?? null, clientToken });
  }, [botId, clientToken]);

  const draft = useChatbotBuilderStore(s => s.draft);
  const goToStep = useChatbotBuilderStore(s => s.goToStep);
  const goNext = useChatbotBuilderStore(s => s.goNext);
  const goPrevious = useChatbotBuilderStore(s => s.goPrevious);
  const canAdvanceFrom = useChatbotBuilderStore(s => s.canAdvanceFrom);
  const isStepCompleted = useChatbotBuilderStore(s => s.isStepCompleted);
  const initNew = useChatbotBuilderStore(s => s.initNew);
  const initEdit = useChatbotBuilderStore(s => s.initEdit);
  const isFirstStep = useChatbotBuilderStore(s => s.isFirstStep);
  const isLastStep = useChatbotBuilderStore(s => s.isLastStep);
  const getCurrentStepIndex = useChatbotBuilderStore(s => s.getCurrentStepIndex);
  const getProgress = useChatbotBuilderStore(s => s.getProgress);

  const [isLoading, setIsLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = React.useState(false);
  const [publishJob, setPublishJob] = React.useState<PublishJob | null>(null);
  const [publishError, setPublishError] = React.useState<string | null>(null);

  // ── Load existing bot or restore draft ──────────────────────────────────

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadBot = async () => {
      if (isEditMode && botId) {
        const restored = restoreDraft(botId);
        if (restored) {
          initEdit(restored);
          return;
        }

        setIsLoading(true);
        setLoadError(null);
        try {
          const res = await fetchApi(`/api/platform/chatbots/${botId}`, {
            headers: { Authorization: `Bearer ${clientToken}` },
          }) as { success: boolean; data: Record<string, unknown> };

          if (res.success && res.data) {
            const apiData = res.data as Record<string, any>;
            // Backend shape (apps/api/src/routes/platform/chatbotCrudHandlers/handlers.ts:80):
            //   { ...bot, aiConfig[0], capabilities[], triggers[], rules[], policies[0],
            //     handoffRules[], groupSettings[] }
            // Fields that have no dedicated column (tags, contact_ids, group_ids,
            // group_mode, contact_mode) live in the `config_json` blob on chatbot_configs.
            const aiConfig = Array.isArray(apiData.aiConfig) ? (apiData.aiConfig[0] ?? {}) : (apiData.aiConfig ?? {});
            const triggers = Array.isArray(apiData.triggers) ? apiData.triggers : [];
            const rules = Array.isArray(apiData.rules) ? apiData.rules : [];
            const policies = Array.isArray(apiData.policies) ? (apiData.policies[0] ?? {}) : (apiData.policies ?? {});
            const handoffRules = Array.isArray(apiData.handoffRules) ? apiData.handoffRules : [];
            const groupSettings = Array.isArray(apiData.groupSettings) ? apiData.groupSettings : [];

            // config_json holds the audience fields that have no dedicated column.
            let configJson: Record<string, any> = {};
            try {
              configJson = apiData.config_json ? (JSON.parse(apiData.config_json as string) as Record<string, any>) : {};
            } catch { configJson = {}; }

            initEdit({
              id: botId,
              instanceId: (apiData.instance_id as string) ?? '',
              createdAt: (apiData.created_at as string) ?? '',
              general: {
                name: (apiData.name as string) ?? '',
                description: (apiData.description as string) ?? '',
                template: 'custom',
                priority: Number(apiData.priority ?? 50),
                enabled: Boolean(apiData.enabled),
              },
              audience: {
                contactMode: (configJson.contact_mode as AudienceContactMode) ?? 'everyone',
                tags: Array.isArray(configJson.tags) ? (configJson.tags as string[]) : [],
                contactIds: Array.isArray(configJson.contact_ids) ? (configJson.contact_ids as string[]) : [],
                priority: Number(apiData.priority ?? 50),
                groupMode: (configJson.group_mode as GroupMode) ?? 'disabled',
                groupIds: Array.isArray(configJson.group_ids) ? (configJson.group_ids as string[]) : [],
              },
              aiBrain: {
                provider: ((aiConfig.provider as string) ?? 'fidscript') as AIProvider,
                providerName: (aiConfig.provider_name as string) ?? '',
                baseUrl: (aiConfig.base_url as string) ?? '',
                apiKey: (aiConfig.api_key as string) ?? '',
                apiFormat: (aiConfig.api_format as string) ?? 'chat_completions',
                llmConnectionId: (aiConfig.llm_connection_id as string) ?? '',
                model: (aiConfig.model as string) ?? 'gemini-2.0-flash',
                contextLength: (aiConfig.context_length as number) ?? 4096,
                maxOutputTokens: (aiConfig.max_output_tokens as number) ?? 1024,
                temperature: (aiConfig.temperature as number) ?? 0.7,
                memorySettings: [
                  { enabled: true,  label: 'Customer names',    description: 'Remember customer names across conversations' },
                  { enabled: true,  label: 'Preferences',       description: 'Remember stated preferences & likes' },
                  { enabled: false, label: 'Order history',     description: 'Remember past orders & purchases' },
                  { enabled: false, label: 'Custom attributes', description: 'Remember custom contact fields' },
                ],
                systemPrompt: (aiConfig.system_prompt as string) ?? (aiConfig.prompt as string) ?? '',
                hallucinationPolicy: ((aiConfig.hallucination_policy as string) ?? 'balanced') as 'strict' | 'balanced' | 'creative',
              },
              knowledge: { sources: (apiData.knowledge_sources as Array<never>) ?? [] },
              dataConnections: { connections: (apiData.data_connections as Array<never>) ?? [] },
              tools: {
                tools: rules.map((r: any) => ({
                  id: r.id,
                  name: r.name,
                  description: r.conditions ?? r.condition ?? '',
                  type: 'webhook' as const,
                  enabled: Boolean(r.enabled),
                  requireConfirmation: false,
                  costUnits: 0,
                  config: { url: '', method: 'POST', headers: {}, body: r.action_config_json ? (() => { try { return JSON.parse(r.action_config_json); } catch { return {}; } })() : {} },
                })) as ToolDefinition[],
              },
              groups: {
                settings: groupSettings.map((gs: any) => ({
                  groupJid: gs.group_jid ?? '',
                  groupName: gs.group_name ?? '',
                  respondWhenMentioned: Boolean(gs.respond_when_mentioned),
                  respondToAll: Boolean(gs.respond_to_all),
                  silenceOnBotReply: Boolean(gs.silence_on_bot_reply),
                  cooldownSeconds: Number(gs.cooldown_seconds ?? 0),
                })) as GroupSetting[],
              },
              handoff: {
                triggers: handoffRules.map((h: any) => {
                  let conds: any = [];
                  try { conds = h.conditions_json ? JSON.parse(h.conditions_json) : []; } catch { conds = []; }
                  return { type: 'keyword', value: h.name ?? '', condition: Array.isArray(conds) && conds[0]?.value ? String(conds[0].value) : '' } as HandoffTrigger;
                }),
                targetTeamId: (handoffRules[0]?.target_team_id as string) ?? '',
                targetTeamName: (handoffRules[0]?.target_team_name as string) ?? '',
                maxRetries: Number(policies.max_retries ?? 3),
                fallbackReply: (policies.fallback_reply as string) ?? "I'm not sure I can help with that. Let me connect you with a team member.",
              },
              test: { messages: [], testCases: [] },
              currentStep: 'general',
              completedSteps: [],
              isDirty: false,
              isSaving: false,
              errors: {},
            });
          } else {
            setLoadError('Failed to load chatbot');
          }
        } catch (err) {
          setLoadError(String(err));
        } finally {
          setIsLoading(false);
        }
      } else {
        const restored = restoreDraft();
        if (restored) {
          initEdit(restored);
        } else {
          initNew(instances[0]?.id ?? '');
        }
      }
    };

    loadBot();
  }, [botId, isEditMode, clientToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Deep linking: sync URL param → currentStep ───────────────────────────

  const isNavigatingRef = useRef(false);
  useEffect(() => {
    if (isNavigatingRef.current) return;
    const step = new URLSearchParams(window.location.search).get('step') as BuilderStepId | null;
    if (step && BUILDER_STEPS.some(s => s.id === step) && step !== draft.currentStep) {
      isNavigatingRef.current = true;
      goToStep(step);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Autosave on draft changes ────────────────────────────────────────────

  useEffect(() => {
    if (draft.isDirty && !draft.isSaving) {
      scheduleAutosave(clientToken, 2000);
    }
  }, [draft, clientToken]);

  // ── Update URL when step changes ─────────────────────────────────────────

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('step', draft.currentStep);
    window.history.replaceState({}, '', url.toString());
  }, [draft.currentStep]);

  // ── Unsaved changes protection ──────────────────────────────────────────

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (draft.isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [draft.isDirty]);

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!draft.general.name.trim()) return;

    const payload = buildApiPayload(draft);
    const method = isEditMode ? 'PUT' : 'POST';
    const path = isEditMode ? `/api/platform/chatbots/${botId}` : '/api/platform/chatbots';

    useChatbotBuilderStore.getState().setSaving(true);
    try {
      const res = await fetchApi(path, {
        method,
        headers: { Authorization: `Bearer ${clientToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }) as { success: boolean; data?: { id: string } };

      if (res.success) {
        clearDraft(botId);
        navigate('/client/chatbots');
      }
    } finally {
      useChatbotBuilderStore.getState().setSaving(false);
    }
  }, [draft, isEditMode, botId, clientToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Publish ───────────────────────────────────────────────────────────────

  const handlePublish = useCallback(async () => {
    if (!draft.general.name.trim() || !botId) return;

    setPublishError(null);
    useChatbotBuilderStore.getState().setSaving(true);
    try {
      const res = await fetchApi(`/api/platform/chatbots/${botId}/publish`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${clientToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft_json: JSON.stringify(draft) }),
      }) as { success: boolean; jobId?: string; error?: string };

      if (!res.success || !res.jobId) {
        setPublishError(res.error ?? 'Failed to start publish');
        return;
      }

      setPublishJob({
        id: res.jobId,
        status: 'pending',
        progress: 0,
        current_step: null,
        message: null,
        error: null,
        result_json: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } finally {
      useChatbotBuilderStore.getState().setSaving(false);
    }
  }, [draft, botId, clientToken]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard navigation ──────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (draft.isDirty) setShowLeaveConfirm(true);
        else navigate('/client/chatbots');
      }
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        if (isLastStep()) handlePublish();
        else handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [draft.isDirty, isLastStep, handlePublish, handleSave, navigate]);

  // ── Poll publish job ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!publishJob) return;
    if (publishJob.status === 'done' || publishJob.status === 'failed') return;

    const poll = async () => {
      try {
        const res = await fetchApi(
          `/api/platform/chatbot-drafts/publish-jobs/${publishJob.id}`,
          { headers: { Authorization: `Bearer ${clientToken}` } }
        ) as { success: boolean; data: PublishJob };

        if (res.success && res.data) {
          setPublishJob(res.data);
        }
      } catch {
        // Keep polling on error
      }
    };

    const interval = setInterval(poll, 1500);
    return () => clearInterval(interval);
  }, [publishJob, clientToken]);

  // ── Render ───────────────────────────────────────────────────────────────

  const StepComponent = STEP_COMPONENTS[draft.currentStep] ?? GeneralStep;
  const currentStepMeta = BUILDER_STEPS.find(s => s.id === draft.currentStep)!;
  const currentIndex = getCurrentStepIndex();
  const progress = getProgress();
  const canGoNext = canAdvanceFrom(draft.currentStep);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <AlertTriangle className="w-10 h-10 text-red-400" />
        <p className="text-white font-semibold">Failed to load chatbot</p>
        <p className="text-[#8f834a] text-sm">{loadError}</p>
        <button onClick={() => navigate('/client/chatbots')} className="text-yellow-400 text-sm underline">
          Back to Chatbots
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
      {/* ── Left Sidebar: Step Navigation ─────────────────────────────── */}
      <StepNavigator isEditMode={isEditMode} />

      {/* ── Main Content Area ─────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Step header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-[#6e684a] text-xs mb-2">
              <span className="font-mono">Step {currentIndex + 1} of {BUILDER_STEPS.length}</span>
              <span>·</span>
              <span>{currentStepMeta.label}</span>
            </div>
            <h1 className="text-2xl font-bold text-white">{currentStepMeta.label}</h1>
            <p className="text-[#8f834a] text-sm mt-1">{currentStepMeta.description}</p>
          </div>

          {/* Step content */}
          <div className="bg-[#1a1915] border border-[#2d2813] rounded-2xl p-6 mb-24">
            <StepComponent />
          </div>
        </div>
      </main>

      {/* ── Bottom Navigation Bar ─────────────────────────────────────── */}
      <BuilderToolbar
        isEditMode={isEditMode}
        onSave={handleSave}
        onPublish={handlePublish}
        onGoNext={goNext}
        onGoPrevious={goPrevious}
        canGoNext={canGoNext}
        publishJob={publishJob}
        publishError={publishError}
      />

      {/* ── Publish Progress Overlay ───────────────────────────────────── */}
      {publishJob && (
        <PublishProgressScreen
          job={publishJob}
          onClose={() => setPublishJob(null)}
          onViewChatbot={() => navigate('/client/chatbots')}
          onRetry={handlePublish}
        />
      )}

      {/* ── Leave Confirmation Modal ──────────────────────────────────── */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a1915] border border-[#2d2813] rounded-2xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-yellow-400 shrink-0" />
              <h3 className="text-white font-bold">Unsaved Changes</h3>
            </div>
            <p className="text-[#8f834a] text-sm">
              You have unsaved changes. Are you sure you want to leave? Your progress has been autosaved as a draft.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 px-4 py-2 bg-[#2d2813] hover:bg-[#3d3823] text-white rounded-xl text-xs font-semibold transition"
              >
                Keep Editing
              </button>
              <button
                onClick={() => {
                  setShowLeaveConfirm(false);
                  clearDraft(botId ?? undefined);
                  navigate('/client/chatbots');
                }}
                className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-xs font-semibold transition"
              >
                Discard & Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
