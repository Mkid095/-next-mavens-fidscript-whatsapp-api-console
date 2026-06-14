import React, { useState } from 'react';
import { X, Paperclip, SendHorizontal, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import type { Instance } from '../../../services/api';
import { instancesApi } from '../../../services/api';
import { TOKEN_COST } from '../../../utils/tokenCosts';

interface MediaSendModalProps {
  instance: Instance;
  to: string;
  onClose: () => void;
  onSend: (tokenCost: number) => void;
}

type MediaType = 'image' | 'video' | 'audio' | 'document';

export default function MediaSendModal({ instance, to, onClose, onSend }: MediaSendModalProps) {
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [caption, setCaption] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!mediaUrl.trim()) return;
    setSending(true);
    setError('');
    try {
      const res = await instancesApi.sendMedia(instance.name, to, mediaUrl.trim(), mediaType, caption.trim());
      if (res.success) {
        onSend(TOKEN_COST.MEDIA);
        onClose();
      } else {
        setError(res.error || 'Failed to send media');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send media');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl w-full max-w-md mx-4 overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#eaebe4] flex items-center justify-between bg-[#fafaf5]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-yellow-100 flex items-center justify-center">
              <Paperclip className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-forest-deep">Send Media</h3>
              <p className="text-[10px] text-stone-500 font-mono">{to}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-stone-200 flex items-center justify-center transition-all">
            <X className="w-4 h-4 text-stone-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Media Type</label>
            <div className="flex gap-2 mt-1.5">
              {(['image', 'video', 'audio', 'document'] as MediaType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setMediaType(type)}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-xl border transition-all capitalize ${
                    mediaType === type
                      ? 'bg-forest-deep text-white border-forest-deep'
                      : 'bg-white text-stone-600 border-[#eaebe4] hover:border-forest-deep'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Media URL</label>
            <input
              type="url"
              value={mediaUrl}
              onChange={e => setMediaUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 font-mono"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Caption (optional)</label>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Add a caption..."
              rows={2}
              className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 resize-none"
            />
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-600">{error}</div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] text-stone-400">{TOKEN_COST.MEDIA} tokens</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#eaebe4] flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-[#eaebe4] rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!mediaUrl.trim() || sending}
            className="flex-1 py-2.5 bg-forest-deep text-white text-xs font-bold rounded-xl hover:bg-[#33301a] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {sending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <SendHorizontal className="w-3.5 h-3.5" />}
            {sending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
