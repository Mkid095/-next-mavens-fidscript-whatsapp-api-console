import { CheckCheck, Check } from 'lucide-react';
import type { ConversationMessage } from '../../data';

// A single message bubble — direction-aware. FIDScript palette only (no green).
// Outgoing: right-aligned forest-deep; incoming: left-aligned stone.
interface MessageBubbleProps {
  message: ConversationMessage;
  showName?: boolean;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const outgoing = message.direction === 'outgoing';
  const time = new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex ${outgoing ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
          outgoing
            ? 'bg-forest-deep text-white rounded-br-sm'
            : 'bg-stone-100 text-stone-800 rounded-bl-sm'
        }`}
      >
        {message.message_type !== 'text' && (
          <div className={`mb-1 flex items-center gap-1 text-[11px] ${outgoing ? 'text-white/70' : 'text-stone-500'}`}>
            <span className="capitalize">{message.message_type}</span>
          </div>
        )}
        {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
        {message.media_url && (
          <div className="mt-1 text-[11px] underline opacity-80">attachment</div>
        )}
        <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${outgoing ? 'text-white/60' : 'text-stone-400'}`}>
          <span>{time}</span>
          {outgoing && (message.is_read ? <CheckCheck size={12} /> : <Check size={12} />)}
        </div>
      </div>
    </div>
  );
}
