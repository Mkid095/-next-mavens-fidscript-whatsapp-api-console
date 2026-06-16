import { Send, X, Calendar, Trash2, Image as ImageIcon, Type, Music } from 'lucide-react';
import type { StatusPost } from '../../data/api/platform.js';
import type { Instance } from '../../services/api.js';
import { useMediaAssets } from '../../data/hooks/index.js';

interface StatusListProps {
  posts: StatusPost[];
  instances: Instance[];
  onPostNow: (id: string) => Promise<void>;
  onCancel: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  busyId: string | null;
}

const STATE_STYLES: Record<StatusPost['post_state'], { bg: string; text: string; label: string }> = {
  draft:     { bg: 'bg-stone-100',   text: 'text-stone-600',   label: 'Draft' },
  scheduled: { bg: 'bg-yellow-100',  text: 'text-yellow-800',  label: 'Scheduled' },
  posting:   { bg: 'bg-blue-100',    text: 'text-blue-800',    label: 'Posting' },
  posted:    { bg: 'bg-green-100',   text: 'text-green-800',   label: 'Posted' },
  failed:    { bg: 'bg-red-100',     text: 'text-red-800',     label: 'Failed' },
  cancelled: { bg: 'bg-stone-200',   text: 'text-stone-700',   label: 'Cancelled' },
};

function KindIcon({ kind }: { kind: StatusPost['kind'] }) {
  if (kind === 'text') return <Type className="w-3.5 h-3.5" />;
  if (kind === 'image') return <ImageIcon className="w-3.5 h-3.5" />;
  return <Music className="w-3.5 h-3.5" />;
}

function StatusBody({ post, instances }: { post: StatusPost; instances: Instance[] }) {
  const { assets } = useMediaAssets();
  const inst = instances.find(i => i.id === post.instance_id);
  if (post.kind === 'text') {
    return (
      <div className="flex-1 min-w-0">
        <p className="text-xs text-stone-800 line-clamp-2 whitespace-pre-wrap">{post.content || <em className="text-stone-400">(empty)</em>}</p>
      </div>
    );
  }
  const asset = post.media_id ? assets.find(a => a.id === post.media_id) : null;
  return (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      {asset?.kind === 'image' ? (
        <img src={asset.url} alt={asset.name} className="w-10 h-10 object-cover rounded-lg shrink-0" />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-stone-200 flex items-center justify-center text-stone-500 text-[9px] font-bold shrink-0">
          {asset ? asset.kind.toUpperCase() : '?'}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-forest-deep truncate">{asset?.name || '(media missing)'}</p>
        {post.caption && <p className="text-[10px] text-stone-500 truncate">{post.caption}</p>}
      </div>
    </div>
  );
}

export default function StatusList({ posts, instances, onPostNow, onCancel, onDelete, busyId }: StatusListProps) {
  if (posts.length === 0) {
    return (
      <div className="p-8 bg-white border border-[#eaebe4] rounded-2xl text-center space-y-2">
        <Type className="w-8 h-8 text-yellow-200 mx-auto" />
        <p className="text-xs font-bold text-forest-deep">No status posts yet</p>
        <p className="text-[10px] text-stone-500">Compose one above to share a text or media update to your WhatsApp status feed.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#eaebe4] rounded-2xl overflow-hidden">
      {posts.map(p => {
        const s = STATE_STYLES[p.post_state];
        const inst = instances.find(i => i.id === p.instance_id);
        const canPostNow = p.post_state === 'draft' || p.post_state === 'scheduled' || p.post_state === 'failed' || p.post_state === 'cancelled';
        const canCancel = p.post_state === 'scheduled' || p.post_state === 'draft';
        const canDelete = p.post_state !== 'posting';
        const isBusy = busyId === p.id;
        return (
          <div key={p.id} className="flex items-center gap-3 p-3 border-b border-[#eaebe4] last:border-b-0">
            <span className={`flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded shrink-0 ${s.bg} ${s.text}`}>
              <KindIcon kind={p.kind} /> {s.label}
            </span>
            <StatusBody post={p} instances={instances} />
            <div className="text-right shrink-0 space-y-0.5">
              <p className="text-[10px] text-stone-500 font-mono">{inst?.name || p.instance_id}</p>
              {p.scheduled_at && p.post_state === 'scheduled' && (
                <p className="text-[10px] text-yellow-700 flex items-center justify-end gap-1">
                  <Calendar className="w-3 h-3" /> {new Date(p.scheduled_at).toLocaleString()}
                </p>
              )}
              {p.posted_at && (
                <p className="text-[10px] text-green-700">↗ {new Date(p.posted_at).toLocaleString()}</p>
              )}
              {p.error_message && (
                <p className="text-[9px] text-red-600 max-w-[12rem] truncate" title={p.error_message}>{p.error_message}</p>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {canPostNow && (
                <button onClick={() => onPostNow(p.id)} disabled={isBusy}
                  className="p-1.5 text-stone-400 hover:text-forest-deep bg-white border border-stone-200 rounded-lg disabled:opacity-50" title="Post now">
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
              {canCancel && (
                <button onClick={() => onCancel(p.id)} disabled={isBusy}
                  className="p-1.5 text-stone-400 hover:text-yellow-700 bg-white border border-stone-200 rounded-lg disabled:opacity-50" title="Cancel">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {canDelete && (
                <button onClick={() => onDelete(p.id)} disabled={isBusy}
                  className="p-1.5 text-stone-400 hover:text-red-600 bg-white border border-stone-200 rounded-lg disabled:opacity-50" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
