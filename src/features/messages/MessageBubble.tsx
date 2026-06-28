import { Check, CheckCheck, FileText, Image as ImageIcon, Film, Music, MapPin, User, Play } from 'lucide-react';
import type { MirrorMessage } from './messagesApi';

interface MessageBubbleProps {
  message: MirrorMessage;
  /** True when this message is from the same sender as the previous message in the thread */
  isContinuation?: boolean;
  /** True when this is the last message in a group of same-sender messages */
  isGroupEnd?: boolean;
}

function timeLabel(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function MediaContent({ message }: { message: MirrorMessage }) {
  if (!message.mediaUrl) return null;

  if (message.type === 'image') {
    return (
      <img
        src={message.mediaUrl}
        alt="Shared image"
        loading="lazy"
        className="mt-1 max-h-60 max-w-full rounded-xl object-cover cursor-pointer hover:opacity-95 transition-opacity"
        onClick={() => window.open(message.mediaUrl!, '_blank')}
      />
    );
  }

  if (message.type === 'video') {
    return (
      <div className="mt-1 relative rounded-xl overflow-hidden bg-stone-900">
        <video
          src={message.mediaUrl}
          controls
          preload="metadata"
          className="max-h-60 w-full object-contain"
          onClick={(e) => e.currentTarget.play()}
        />
      </div>
    );
  }

  if (message.type === 'audio') {
    return (
      <div className="mt-1 rounded-xl bg-stone-100 p-2">
        <audio
          src={message.mediaUrl}
          controls
          className="w-full h-10"
          preload="metadata"
        />
      </div>
    );
  }

  return (
    <a
      href={message.mediaUrl}
      target="_blank"
      rel="noreferrer"
      className="mt-1 flex items-center gap-2 rounded-xl bg-stone-100 px-3 py-2.5 text-xs text-stone-700 hover:bg-stone-200 transition-colors"
    >
      <FileText size={14} />
      <span className="truncate flex-1">{message.content || 'Document'}</span>
      <FileText size={12} className="text-stone-400" />
    </a>
  );
}

function TypeIcon({ type }: { type: string }) {
  const map: Record<string, JSX.Element> = {
    image: <ImageIcon size={11} />,
    video: <Film size={11} />,
    audio: <Music size={11} />,
    document: <FileText size={11} />,
    location: <MapPin size={11} />,
    contact: <User size={11} />,
  };
  return map[type] ?? null;
}

export default function MessageBubble({ message, isContinuation = false, isGroupEnd = true }: MessageBubbleProps) {
  const outgoing = message.direction === 'outgoing';

  return (
    <div className={`flex flex-col ${outgoing ? 'items-end' : 'items-start'} px-1`}>
      {/* Sender name — only show for group non-continuation messages */}
      {message.senderName && !outgoing && !isContinuation && (
        <span className="mb-0.5 ml-1 text-[11px] font-medium text-stone-500">{message.senderName}</span>
      )}

      {/* Bubble container — no top margin if continuation, extra margin if group end */}
      <div
        className={`relative max-w-[78%] ${
          outgoing
            ? 'bg-[#181711] text-white rounded-2xl rounded-br-sm'
            : 'bg-white text-stone-800 rounded-2xl rounded-bl-sm shadow-sm'
        } ${isContinuation ? 'mt-0.5' : 'mt-1'} ${isGroupEnd ? 'mb-1.5' : 'mb-0.5'}`}
      >
        {/* Message content */}
        <div className={`px-3 py-1.5 ${isContinuation && outgoing ? 'pt-1' : ''} ${isGroupEnd ? 'pb-1' : 'pb-0.5'}`}>
          {/* Media type badge for non-text */}
          {message.type !== 'text' && (
            <div className={`mb-0.5 flex items-center gap-1 text-[10px] ${outgoing ? 'text-white/50' : 'text-stone-400'}`}>
              <TypeIcon type={message.type} />
              <span className="capitalize">{message.type}</span>
            </div>
          )}

          {/* Text content */}
          {message.content && (
            <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">
              {message.content}
            </p>
          )}

          {/* Media */}
          <MediaContent message={message} />

          {/* Timestamp + read receipt */}
          {isGroupEnd && (
            <div className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${outgoing ? 'text-white/50' : 'text-stone-400'}`}>
              <span>{timeLabel(message.timestamp)}</span>
              {outgoing && (message.type === 'text' || !message.mediaUrl) && (
                <CheckCheck size={11} className="text-[#eab308]" />
              )}
              {outgoing && message.type !== 'text' && message.mediaUrl && (
                <Check size={11} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
