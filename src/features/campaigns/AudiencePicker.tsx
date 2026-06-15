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
  // Segment mode (Slice C)
  selectedSegmentId: string | null;
  onSegmentPicked: (id: string | null, phones: string[], count: number) => void;
}

/**
 * Audience source for a broadcast campaign. Three modes (Slice C added segment):
 *   - paste phone numbers
 *   - pick from saved contacts
 *   - pick a saved segment (resolved server-side via the segment filter resolver)
 * The parent holds the resolved phone list so it can pass it to the API.
 */
export default function AudiencePicker({
  mode, setMode, pastedPhones, setPastedPhones,
  selectedContactIds, setSelectedContactIds, savedContacts,
  selectedSegmentId, onSegmentPicked,
}: AudiencePickerProps) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-graphite uppercase mb-1">Audience</label>
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <button onClick={() => setMode('paste')}
          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${mode === 'paste' ? 'bg-forest-deep text-white border-forest-deep' : 'bg-white text-stone-600 border-stone-200'}`}>
          Paste numbers
        </button>
        <button onClick={() => setMode('contacts')}
          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${mode === 'contacts' ? 'bg-forest-deep text-white border-forest-deep' : 'bg-white text-stone-600 border-stone-200'}`}>
          From contacts ({savedContacts.length})
        </button>
        <button onClick={() => setMode('segment')}
          className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border ${mode === 'segment' ? 'bg-forest-deep text-white border-forest-deep' : 'bg-white text-stone-600 border-stone-200'}`}>
          From segment
        </button>
      </div>
      {mode === 'paste' ? (
        <textarea value={pastedPhones} onChange={e => setPastedPhones(e.target.value)} rows={3}
          placeholder="+254712345678, +254798765432, … (one per line or comma-separated)"
          className="w-full px-3 py-2 border border-[#eaebe4] bg-white rounded-xl text-xs focus:outline-none focus:border-yellow-500 font-mono" />
      ) : mode === 'contacts' ? (
        <div className="max-h-40 overflow-y-auto border border-[#eaebe4] rounded-xl divide-y divide-[#eaebe4] bg-white">
          {savedContacts.length === 0 ? (
            <p className="p-3 text-[11px] text-stone-400">No contacts yet — import some from the Contacts section.</p>
          ) : savedContacts.map(c => {
            const sel = selectedContactIds.has(c.id);
            return (
              <label key={c.id} className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer ${sel ? 'bg-yellow-50' : 'hover:bg-stone-50'}`}>
                <input type="checkbox" checked={sel} onChange={() => {
                  setSelectedContactIds(prev => {
                    const next = new Set(prev);
                    if (next.has(c.id)) next.delete(c.id); else next.add(c.id);
                    return next;
                  });
                }} />
                <span className="text-[11px] text-stone-700 truncate flex-1">{c.name || c.phone}</span>
                <span className="text-[10px] font-mono text-stone-400">{c.phone}</span>
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
