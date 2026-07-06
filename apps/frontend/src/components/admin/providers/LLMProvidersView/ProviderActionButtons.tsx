/**
 * ProviderActionButtons — row of icon buttons inside a ProviderCard.
 */
import { Pencil, Trash2, TestTube, Star, StarOff, Globe, Loader2 } from 'lucide-react';
import { ToggleSwitch } from './shared';

interface Props {
  provider: { id: string; name: string; enabled: number; is_default: number; is_shared: number; api_key_last4: string };
  onToggleEnabled: (next: boolean) => void;
  onToggleShared: () => void;
  onSetDefault: () => void;
  onTest: () => void;
  onEdit: () => void;
  onDelete: () => void;
  togglingEnabled: boolean;
  togglingShared: boolean;
  settingDefault: boolean;
  testing: boolean;
  deleting: boolean;
}

export function ProviderActionButtons({
  provider, onToggleEnabled, onToggleShared, onSetDefault, onTest, onEdit, onDelete,
  togglingEnabled, togglingShared, settingDefault, testing, deleting,
}: Props) {
  const hasApiKey = Boolean(provider.api_key_last4);

  return (
    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()} role="group" aria-label={`Actions for ${provider.name}`}>
      <ToggleSwitch checked={Boolean(provider.enabled)} onChange={onToggleEnabled} disabled={togglingEnabled} label={`Enable ${provider.name}`} />

      <button onClick={onToggleShared} disabled={togglingShared || !hasApiKey}
        className={`p-2 rounded-lg transition-colors disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
          provider.is_shared ? 'text-blue-400 bg-blue-500/10 border border-blue-500/30' : 'text-[#525345] hover:text-blue-400 hover:bg-blue-500/10'
        }`}
        title={provider.is_shared ? 'Stop sharing with clients' : 'Make available to clients'}
        aria-label={provider.is_shared ? 'Stop sharing' : 'Share with clients'}>
        {togglingShared ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
      </button>

      <button onClick={onSetDefault} disabled={settingDefault || Boolean(provider.is_default)}
        className={`p-2 rounded-lg transition-colors disabled:cursor-default focus:outline-none focus:ring-2 focus:ring-yellow-500/30 ${
          provider.is_default ? 'text-yellow-400 bg-yellow-500/10' : 'text-[#525345] hover:text-yellow-400 hover:bg-yellow-500/10 disabled:opacity-40'
        }`}
        title={provider.is_default ? 'This is the default provider' : 'Set as default'}
        aria-label={provider.is_default ? 'Default provider' : 'Set as default'}>
        {settingDefault ? <Loader2 size={14} className="animate-spin" /> : provider.is_default ? <Star size={14} fill="currentColor" /> : <StarOff size={14} />}
      </button>

      <button onClick={onTest} disabled={testing}
        className="p-2 rounded-lg text-[#525345] hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
        title="Test connection" aria-label="Test connection">
        {testing ? <Loader2 size={14} className="animate-spin" /> : <TestTube size={14} />}
      </button>

      <button onClick={onEdit}
        className="p-2 rounded-lg text-[#525345] hover:text-yellow-400 hover:bg-yellow-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500/30"
        title="Edit" aria-label="Edit provider">
        <Pencil size={14} />
      </button>

      <button onClick={onDelete} disabled={deleting}
        className="p-2 rounded-lg text-[#525345] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-red-500/30"
        title="Delete" aria-label="Delete provider">
        {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
      </button>
    </div>
  );
}
