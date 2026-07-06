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
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useChatbotBuilderStore, clearDraft } from '../store/chatbotBuilderStore';
import type { BuilderStepId, PublishJob } from '../types';
import SetupStep from '../steps/SetupStep';
import AudienceStep from '../steps/AudienceStep';
import AIBrainStep from '../steps/AIBrainStep';
import ToolsKnowledgeStep from '../steps/ToolsKnowledgeStep';
import TestDeployStep from '../steps/TestDeployStep';
import ChatbotBuilderSidebar from './ChatbotBuilderSidebar';
import ChatbotBuilderContent from './ChatbotBuilderContent';
import ChatbotBuilderFooter from './ChatbotBuilderFooter';
import MobileStepIndicator from './MobileStepIndicator';
import PublishProgressOverlay from './PublishProgressOverlay';
import LeaveConfirmModal from './LeaveConfirmModal';
import { useAutosave } from './useAutosave';
import { useBotLoader } from './useBotLoader';
import { useUnsavedChangesProtection } from './useUnsavedChangesProtection';
import { useSavePublish } from './useSavePublish';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';
import { usePublishPolling } from './usePublishPolling';
import type { Instance } from '../../../services/api';

const STEP_COMPONENTS: Record<BuilderStepId, React.ComponentType> = {
  'setup': SetupStep, 'audience': AudienceStep, 'ai-brain': AIBrainStep,
  'tools-knowledge': ToolsKnowledgeStep, 'test-deploy': TestDeployStep,
};

export default function ChatbotBuilderShell({ clientToken, instances }: { clientToken: string; instances: Instance[] }) {
  const navigate = useNavigate();
  const { id: botId } = useParams<{ id: string }>();
  const isEditMode = Boolean(botId);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [publishJob, setPublishJob] = useState<PublishJob | null>(null);

  const draft = useChatbotBuilderStore(s => s.draft);
  const initNew = useChatbotBuilderStore(s => s.initNew);
  const initEdit = useChatbotBuilderStore(s => s.initEdit);
  const goToStep = useChatbotBuilderStore(s => s.goToStep);
  const canAdvanceFrom = useChatbotBuilderStore(s => s.canAdvanceFrom);
  const isLastStep = useChatbotBuilderStore(s => s.isLastStep);

  const { isLoading, loadError } = useBotLoader({ botId, isEditMode, clientToken, instances, initNew, initEdit, goToStep });
  const { handleSave, handlePublish } = useSavePublish(botId, isEditMode, clientToken);

  useAutosave(clientToken);
  useUnsavedChangesProtection(() => setShowLeaveConfirm(true));
  useKeyboardShortcuts(handleSave, () => handlePublish(setPublishJob), isLastStep);
  usePublishPolling(publishJob, clientToken, setPublishJob);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-yellow-400 animate-spin" /></div>;
  if (loadError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <AlertTriangle className="w-10 h-10 text-red-400" />
      <p className="text-white font-semibold">Failed to load chatbot</p>
      <p className="text-[#8f834a] text-sm">{loadError}</p>
      <button onClick={() => navigate('/client/chatbots')} className="text-yellow-400 text-sm underline">Back to Chatbots</button>
    </div>
  );

  const StepComponent = STEP_COMPONENTS[draft.currentStep] ?? SetupStep;
  const canGoNext = canAdvanceFrom(draft.currentStep);

  const handleDiscard = () => {
    if (draft.isDirty && !window.confirm('Discard unsaved changes?')) return;
    clearDraft(botId);
    navigate('/client/chatbots');
  };

  const handleRequestLeave = () => draft.isDirty ? setShowLeaveConfirm(true) : navigate('/client/chatbots');

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
      <ChatbotBuilderSidebar isEditMode={isEditMode} onSave={handleSave} onRequestLeave={handleRequestLeave} />
      <MobileStepIndicator />
      <ChatbotBuilderContent StepComponent={StepComponent} />
      <ChatbotBuilderFooter canGoNext={canGoNext} publishJob={publishJob} onPublish={() => handlePublish(setPublishJob)} onDiscard={handleDiscard} />
      <PublishProgressOverlay publishJob={publishJob} onClose={() => setPublishJob(null)} onViewChatbot={() => navigate('/client/chatbots')} onRetry={() => handlePublish(setPublishJob)} />
      {showLeaveConfirm && <LeaveConfirmModal isEditMode={isEditMode} botId={botId} onClose={() => setShowLeaveConfirm(false)} />}
    </div>
  );
}
