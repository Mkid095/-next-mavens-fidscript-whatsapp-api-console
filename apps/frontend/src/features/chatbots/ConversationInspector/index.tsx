/**
 * ConversationInspector — Priority 3 (V1)
 *
 * Debug tool for inspecting real customer conversations with a chatbot.
 * Three-panel layout:
 *   Left (260px):  conversation list with search + filters
 *   Center (flex-1): WhatsApp thread with AI metadata badges
 *   Right (240px):  debug drawer (confidence, sources, tools, traces, replay)
 */
import React from 'react';
import TopBar from './TopBar';
import NotificationBars from './ErrorBanner';
import ConversationTimeline from './ConversationTimeline';
import { useConversationInspector } from './useConversationInspector';

interface Props {
  clientToken: string;
}

export default function ConversationInspector({ clientToken }: Props) {
  const {
    botName, conversations, selectedConvId, messages, traces, selectedMsgId,
    replayResult, isReplaying, loadingConv, loadingThread, searchQuery, error, toast,
    setSelectedConvId, setSearchQuery, setSelectedMsgId, setError, setToast,
    replayMessage,
  } = useConversationInspector(clientToken);

  return (
    <div className="flex flex-col h-screen bg-[#11100b] overflow-hidden">
      <TopBar botName={botName} />
      <NotificationBars error={error} toast={toast} onErrorClose={() => setError(null)} onToastClose={() => setToast(null)} />
      <ConversationTimeline
        conversations={conversations} selectedConvId={selectedConvId} loadingConv={loadingConv}
        searchQuery={searchQuery} onSearchChange={setSearchQuery} onSelectConv={setSelectedConvId}
        messages={messages} loadingThread={loadingThread} selectedMsgId={selectedMsgId}
        replayResult={replayResult} isReplaying={isReplaying} onSelectMsg={setSelectedMsgId}
        onReplay={replayMessage} traces={traces}
      />
    </div>
  );
}
