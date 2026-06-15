import { Bot, Users } from 'lucide-react';
import type { Conversation } from '../../data';
import { useGroupInfo } from '../../data';
import { timeAgo, priorityStyle } from './helpers';

// A single conversation row in the list pane. For groups, resolves the group
// subject via useGroupInfo so the user sees "Family Group" instead of the JID.
interface ConversationListItemProps {
  conversation: Conversation;
  selected: boolean;
  onSelect: () => void;
}

export default function ConversationListItem({ conversation, selected, onSelect }: ConversationListItemProps) {
  const isGroup = (conversation.channel === 'whatsapp') && conversation.chat_id.includes('@g.us');
  const group = useGroupInfo(isGroup ? conversation.chat_id : null);

  const displayName = isGroup
    ? (group.subject || conversation.customer_name || conversation.chat_id)
    : (conversation.customer_name || conversation.chat_id || 'Unknown');
  const initial = displayName.slice(0, 2).toUpperCase();
  const prio = priorityStyle(conversation.priority);
  const isAi = conversation.ai_state === 'ai_active';

  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-start gap-2.5 border-l-2 px-3 py-2.5 text-left transition ${
        selected ? 'border-forest-deep bg-stone-100' : 'border-transparent hover:bg-stone-50'
      }`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-200 text-stone-600">
        {isGroup ? <Users size={15} /> : initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-stone-800">{displayName}</span>
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
