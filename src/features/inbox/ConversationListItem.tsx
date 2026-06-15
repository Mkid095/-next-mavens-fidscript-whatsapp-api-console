import { Bot } from 'lucide-react';
import type { Conversation } from '../../data';
import { timeAgo, priorityStyle } from './helpers';

// A single conversation row in the list pane.
interface ConversationListItemProps {
  conversation: Conversation;
  selected: boolean;
  onSelect: () => void;
}

export default function ConversationListItem({ conversation, selected, onSelect }: ConversationListItemProps) {
  const name = conversation.customer_name || conversation.chat_id || 'Unknown';
  const prio = priorityStyle(conversation.priority);
  const isAi = conversation.ai_state === 'ai_active';

  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-start gap-2.5 border-l-2 px-3 py-2.5 text-left transition ${
        selected ? 'border-forest-deep bg-stone-100' : 'border-transparent hover:bg-stone-50'
      }`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-200 text-xs font-medium text-stone-600">
        {name.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-stone-800">{name}</span>
          <span className="shrink-0 text-[10px] text-stone-400">
            {timeAgo(conversation.last_message_at)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs text-stone-500">
            {conversation.last_message || 'No messages yet'}
          </span>
          {conversation.unread_count > 0 && (
            <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-yellow-500 px-1 text-[10px] font-medium text-stone-900">
              {conversation.unread_count}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${prio.dot}`} title={`${prio.label} priority`} />
          {isAi && (
            <span className="flex items-center gap-0.5 text-[10px] text-forest-deep">
              <Bot size={10} /> AI
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
