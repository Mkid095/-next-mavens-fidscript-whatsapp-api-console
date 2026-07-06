import React from 'react';
import { Check, CheckCheck, Image as ImageIcon, Film, Music, FileText, MapPin, User } from 'lucide-react';
import type { MirrorMessage } from '../messagesApi';
import { useProfilePic } from '../useProfilePic';
import MessageBubbleMedia from './MessageBubbleMedia.js';
import MessageBubbleStatus from './MessageBubbleStatus.js';

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

// Rewrite Evolution API media URLs through our backend proxy so the browser
// can access them (the browser can't send the apikey header Evolution needs).
// Accepts any URL; relative /mediafile/ paths are also handled.
function proxyMediaUrl(mediaUrl: string): string {
  if (!mediaUrl) return mediaUrl;
  if (mediaUrl.startsWith('/mediafile/')) {
    return `/api/platform/chatmirror/media?url=${encodeURIComponent(mediaUrl)}`;
  }
  if (!mediaUrl.startsWith('http://') && !mediaUrl.startsWith('https://')) {
    return mediaUrl;
  }
  return `/api/platform/chatmirror/media?url=${encodeURIComponent(mediaUrl)}`;
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
          <MessageBubbleMedia message={message} proxyMediaUrl={proxyMediaUrl} />

          {/* Timestamp + read receipt */}
          {isGroupEnd && (
            <MessageBubbleStatus
              message={message}
              outgoing={outgoing}
              timeLabel={timeLabel(message.timestamp)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
