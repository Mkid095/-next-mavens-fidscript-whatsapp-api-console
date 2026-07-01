import React from 'react';
import { Check, CheckCheck, FileText, Image as ImageIcon, Film, Music, MapPin, User, Play } from 'lucide-react';
import type { MirrorMessage } from './messagesApi';
import { useProfilePic } from './useProfilePic';

interface MessageBubbleProps {
  message: MirrorMessage;
  /** True when this message is from the same sender as the previous message in the thread */
  isContinuation?: boolean;
  /** True when this is the last message in a group of same-sender messages */
  isGroupEnd?: boolean;
  /** Instance name — required to fetch sender avatar in group chats */
  instanceName?: string | null;
  /** True if this thread is a group — shows sender avatar next to name */
  isGroup?: boolean;
}

function timeLabel(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Rewrite Evolution API media URLs through our backend proxy so the browser
// can access them (the browser can't send the apikey header Evolution needs).
// Accepts any URL; relative /mediafile/ paths are also handled.
function proxyMediaUrl(mediaUrl: string): string {
  if (!mediaUrl) return mediaUrl;
  // Already a relative path we handle
  if (mediaUrl.startsWith('/mediafile/')) {
    return `/api/platform/chatmirror/media?url=${encodeURIComponent(mediaUrl)}`;
  }
  // If it doesn't look like an HTTP URL, pass it through as-is
  if (!mediaUrl.startsWith('http://') && !mediaUrl.startsWith('https://')) {
    return mediaUrl;
  }
  return `/api/platform/chatmirror/media?url=${encodeURIComponent(mediaUrl)}`;
}

// Extract phone digits for avatar lookup from a participant JID
function participantToAvatarKey(jid: string | null): string | null {
  if (!jid) return null;
  if (jid.includes('@g.us')) return jid; // group JID
  const user = jid.split('@')[0];
  return /^\d+$/.test(user) ? user : null;
}

// Fallback avatar initials from sender name
function senderInitials(name: string | null): string {
  return (name || '?').slice(0, 2).toUpperCase();
}

function MediaContent({ message }: { message: MirrorMessage }) {
  if (!message.mediaUrl) return null;

  const proxiedUrl = proxyMediaUrl(message.mediaUrl);

  if (message.type === 'image') {
    return (
      <img
        src={proxiedUrl}
        alt="Shared image"
        loading="lazy"
        className="mt-1 max-h-60 max-w-full rounded-xl object-cover cursor-pointer hover:opacity-95 transition-opacity"
        onClick={() => window.open(proxiedUrl, '_blank')}
      />
    );
  }

  if (message.type === 'video') {
    return (
      <div className="mt-1 relative rounded-xl overflow-hidden bg-black/40">
        <video
          src={proxiedUrl}
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
      <div className="mt-1 rounded-xl bg-[#2d2813] p-2">
        <audio
          src={proxiedUrl}
          controls
          className="w-full h-10"
          preload="metadata"
        />
      </div>
    );
  }

  return (
    <a
      href={proxiedUrl}
      target="_blank"
      rel="noreferrer"
      className="mt-1 flex items-center gap-2 rounded-xl bg-[#2d2813] px-3 py-2.5 text-xs text-[#a8a99e] hover:bg-[#3d3823] transition-colors"
    >
      <FileText size={14} className="text-[#6e684a]" />
      <span className="truncate flex-1">{message.content || 'Document'}</span>
      <FileText size={12} className="text-[#6e684a]" />
    </a>
  );
}

function TypeIcon({ type }: { type: string }) {
  const map: Record<string, React.ReactElement> = {
    image: <ImageIcon size={11} />,
    video: <Film size={11} />,
    audio: <Music size={11} />,
    document: <FileText size={11} />,
    location: <MapPin size={11} />,
    contact: <User size={11} />,
  };
  return map[type] ?? null;
}

export default function MessageBubble({ message, isContinuation = false, isGroupEnd = true, instanceName, isGroup }: MessageBubbleProps) {
  const outgoing = message.direction === 'outgoing';
  const showSender = isGroup && !outgoing && !isContinuation && message.senderName;

  // Fetch sender avatar for group incoming messages
  const avatarKey = showSender ? participantToAvatarKey(message.senderJid) : null;
  const avatarPic = useProfilePic(instanceName ?? null, avatarKey);
  const senderInitialsStr = senderInitials(message.senderName);

  return (
    <div className={`flex flex-col ${outgoing ? 'items-end' : 'items-start'} px-1`}>
      {/* Sender name + avatar — only for group non-continuation incoming messages */}
      {showSender && (
        <div className="mb-0.5 ml-1 flex items-center gap-1.5">
          <div className="h-5 w-5 shrink-0 overflow-hidden rounded-full bg-[#2d2813]">
            {avatarPic ? (
              <img src={avatarPic} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-[8px] font-semibold text-[#8f834a]">
                {senderInitialsStr}
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium text-[#8f834a]">{message.senderName}</span>
        </div>
      )}

      {/* Bubble container — no top margin if continuation, extra margin if group end */}
      <div
        className={`relative max-w-[78%] ${
          outgoing
            ? 'bg-[#181711] text-white rounded-2xl rounded-br-sm'
            : 'bg-[#1a1915] text-[#a8a99e] rounded-2xl rounded-bl-sm border border-[#2d2813]'
        } ${isContinuation ? 'mt-0.5' : 'mt-1'} ${isGroupEnd ? 'mb-1.5' : 'mb-0.5'}`}
      >
        {/* Message content */}
        <div className={`px-3 py-1.5 ${isContinuation && outgoing ? 'pt-1' : ''} ${isGroupEnd ? 'pb-1' : 'pb-0.5'}`}>
          {/* Media type badge for non-text */}
          {message.type !== 'text' && (
            <div className={`mb-0.5 flex items-center gap-1 text-[10px] ${outgoing ? 'text-white/50' : 'text-[#6e684a]'}`}>
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
            <div className={`mt-0.5 flex items-center justify-end gap-1 text-[10px] ${outgoing ? 'text-white/50' : 'text-[#6e684a]'}`}>
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
