import type { Contact } from '../../services/api';
import SegmentAudiencePicker from './SegmentAudiencePicker.js';

export type AudienceMode = 'paste' | 'contacts' | 'segment';

interface AudiencePickerProps {
  mode: AudienceMode;
  setMode: (m: AudienceMode) => void;
  pastedPhones: string;
  setPastedPhones: (s: string) => void;
  selectedContactIds: Set<string>;
  setSelectedContactIds: (updater: (prev: Set<string>) => Set<string>) => void;
  savedContacts: Contact[];
  selectedSegmentId: string | null;
  onSegmentPicked: (id: string | null, phones: string[], count: number) => void;
}

export default function AudiencePicker({
  mode, setMode, pastedPhones, setPastedPhones,
  selectedContactIds, setSelectedContactIds, savedContacts,
  selectedSegmentId, onSegmentPicked,
}: AudiencePickerProps) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-[#6e684a] uppercase mb-1">Audience</label>
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <button onClick={() => setMode('paste')}
          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${mode === 'paste' ? 'bg-[#eab308] text-[#181711] border-[#eab308]' : 'bg-[#1a1915] text-[#6e684a] border-[#2d2813] hover:border-[#3d3a1e]'}`}>
          Paste numbers
        </button>
        <button onClick={() => setMode('contacts')}
          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${mode === 'contacts' ? 'bg-[#eab308] text-[#181711] border-[#eab308]' : 'bg-[#1a1915] text-[#6e684a] border-[#2d2813] hover:border-[#3d3a1e]'}`}>
          From contacts ({savedContacts.length})
        </button>
        <button onClick={() => setMode('segment')}
          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${mode === 'segment' ? 'bg-[#eab308] text-[#181711] border-[#eab308]' : 'bg-[#1a1915] text-[#6e684a] border-[#2d2813] hover:border-[#3d3a1e]'}`}>
          From segment
        </button>
      </div>
      {mode === 'paste' ? (
        <textarea value={pastedPhones} onChange={e => setPastedPhones(e.target.value)} rows={3}
          placeholder="+254712345678, +254798765432, … (one per line or comma-separated)"
          className="w-full px-3 py-2 border border-[#2d2813] bg-[#181711] rounded-xl text-xs text-[#a8a99e] focus:outline-none focus:border-[#eab308] font-mono placeholder:text-[#5a554a]" />
      ) : mode === 'contacts' ? (
        <div className="max-h-40 overflow-y-auto border border-[#2d2813] rounded-xl divide-y divide-[#2d2813] bg-[#1a1915]">
          {savedContacts.length === 0 ? (
            <p className="p-3 text-[11px] text-[#6e684a]">No contacts yet — import some from the Contacts section.</p>
          ) : savedContacts.map(c => {
            const sel = selectedContactIds.has(c.id);
            return (
              <label key={c.id} className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer ${sel ? 'bg-[#eab308]/10' : 'hover:bg-[#181711]'}`}>
                <input type="checkbox" checked={sel} onChange={() => {
                  setSelectedContactIds(prev => {
                    const next = new Set(prev);
                    if (next.has(c.id)) next.delete(c.id); else next.add(c.id);
                    return next;
                  });
                }} className="rounded border-[#2d2813] text-[#eab308] focus:ring-[#eab308]" />
                <span className="text-[11px] text-[#a8a99e] truncate flex-1">{c.name || c.phone}</span>
                <span className="text-[10px] font-mono text-[#6e684a]">{c.phone}</span>
              </label>
            );
          })}
        </div>
      ) : (
        <SegmentAudiencePicker selectedSegmentId={selectedSegmentId} onSelect={onSegmentPicked} />
      )}
    </div>
  );
}
