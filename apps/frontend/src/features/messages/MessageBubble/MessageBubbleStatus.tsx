import { Check, CheckCheck } from 'lucide-react';
import type { MirrorMessage } from '../messagesApi';

interface MessageBubbleStatusProps {
  message: MirrorMessage;
  outgoing: boolean;
  timeLabel: string;
}

export default function MessageBubbleStatus({ message, outgoing, timeLabel }: MessageBubbleStatusProps) {
  if (!outgoing) {
    return (
      <div className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] text-[#6e684a]`}>
        <span>{timeLabel}</span>
      </div>
    );
  }

  return (
    <div className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${outgoing ? 'text-white/50' : 'text-[#6e684a]'}`}>
      <span>{timeLabel}</span>
      {message.type === 'text' || !message.mediaUrl ? (
        <CheckCheck size={11} className="text-[#eab308]" />
      ) : (
        <Check size={11} />
      )}
    </div>
  );
}
