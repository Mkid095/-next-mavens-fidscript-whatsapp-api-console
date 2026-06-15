import { useEffect, useRef } from 'react';
import { MessagesSquare } from 'lucide-react';
import type { Conversation, Instance } from '../../services/api';
import { useInbox } from '../../data';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';
import { useTypingIndicator } from './useTypingIndicator';
import { priorityStyle, aiStateMeta } from './helpers';

// Center pane — the message thread + composer for the selected conversation.
interface ConversationThreadPaneProps {
  conversation: Conversation | null;
  instances: Instance[];
  onTokenDeduct?: (n: number) => void;
}

export default function ConversationThreadPane({ conversation, instances, onTokenDeduct }: ConversationThreadPaneProps) {
  const { messages, loading, error, refresh } = useInbox(conversation?.id ?? null);
  const typing = useTypingIndicator(conversation?.chat_id ?? null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length, conversation?.id]);

  if (!conversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-stone-50 text-stone-400">
        <MessagesSquare size={32} />
        <p className="text-sm">Select a conversation</p>
      </div>
    );
  }

  const prio = priorityStyle(conversation.priority);
  const ai = aiStateMeta(conversation.ai_state);

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-stone-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-stone-200 bg-white px-4 py-2.5">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-stone-800">
            {conversation.customer_name || conversation.chat_id}
          </h2>
          <p className="truncate text-[11px] text-stone-400">{conversation.chat_id}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 text-[11px] ${prio.text}`}><span className={`h-1.5 w-1.5 rounded-full ${prio.dot}`} />{prio.label}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${ai.badge}`}>{ai.label}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {loading && <p className="text-xs text-stone-400">Loading messages…</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
        {messages.map((m) => <MessageBubble key={m.id} message={m} />)}
        {typing && (
          <div className="mb-2 flex justify-start">
            <div className="rounded-2xl rounded-bl-sm bg-stone-100 px-3.5 py-2 text-xs text-stone-500">
              <span className="inline-flex gap-0.5">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400" />
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <MessageComposer
        chatId={conversation.chat_id}
        instanceId={conversation.instance_id}
        instances={instances}
        onTokenDeduct={onTokenDeduct}
        onSent={refresh}
      />
    </div>
  );
}
