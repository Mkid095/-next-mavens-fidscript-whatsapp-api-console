import { Save, Send } from 'lucide-react';

interface CampaignBuilderFooterProps {
  canSave: boolean;
  saving: boolean;
  createdId: string | null;
  type: 'broadcast' | 'drip' | 'trigger';
  onSave: () => void;
  onLaunch: () => void;
  onCancel: () => void;
  onDone: () => void;
}

export default function CampaignBuilderFooter({
  canSave, saving, createdId, type,
  onSave, onLaunch, onCancel, onDone, onCreated,
}: CampaignBuilderFooterProps & { onCreated: () => void }) {
  if (createdId) {
    return (
      <div className="flex items-center gap-2 justify-end pt-2 border-t border-[#2d2813]">
        <button onClick={onCreated}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-[#eab308] text-[#181711] rounded-xl">
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 justify-end pt-2 border-t border-[#2d2813]">
      <button onClick={onCancel}
        className="px-3 py-2 text-xs font-bold bg-[#1a1915] border border-[#2d2813] text-[#a8a99e] rounded-xl">
        Cancel
      </button>
      <button onClick={onSave} disabled={!canSave || saving}
        className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-[#1a1915] border border-[#2d2813] text-[#a8a99e] rounded-xl disabled:opacity-50">
        <Save className="w-3.5 h-3.5" /> Save draft
      </button>
      {type === 'broadcast' && (
        <button onClick={onLaunch} disabled={!canSave || saving}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold bg-[#eab308] text-[#181711] rounded-xl disabled:opacity-50">
          <Send className="w-3.5 h-3.5" /> {saving ? 'Launching…' : 'Save & launch'}
        </button>
      )}
    </div>
  );
}
