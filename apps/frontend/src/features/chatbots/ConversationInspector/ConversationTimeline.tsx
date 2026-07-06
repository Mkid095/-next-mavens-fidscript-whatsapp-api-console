import React from 'react';
import type { Conversation, ThreadMessage, Trace, ReplayResult } from './types';
import ConversationFilters from './ConversationFilters';
import ConversationMessageList from './ConversationMessageList';
import ConversationDetail from './ConversationDetail';

interface Props {
  conversations: Conversation[];
  selectedConvId: string | null;
  loadingConv: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectConv: (id: string) => void;
  messages: ThreadMessage[];
  loadingThread: boolean;
  selectedMsgId: string | null;
  replayResult: ReplayResult | null;
  isReplaying: boolean;
  onSelectMsg: (id: string) => void;
  onReplay: (msgId: string) => void;
  traces: Trace[];
}

export default function ConversationTimeline({
  conversations,
  selectedConvId,
  loadingConv,
  searchQuery,
  onSearchChange,
  onSelectConv,
  messages,
  loadingThread,
  selectedMsgId,
  replayResult,
  isReplaying,
  onSelectMsg,
  onReplay,
  traces,
}: Props) {
  const selectedMsg = messages.find(m => m.id === selectedMsgId);
  const selectedMsgTraces = traces.filter(t => t.messageId === selectedMsgId);

  return (
    <div className="flex flex-1 overflow-hidden">
      <ConversationFilters
        conversations={conversations}
        selectedConvId={selectedConvId}
        loadingConv={loadingConv}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        onSelectConv={onSelectConv}
      />
      <ConversationMessageList
        messages={messages}
        loadingThread={loadingThread}
        selectedConvId={selectedConvId}
        selectedMsgId={selectedMsgId}
        replayResult={replayResult}
        isReplaying={isReplaying}
        onSelectMsg={onSelectMsg}
        onReplay={onReplay}
      />
      <ConversationDetail
        selectedMsg={selectedMsg}
        selectedMsgTraces={selectedMsgTraces}
        selectedConvId={selectedConvId}
      />
    </div>
  );
}
