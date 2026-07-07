import { FileText } from 'lucide-react';
import type { MirrorMessage } from '../messagesApi';

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

export default function MessageMedia({ message }: { message: MirrorMessage }) {
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
