import React, { useState, useRef } from 'react';
import { X, SendHorizontal, RefreshCw } from 'lucide-react';
import type { Instance } from '../../services/api';
import { instancesApi } from '../../services/api';
import { uploadsApi } from '../../services/api';
import { TOKEN_COST } from '../../utils/tokenCosts';
import { MediaPreview } from './MediaPreview.js';
import { MediaEditorToolbar } from './MediaEditorToolbar.js';

type MediaType = 'image' | 'video' | 'audio' | 'document';

interface MediaInlineEditorProps {
  instance: Instance;
  to: string;
  onSend: (tokenCost: number) => void;
  onCancel: () => void;
}

export default function MediaInlineEditor({ instance, to, onSend, onCancel }: MediaInlineEditorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const isImageOrVideo = f.type.startsWith('image/') || f.type.startsWith('video/');
    if (isImageOrVideo) {
      const reader = new FileReader();
      reader.onload = ev => setPreview(ev.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreview('');
    }
    const mt = f.type.startsWith('image/') ? 'image'
      : f.type.startsWith('video/') ? 'video'
      : f.type.startsWith('audio/') ? 'audio' : 'document';
    setMediaType(mt);
  };

  const handleSend = async () => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const uploadRes = await uploadsApi.uploadImage(base64);
      if (!uploadRes.success || !uploadRes.data?.url) {
        setError('Upload failed. Please try again.');
        return;
      }
      setUploading(false);
      setSending(true);
      const res = await instancesApi.sendMedia(instance.name, to, uploadRes.data.url, mediaType, caption.trim());
      if (res.success) {
        onSend(TOKEN_COST.MEDIA);
        onCancel();
      } else {
        setError(res.error || 'Send failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      setSending(false);
    }
  };

  return (
    <div className="border-t border-[#eaebe4] bg-white p-3">
      <div className="flex items-start gap-2">
        <MediaPreview
          preview={preview}
          file={file}
          onPick={() => fileInputRef.current?.click()}
          onClear={() => { setFile(null); setPreview(''); }}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,audio/*,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex-1 space-y-2">
          {file && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-forest-deep truncate flex-1">{file.name}</span>
              <button onClick={() => { setFile(null); setPreview(''); }} className="text-stone-400 hover:text-stone-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {file && <MediaEditorToolbar mediaType={mediaType} onTypeChange={setMediaType} />}

          <textarea
            value={caption}
            onChange={e => setCaption(e.target.value)}
            placeholder="Add a caption..."
            rows={1}
            className="w-full px-3 py-2 text-xs border border-[#eaebe4] rounded-2xl focus:outline-none focus:border-yellow-500 resize-none bg-stone-50"
          />

          {error && <p className="text-[10px] text-red-500">{error}</p>}

          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-xs font-bold text-stone-500 hover:text-stone-700 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={!file || uploading || sending}
              className="flex-1 py-1.5 bg-forest-deep text-white text-xs font-bold rounded-2xl hover:bg-[#33301a] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
            >
              {uploading ? <><RefreshCw className="w-3 h-3 animate-spin" /> Uploading...</>
               : sending ? <><RefreshCw className="w-3 h-3 animate-spin" /> Sending...</>
               : <><SendHorizontal className="w-3 h-3" /> Send</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
