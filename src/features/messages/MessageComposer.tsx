import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import type { Instance } from '../../services/api';
import { instancesApi } from '../../services/api';
import type { MirrorMessage } from './messagesApi';

// Composer — sends via the existing client-JWT path (token billing intact),
// optimistically appends the outgoing bubble, then the thread hook reconciles
// with the Evolution echo on refresh (dedup by id).
interface MessageComposerProps {
  chatJid: string;
  instance: Instance | null;
  onSent: (optimistic: MirrorMessage) => void;
}

export default function MessageComposer({ chatJid, instance, onSent }: MessageComposerProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 144)}px`;
  }, []);

  useEffect(() => { adjustHeight(); }, [text, adjustHeight]);

  const canSend = !!instance && instance.status === 'connected' && text.trim().length > 0 && !sending;
  const charCount = text.length;
  const segments = charCount > 1600 ? 3 : charCount > 160 ? 2 : 1;

  const handleSend = async () => {
    if (!instance || !text.trim()) return;
    setSending(true);
    setError(null);
    const optimistic: MirrorMessage = {
      id: `optimistic:${Date.now()}`,
      direction: 'outgoing',
      type: 'text',
      content: text.trim(),
      mediaUrl: null,
      mediaMimetype: null,
      senderName: null,
      timestamp: Date.now(),
    };
    onSent(optimistic);
    const body = text.trim();
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const res = await instancesApi.sendText(instance.name, chatJid, body);
    setSending(false);
    if (!res.success) setError(res.error || 'Failed to send');
  };

  return (
    <div className="border-t border-stone-200 bg-white px-3 py-2">
      {error && <p className="mb-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-600">{error}</p>}
      <div className="flex items-end gap-2">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => { setText(e.target.value); adjustHeight(); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void handleSend(); }
            }}
            placeholder={
              instance?.status === 'connected'
                ? 'Type a message… (Enter to send, Shift+Enter for new line)'
                : 'Instance is not connected'
            }
            disabled={!instance || instance.status !== 'connected'}
            rows={1}
            style={{ minHeight: '40px', maxHeight: '144px' }}
            className="w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 pr-16 text-sm text-stone-800 outline-none transition-colors focus:border-[#eab308] focus:bg-white disabled:opacity-50"
          />
          <div className="absolute bottom-2 right-2.5 flex items-center gap-1.5 text-[10px]">
            {charCount > 150 && (
              <span className="font-mono text-stone-400">
                {charCount}{segments > 1 && <span className="ml-1 text-stone-500">({segments} seg)</span>}
              </span>
            )}
            {instance && (
              <span
                title={instance.status}
                className={`h-1.5 w-1.5 rounded-full ${
                  instance.status === 'connected' ? 'bg-green-500'
                    : instance.status === 'connecting' ? 'bg-[#eab308]'
                    : 'bg-stone-300'
                }`}
              />
            )}
          </div>
        </div>
        <button
          onClick={() => void handleSend()}
          disabled={!canSend}
          aria-label="Send message"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#181711] text-[#eab308] transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
        >
          {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}
