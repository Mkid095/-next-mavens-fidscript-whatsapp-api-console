import { Check, CheckCheck, FileText, Image as ImageIcon, Film, Music, MapPin, User } from 'lucide-react';
import type { MirrorMessage } from './messagesApi';

// Direction-aware bubble. Outgoing right (charcoal), incoming left (stone).
// Media renders inline (image lazy, video opens in new tab, docs/audio as cards).
interface MessageBubbleProps {
  message: MirrorMessage;
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
        className="mt-1 max-h-56 max-w-[260px] rounded-lg object-cover cursor-pointer"
        onClick={() => window.open(message.mediaUrl!, '_blank')}
      />
    );
  }
  if (message.type === 'video') {
    return (
      <button
        onClick={() => window.open(message.mediaUrl!, '_blank')}
        className="mt-1 flex items-center gap-2 rounded-lg bg-stone-200/60 px-3 py-2 text-xs text-stone-700 hover:bg-stone-300/60"
      >
        <Film size={14} /> Tap to play video
      </button>
    );
  }
  if (message.type === 'audio') {
    return (
      <div className="mt-1 flex items-center gap-2 rounded-lg bg-stone-200/60 px-3 py-2 text-xs text-stone-700">
        <Music size={14} /> <audio src={message.mediaUrl} controls className="h-8" />
      </div>
    );
  }
  return (
    <a
      href={message.mediaUrl}
      target="_blank"
      rel="noreferrer"
      className="mt-1 flex items-center gap-2 rounded-lg bg-stone-200/60 px-3 py-2 text-xs text-stone-700 hover:bg-stone-300/60"
    >
      <FileText size={14} />
      <span className="truncate">{message.content || 'Document'}</span>
    </a>
  );
}

function TypeIcon({ type }: { type: string }) {
  const map: Record<string, JSX.Element> = {
    image: <ImageIcon size={12} />, video: <Film size={12} />, audio: <Music size={12} />,
    document: <FileText size={12} />, location: <MapPin size={12} />, contact: <User size={12} />,
  };
  return map[type] ?? null;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const outgoing = message.direction === 'outgoing';
  return (
    <div className={`flex ${outgoing ? 'justify-end' : 'justify-start'}`}>
      {message.senderName && !outgoing && (
        <div className="mt-1 mr-1 self-end text-[10px] font-medium text-stone-500">{message.senderName}</div>
      )}
      <div
        className={`max-w-[75%] rounded-2xl px-3 py-1.5 text-sm shadow-sm ${
          outgoing
            ? 'rounded-br-sm bg-[#181711] text-white'
            : 'rounded-bl-sm bg-white text-stone-800'
        }`}
      >
        {message.type !== 'text' && (
          <div className={`mb-0.5 flex items-center gap-1 text-[10px] ${outgoing ? 'text-white/60' : 'text-stone-400'}`}>
            <TypeIcon type={message.type} />
            <span className="capitalize">{message.type}</span>
          </div>
        )}
        {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
        <MediaContent message={message} />
        <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${outgoing ? 'text-white/60' : 'text-stone-400'}`}>
          <span>{timeLabel(message.timestamp)}</span>
          {outgoing && (message.type === 'text' || !message.mediaUrl) && (
            <CheckCheck size={11} className="text-[#eab308]" />
          )}
          {outgoing && message.type !== 'text' && message.mediaUrl && <Check size={11} />}
        </div>
      </div>
    </div>
  );
}
