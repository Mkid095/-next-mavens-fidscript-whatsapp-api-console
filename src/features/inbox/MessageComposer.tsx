import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { instancesApi } from '../../services/api';
import { emitDataEvent } from '../../data';
import type { Instance } from '../../services/api';

// Composer — sends via the existing client send path (instancesApi.sendText),
// then emits message.sent on the data bus so the thread + analytics refresh.
interface MessageComposerProps {
  chatId: string;                 // normalized phone or group JID
  instanceId: string | null;
  instances: Instance[];
  onTokenDeduct?: (n: number) => void;
  onSent: () => void;
}

export default function MessageComposer({ chatId, instanceId, instances, onTokenDeduct, onSent }: MessageComposerProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const instance = instances.find((i) => i.id === instanceId) || instances.find((i) => i.status === 'connected') || null;
  const canSend = text.trim().length > 0 && instance && !sending;

  const handleSend = async () => {
    if (!instance || !text.trim()) return;
    setSending(true);
    setError('');
    try {
      const res = await instancesApi.sendText(instance.name, chatId, text.trim());
      if (res.success) {
        setText('');
        onTokenDeduct?.(1);
        emitDataEvent('message.sent', { conversationId: null, toNumber: chatId });
        onSent();
      } else {
        setError(res.error || 'Failed to send');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
    }
    setSending(false);
  };

  return (
    <div className="border-t border-stone-200 bg-white p-3">
      {error && <p className="mb-1.5 text-xs text-red-600">{error}</p>}
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={instance ? 'Type a message…' : 'No connected container to send from'}
          disabled={!instance}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-800 outline-none focus:border-forest-deep focus:bg-white disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-deep text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>
    </div>
  );
}
