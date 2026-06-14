import React, { useState } from 'react';
import type { ClientMessage, Contact, Instance } from '../../services/api';
import { instancesApi } from '../../services/api';
import ComposeBar from './ComposeBar';
import MessageGroupList from './MessageGroupList';
import ChatPanelHeader from './ChatPanelHeader';
import SendingFromBar from './SendingFromBar';
import SendingErrorBanner from './SendingErrorBanner';
import ReactionPicker from './whatsapp/ReactionPicker';
import { TOKEN_COST } from '../../utils/tokenCosts';

interface ConversationContact {
  phone: string; name: string; lastMessage: string; lastTime: string; unread: number; instanceName: string;
}

interface ChatPanelProps {
  selectedContact: ConversationContact | undefined;
  selectedPhone: string;
  selectedContactDetails: Contact | undefined;
  conversationMessages: ClientMessage[];
  groupedMessages: { date: string; messages: ClientMessage[] }[];
  selectedInstance: string;
  selectedInstanceConnected: boolean;
  connectedInstances: Instance[];
  showInstancePicker: boolean;
  sendingError: string;
  replyText: string;
  sending: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  savedContacts: Contact[];
  onBack: () => void;
  onOpenContactProfile: () => void;
  onToggleInstancePicker: () => void;
  onSelectInstance: (name: string) => void;
  onClearError: () => void;
  onReplyTextChange: (v: string) => void;
  onSend: () => void;
  formatTime: (ts: string) => string;
  formatFullTime: (ts: string) => string;
  getStatusIcon: (msg: ClientMessage) => React.ReactNode;
  onTokenDeduct?: (n: number) => void;
}

interface ReactionTarget { messageId: string; position: { x: number; y: number }; }

export default function ChatPanel({
  selectedContact, selectedPhone, selectedContactDetails,
  conversationMessages, groupedMessages,
  selectedInstance, selectedInstanceConnected, connectedInstances,
  showInstancePicker, sendingError, replyText, sending,
  textareaRef, bottomRef, savedContacts,
  onBack, onOpenContactProfile, onToggleInstancePicker, onSelectInstance,
  onClearError, onReplyTextChange, onSend,
  formatTime, formatFullTime, getStatusIcon, onTokenDeduct
}: ChatPanelProps) {
  const [reactionTarget, setReactionTarget] = useState<ReactionTarget | null>(null);

  const activeInstance = connectedInstances.find(i => i.name === selectedInstance);

  const handleMessageContextMenu = (e: React.MouseEvent, msgId: string) => {
    e.preventDefault();
    setReactionTarget({ messageId: msgId, position: { x: e.clientX, y: e.clientY } });
  };

  const handleMessageTouchStart = (e: React.TouchEvent, msgId: string) => {
    const timer = setTimeout(() => {
      const touch = e.touches[0];
      setReactionTarget({ messageId: msgId, position: { x: touch.clientX, y: touch.clientY } });
    }, 500);
    (e.currentTarget as HTMLElement).dataset.longPressTimer = String(timer);
  };

  const handleMessageTouchEnd = (e: React.TouchEvent) => {
    const timer = (e.currentTarget as HTMLElement).dataset.longPressTimer;
    if (timer) { clearTimeout(parseInt(timer)); delete (e.currentTarget as HTMLElement).dataset.longPressTimer; }
  };

  const handleQuickReaction = async (msgId: string, emoji: string) => {
    if (!activeInstance) return;
    try {
      const remoteJid = `${selectedPhone}@s.whatsapp.net`;
      await instancesApi.sendReaction(activeInstance.name, selectedPhone, { remoteJid, fromMe: true, id: msgId }, emoji);
      onTokenDeduct?.(TOKEN_COST.REACTION);
    } catch { /* silent — reaction is best-effort */ }
  };

  const handleOpenReactionPicker = (msgId: string, x: number, y: number) => {
    setReactionTarget({ messageId: msgId, position: { x, y } });
  };

  return (
    <>
      <ChatPanelHeader
        selectedPhone={selectedPhone}
        selectedContactDetails={selectedContactDetails}
        selectedContact={selectedContact}
        onBack={onBack}
        onOpenContactProfile={onOpenContactProfile}
      />

      <SendingFromBar
        selectedInstance={selectedInstance}
        connectedInstances={connectedInstances}
        showInstancePicker={showInstancePicker}
        onToggle={onToggleInstancePicker}
        onSelect={onSelectInstance}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-[#f4f4ef]">
        <MessageGroupList
          groupedMessages={groupedMessages}
          selectedPhone={selectedPhone}
          formatTime={formatTime}
          formatFullTime={formatFullTime}
          getStatusIcon={getStatusIcon}
          bottomRef={bottomRef}
          onContextMenu={handleMessageContextMenu}
          onTouchStart={handleMessageTouchStart}
          onTouchEnd={handleMessageTouchEnd}
          onQuickReaction={handleQuickReaction}
          onOpenReactionPicker={handleOpenReactionPicker}
        />
      </div>

      {sendingError && <SendingErrorBanner error={sendingError} onClear={onClearError} />}

      <ComposeBar
        replyText={replyText}
        sending={sending}
        disabled={!selectedInstanceConnected}
        selectedContactName={selectedContactDetails?.name || selectedContact?.name || selectedPhone}
        selectedInstance={activeInstance}
        savedContacts={savedContacts}
        textareaRef={textareaRef}
        onReplyTextChange={onReplyTextChange}
        onSend={onSend}
        onTokenDeduct={onTokenDeduct}
      />

      {reactionTarget && activeInstance && (
        <ReactionPicker
          instance={activeInstance}
          to={selectedPhone}
          messageId={reactionTarget.messageId}
          position={reactionTarget.position}
          onClose={() => setReactionTarget(null)}
          onSelect={cost => onTokenDeduct?.(cost)}
        />
      )}
    </>
  );
}
