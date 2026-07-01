/**
 * ChatbotBuilderShell — The foundation of the new chatbot builder experience.
 *
 * Provides:
 * - Step progress sidebar (desktop) / indicator (mobile)
 * - Step content area
 * - Previous / Next navigation
 * - Unsaved changes protection
 * - Draft autosave
 * - Deep linking via URL
 * - Create vs Edit mode
 * - Mobile responsive layout
 */
import React, { useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Bot,
  Save,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import {
  useChatbotBuilderStore,
  scheduleAutosave,
  restoreDraft,
  clearDraft,
} from './store/chatbotBuilderStore';
import { BUILDER_STEPS, type BuilderStepId, type PublishJob } from './types';
import PublishProgressScreen from './components/PublishProgressScreen';
import GeneralStep from './steps/GeneralStep';
import AudienceStep from './steps/AudienceStep';
import AIBrainStep from './steps/AIBrainStep';
import KnowledgeStep from './steps/KnowledgeStep';
import DataConnectionsStep from './steps/DataConnectionsStep';
import ToolsStep from './steps/ToolsStep';
import GroupsStep from './steps/GroupsStep';
import HandoffStep from './steps/HandoffStep';
import TestStep from './steps/TestStep';
import AnalyticsStep from './steps/AnalyticsStep';
import { fetchApi } from '../../services/api';

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

interface ChatbotBuilderShellProps {
  clientToken: string;
  instances: { id: string; name: string }[];
}

export default function ChatbotBuilderShell({ clientToken, instances }: ChatbotBuilderShellProps) {
  const navigate = useNavigate();
  const { id: botId } = useParams<{ id: string }>();
  const isEditMode = Boolean(botId);
  const hasLoadedRef = useRef(false);

  const {
    draft,
    isEditMode: storeIsEditMode,
    goToStep,
    goNext,
    goPrevious,
    canAdvanceFrom,
    isStepCompleted,
    completeStep,
    initNew,
    initEdit,
    isFirstStep,
    isLastStep,
    getCurrentStepIndex,
    getProgress,
  } = useChatbotBuilderStore();

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
        // Try to restore from localStorage first
        const restored = restoreDraft(botId);
        if (restored) {
          initEdit(restored);
          return;
        }

        // Otherwise fetch from API
        setIsLoading(true);
        setLoadError(null);
        try {
          const res = await fetchApi(`/api/platform/chatbots/${botId}`, {
            headers: { Authorization: `Bearer ${clientToken}` },
          }) as { success: boolean; data: Record<string, unknown> };

          if (res.success && res.data) {
            // Map API response to draft shape
            const apiData = res.data;
            const aiConfig = (apiData.ai_config ?? {}) as Record<string, unknown>;
            const triggers = (apiData.triggers ?? []) as Array<{ id: string; keyword: string; description?: string }>;
            const rules = (apiData.rules ?? []) as Array<{ id: string; name: string; trigger_id: string; condition: string; response: { type: string; content: string } }>;
            const groupSettings = (apiData.group_settings ?? {}) as Record<string, unknown>;

            initEdit({
              id: botId,
              instanceId: (apiData.instance_id as string) ?? '',
              createdAt: (apiData.created_at as string) ?? '',
              general: {
                name: (apiData.name as string) ?? '',
                description: (apiData.description as string) ?? '',
                template: 'custom',
                priority: (apiData.priority as number) ?? 50,
                enabled: Boolean(apiData.enabled),
              },
              audience: {
                contactMode: (apiData.contact_mode as string) ?? 'everyone',
                tags: (apiData.tags as string[]) ?? [],
                contactIds: (apiData.contact_ids as string[]) ?? [],
                priority: (apiData.priority as number) ?? 50,
                groupMode: (apiData.group_mode as string) ?? 'disabled',
                groupIds: (apiData.group_ids as string[]) ?? [],
              },
              aiBrain: {
                provider: (aiConfig.provider as string) ?? 'fidscript',
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
                  { enabled: true,  label: 'Preferences',         description: 'Remember stated preferences & likes' },
                  { enabled: false, label: 'Order history',       description: 'Remember past orders & purchases' },
                  { enabled: false, label: 'Custom attributes',   description: 'Remember custom contact fields' },
                ],
                systemPrompt: (aiConfig.system_prompt as string) ?? '',
                hallucinationPolicy: (aiConfig.hallucination_policy as string) ?? 'balanced',
              },
              knowledge: { sources: (apiData.knowledge_sources as Array<never>) ?? [] },
              dataConnections: { connections: (apiData.data_connections as Array<never>) ?? [] },
              tools: {
                tools: rules.map(r => ({
                  id: r.id,
                  name: r.name,
                  description: r.condition,
                  type: 'webhook' as const,
                  enabled: true,
                  config: { url: '', method: 'POST', headers: {}, body: r.response },
                })),
              },
              groups: {
                settings: Object.entries(groupSettings).map(([id, conf]) => ({
                  id: String(id),
                  name: (conf as { name: string }).name ?? '',
                  action: (conf as { action: string }).action ?? 'allow',
                  enabled: Boolean((conf as { enabled: boolean }).enabled),
                })),
              },
              handoff: {
                triggers: triggers.map(t => ({
                  id: t.id,
                  type: 'keyword' as const,
                  value: t.keyword,
                  description: t.description ?? '',
                  enabled: true,
                })),
                targetTeamId: (apiData.handoff_team_id as string) ?? '',
                targetTeamName: (apiData.handoff_team_name as string) ?? '',
                maxRetries: (apiData.max_handoff_retries as number) ?? 3,
                fallbackReply: (apiData.fallback_response as string) ?? "I'm not sure I can help with that. Let me connect you with a team member.",
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
        // Create mode — try to restore any in-progress draft
        const restored = restoreDraft();
        if (restored) {
          initEdit(restored);
        } else {
          initNew(instances[0]?.id ?? '');
        }
      }
    };

    loadBot();
  }, [botId, isEditMode, clientToken]);

  // ── Deep linking: sync URL param → currentStep ───────────────────────────
  // Runs once on mount to respect a ?step= URL param from external links.
  // Uses a ref to detect whether the step came from URL navigation vs user click.
  // This prevents the feedback loop with the URL-update effect below.

  const isNavigatingRef = useRef(false);
  useEffect(() => {
    if (isNavigatingRef.current) return;
    const step = new URLSearchParams(window.location.search).get('step') as BuilderStepId | null;
    if (step && BUILDER_STEPS.some(s => s.id === step) && step !== draft.currentStep) {
      isNavigatingRef.current = true;
      goToStep(step);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run once on mount only

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
  }, [draft, isEditMode, botId, clientToken]);

  // ── Publish ───────────────────────────────────────────────────────────────

  const handlePublish = useCallback(async () => {
    if (!draft.general.name.trim() || !botId) return;

    setPublishError(null);
    useChatbotBuilderStore.getState().setSaving(true);
    try {
      // Kick off the publish job
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
  }, [draft, botId, clientToken]);

  // ── Keyboard navigation ──────────────────────────────────────────────────
  // Declared AFTER handleSave and handlePublish to ensure stable references
  // are available before this effect's dependency array is evaluated.

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

  // ── Render step ─────────────────────────────────────────────────────────

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
      <aside className="hidden lg:flex flex-col w-64 border-r border-[#2d2813] bg-[#13120d] px-4 py-6 shrink-0">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => {
              if (draft.isDirty) setShowLeaveConfirm(true);
              else navigate('/client/chatbots');
            }}
            className="flex items-center gap-2 text-[#8f834a] hover:text-white text-xs transition mb-2"
          >
            <ArrowLeft className="w-3 h-3" />
            All Chatbots
          </button>
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <Bot className="w-4 h-4 text-yellow-400" />
            {isEditMode ? 'Edit Chatbot' : 'Create Chatbot'}
          </h2>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-1.5 bg-[#1f1d0b] rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-[#6e684a] mt-1">{progress}% complete</p>
        </div>

        {/* Step list */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto">
          {BUILDER_STEPS.map((step, idx) => {
            const isActive = step.id === draft.currentStep;
            const isDone = isStepCompleted(step.id);
            const isAccessible = idx <= currentIndex + 1 || isDone;

            return (
              <button
                key={step.id}
                onClick={() => isAccessible && goToStep(step.id)}
                disabled={!isAccessible}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all text-left disabled:opacity-40 ${
                  isActive
                    ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    : isDone
                    ? 'text-[#6e684a] hover:text-white'
                    : 'text-[#6e684a] hover:text-white'
                }`}
              >
                <span className="shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ) : isActive ? (
                    <Circle className="w-4 h-4 text-yellow-400 fill-yellow-400/20" />
                  ) : (
                    <Circle className="w-4 h-4 text-[#3d3823]" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className={`font-semibold truncate ${isActive ? 'text-white' : ''}`}>
                    {idx + 1}. {step.label}
                  </p>
                  {isActive && (
                    <p className="text-[10px] text-[#6e684a] truncate">{step.description}</p>
                  )}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Save button */}
        <div className="mt-4 pt-4 border-t border-[#2d2813]">
          <button
            onClick={handleSave}
            disabled={draft.isSaving || !draft.general.name.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-semibold rounded-xl text-xs transition"
          >
            {draft.isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isEditMode ? 'Save Changes' : 'Create Chatbot'}
          </button>
          {draft.lastSavedAt && (
            <p className="text-[10px] text-[#6e684a] text-center mt-1.5">
              Saved {new Date(draft.lastSavedAt).toLocaleTimeString()}
            </p>
          )}
        </div>
      </aside>

      {/* ── Mobile Step Indicator ─────────────────────────────────────── */}
      <div className="lg:hidden flex items-center gap-2 px-4 py-3 border-b border-[#2d2813] bg-[#13120d] overflow-x-auto">
        {BUILDER_STEPS.map((step, idx) => (
          <button
            key={step.id}
            onClick={() => goToStep(step.id)}
            className={`shrink-0 w-6 h-6 rounded-full text-[10px] font-bold transition ${
              step.id === draft.currentStep
                ? 'bg-yellow-400 text-black'
                : isStepCompleted(step.id)
                ? 'bg-green-500 text-white'
                : 'bg-[#2d2813] text-[#6e684a]'
            }`}
            title={step.label}
          >
            {isStepCompleted(step.id) ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
          </button>
        ))}
        <span className="ml-auto text-[10px] text-[#6e684a] shrink-0">
          {currentStepMeta.label}
        </span>
      </div>

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
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-[#13120d] border-t border-[#2d2813] px-4 py-3 flex items-center justify-between z-50">
        <button
          onClick={goPrevious}
          disabled={isFirstStep()}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#8f834a] hover:text-white disabled:opacity-30 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>

        {draft.isDirty && !draft.isSaving && (
          <p className="text-[10px] text-[#6e684a] hidden sm:block">
            Unsaved changes
          </p>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (draft.isDirty) {
                const confirmed = window.confirm('Discard unsaved changes?');
                if (!confirmed) return;
              }
              clearDraft(botId);
              navigate('/client/chatbots');
            }}
            className="px-4 py-2 text-xs font-semibold text-[#6e684a] hover:text-white transition"
          >
            {isEditMode ? 'Cancel' : 'Discard'}
          </button>

          {isLastStep() ? (
            <button
              onClick={handlePublish}
              disabled={draft.isSaving || !canGoNext || Boolean(publishJob)}
              className="flex items-center gap-2 px-5 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-semibold rounded-xl text-xs transition"
            >
              {draft.isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Publish
            </button>
          ) : (
            <button
              onClick={goNext}
              disabled={!canGoNext}
              className="flex items-center gap-2 px-5 py-2 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-semibold rounded-xl text-xs transition"
              title={!canGoNext ? 'Fill in required fields to continue' : ''}
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

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
                  clearDraft(botId);
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

// ─── Payload Builder ───────────────────────────────────────────────────────────

function buildApiPayload(draft: ReturnType<typeof useChatbotBuilderStore.getState>['draft']): Record<string, unknown> {
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
