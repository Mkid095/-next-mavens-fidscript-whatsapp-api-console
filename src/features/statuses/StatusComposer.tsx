import { useState } from 'react';
import { Send, Calendar, AlertCircle } from 'lucide-react';
import type { Instance } from '../../services/api';
import type { MediaAsset, StatusPostKind } from '../../data/api/platform.js';
import MediaSlot, { PickerLauncher } from './MediaSlot.js';

interface StatusComposerProps {
  instances: Instance[];
  onSubmit: (body: {
    instance_id: string;
    kind: StatusPostKind;
    content?: string;
    media_id?: string;
    caption?: string;
    scheduled_at?: string | null;
  }) => Promise<void>;
  submitting: boolean;
  error: string | null;
}

/**
 * Phase 5 Slice E — Status composer. Compact form for posting a text or
 * image/audio status, optionally scheduled for a future time.
 */
export default function StatusComposer({ instances, onSubmit, submitting, error }: StatusComposerProps) {
  const [instanceId, setInstanceId] = useState<string>(instances[0]?.id || '');
  const [kind, setKind] = useState<StatusPostKind>('text');
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<MediaAsset | null>(null);
  const [caption, setCaption] = useState('');
  const [schedule, setSchedule] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  const canSubmit = instanceId && (
    kind === 'text' ? content.trim().length > 0
    : !!media
  );

  const submit = async (postNow: boolean) => {
    if (!canSubmit) return;
    await onSubmit({
      instance_id: instanceId,
      kind,
      content: kind === 'text' ? content.trim() : undefined,
      media_id: kind !== 'text' ? media?.id : undefined,
      caption: caption.trim() || undefined,
      scheduled_at: postNow ? null : (scheduledAt ? new Date(scheduledAt).toISOString() : null),
    });
    setContent(''); setMedia(null); setCaption(''); setSchedule(false); setScheduledAt('');
  };

  return (
    <div className="p-4 bg-[#1a1915] border border-[#2d2813] rounded-2xl space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold text-[#6e684a] uppercase mb-1">Send from</label>
          <select value={instanceId} onChange={e => setInstanceId(e.target.value)}
            className="w-full px-3 py-2 border border-[#2d2813] bg-[#181711] text-[#a8a99e] rounded-xl text-xs focus:outline-none focus:border-[#eab308]">
            {instances.map(i => (
              <option key={i.id} value={i.id}>
                {i.display_name || i.name} {i.phone_number ? `· ${i.phone_number}` : ''} [{i.status}]
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-[#6e684a] uppercase mb-1">Kind</label>
          <div className="flex items-center gap-1.5">
            {(['text', 'image', 'audio'] as StatusPostKind[]).map(k => (
              <button key={k} type="button" onClick={() => setKind(k)}
                className={`px-3 py-2 text-[10px] font-bold rounded-xl border transition-all ${kind === k ? 'bg-[#eab308] text-[#181711] border-[#eab308]' : 'bg-[#1a1915] text-[#6e684a] border-[#2d2813] hover:border-[#3d3a1e]'}`}>
                {k[0].toUpperCase() + k.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {kind === 'text' ? (
        <div>
          <label className="block text-[10px] font-bold text-[#6e684a] uppercase mb-1">Text</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={3} maxLength={700}
            placeholder="What do you want to share?"
            className="w-full px-3 py-2 border border-[#2d2813] bg-[#181711] text-[#a8a99e] rounded-xl text-xs focus:outline-none focus:border-[#eab308] placeholder:text-[#5a554a]" />
          <p className="text-[10px] text-[#6e684a] mt-0.5">{content.length}/700</p>
        </div>
      ) : (
        <div>
          <label className="block text-[10px] font-bold text-[#6e684a] uppercase mb-1">Media</label>
          {media ? (
            <MediaSlot media={media} kind={kind} onPick={setMedia} onClear={() => setMedia(null)} />
          ) : (
            <PickerLauncher kind={kind} onPicked={setMedia} open={pickerOpen} setOpen={setPickerOpen} />
          )}
          <div className="mt-2">
            <label className="block text-[10px] font-bold text-[#6e684a] uppercase mb-1">Caption (optional)</label>
            <input value={caption} onChange={e => setCaption(e.target.value)} maxLength={200}
              placeholder="Add a caption…"
              className="w-full px-3 py-2 border border-[#2d2813] bg-[#181711] text-[#a8a99e] rounded-xl text-xs focus:outline-none focus:border-[#eab308] placeholder:text-[#5a554a]" />
          </div>
        </div>
      )}

      <div className="p-3 bg-[#181711] border border-[#2d2813] rounded-xl space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={schedule} onChange={e => setSchedule(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-[#2d2813] text-[#eab308] focus:ring-[#eab308]" />
          <span className="text-[11px] font-bold text-[#a8a99e] flex items-center gap-1.5">
            <Calendar className="w-3 h-3" /> Schedule for later
          </span>
        </label>
        {schedule && (
          <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
            min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
            className="w-full px-3 py-2 border border-[#2d2813] bg-[#181711] text-[#a8a99e] rounded-xl text-xs focus:outline-none focus:border-[#eab308]" />
        )}
      </div>

      {error && (
        <p className="text-[11px] text-red-400 bg-red-900/30 border border-red-800/40 rounded-lg p-2 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {error}
        </p>
      )}

      <div className="flex items-center gap-2 justify-end pt-2 border-t border-[#2d2813]">
        {schedule ? (
          <button onClick={() => submit(false)} disabled={!canSubmit || !scheduledAt || submitting}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-[#eab308] text-[#181711] rounded-xl disabled:opacity-50">
            <Calendar className="w-3.5 h-3.5" /> {submitting ? 'Scheduling…' : 'Schedule status'}
          </button>
        ) : (
          <button onClick={() => submit(true)} disabled={!canSubmit || submitting}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-[#eab308] text-[#181711] rounded-xl disabled:opacity-50">
            <Send className="w-3.5 h-3.5" /> {submitting ? 'Posting…' : 'Post now'}
          </button>
        )}
      </div>
    </div>
  );
}
