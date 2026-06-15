import React, { useState } from 'react';
import { X, SendHorizontal, RefreshCw, List, Plus, Trash2 } from 'lucide-react';
import type { Instance } from '../../services/api';
import { instancesApi } from '../../services/api';
import { TOKEN_COST } from '../../utils/tokenCosts';

interface ListInlineEditorProps {
  instance: Instance;
  to: string;
  onSend: (tokenCost: number) => void;
  onCancel: () => void;
}

interface Row { title: string; description: string; rowId: string; }
interface Section { title: string; rows: Row[]; }

export default function ListInlineEditor({ instance, to, onSend, onCancel }: ListInlineEditorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [buttonText, setButtonText] = useState('View Options');
  const [footerText, setFooterText] = useState('');
  const [sections, setSections] = useState<Section[]>([{ title: '', rows: [{ title: '', description: '', rowId: '' }] }]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const updateSectionTitle = (i: number, val: string) => setSections(p => p.map((s, idx) => idx === i ? { ...s, title: val } : s));
  const addSection = () => setSections(p => [...p, { title: '', rows: [{ title: '', description: '', rowId: '' }]}]);
  const removeSection = (i: number) => setSections(p => p.filter((_, idx) => idx !== i));
  const addRow = (si: number) => setSections(p => p.map((s, idx) => idx === si ? { ...s, rows: [...s.rows, { title: '', description: '', rowId: '' }] } : s));
  const removeRow = (si: number, ri: number) => setSections(p => p.map((s, idx) => idx === si ? { ...s, rows: s.rows.filter((_, r) => r !== ri) } : s));
  const updateRow = (si: number, ri: number, field: keyof Row, val: string) =>
    setSections(p => p.map((s, idx) => idx === si ? {
      ...s, rows: s.rows.map((r, rIdx) => rIdx === ri ? { ...r, [field]: val, rowId: field === 'title' ? val.toLowerCase().replace(/\s+/g, '_') : r.rowId } : r)
    } : s));

  const handleSend = async () => {
    if (!title.trim() || !buttonText.trim()) { setError('Title and button text are required'); return; }
    const validSections = sections.filter(s => s.title.trim() && s.rows.some(r => r.title.trim()));
    if (validSections.length === 0) { setError('At least one section with one row is required'); return; }
    setSending(true); setError('');
    try {
      const res = await instancesApi.sendList(instance.name, to, {
        title: title.trim(), description: description.trim(), buttonText: buttonText.trim(),
        footerText: footerText.trim(), sections: validSections,
      });
      if (res.success) { onSend(TOKEN_COST.LIST); onCancel(); }
      else { setError(res.error || 'Failed to send'); }
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to send'); }
    finally { setSending(false); }
  };

  return (
    <div className="border-t border-[#eaebe4] bg-white p-3 max-h-80 overflow-y-auto">
      <div className="flex items-start gap-2">
        <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
          <List className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title"
              className="flex-1 px-3 py-1.5 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 font-bold" />
            <input value={buttonText} onChange={e => setButtonText(e.target.value)} placeholder="Button"
              className="flex-1 px-3 py-1.5 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500" />
          </div>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description (optional)"
            className="w-full px-3 py-1.5 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500" />

          <div className="space-y-2">
            {sections.map((section, si) => (
              <div key={si} className="border border-[#eaebe4] rounded-xl p-2 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <input value={section.title} onChange={e => updateSectionTitle(si, e.target.value)}
                    placeholder="Section title" className="flex-1 px-2 py-1 text-[10px] border border-[#eaebe4] rounded-lg focus:outline-none focus:border-yellow-500" />
                  {sections.length > 1 && (
                    <button onClick={() => removeSection(si)} className="text-stone-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                  )}
                </div>
                {section.rows.map((row, ri) => (
                  <div key={ri} className="flex items-center gap-1.5 pl-2">
                    <input value={row.title} onChange={e => updateRow(si, ri, 'title', e.target.value)}
                      placeholder="Row title" className="flex-1 px-2 py-1 text-[10px] border border-[#eaebe4] rounded-lg focus:outline-none focus:border-yellow-500" />
                    <input value={row.description} onChange={e => updateRow(si, ri, 'description', e.target.value)}
                      placeholder="Desc" className="flex-1 px-2 py-1 text-[10px] border border-[#eaebe4] rounded-lg focus:outline-none focus:border-yellow-500" />
                    {section.rows.length > 1 && (
                      <button onClick={() => removeRow(si, ri)} className="text-stone-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                    )}
                  </div>
                ))}
                <button onClick={() => addRow(si)} className="flex items-center gap-1 text-[10px] font-bold text-yellow-600 hover:text-yellow-700 px-1 py-0.5 transition-all">
                  <Plus className="w-3 h-3" /> Add Row
                </button>
              </div>
            ))}
            <button onClick={addSection} className="flex items-center gap-1 text-[10px] font-bold text-yellow-600 hover:text-yellow-700 px-2 py-1 transition-all">
              <Plus className="w-3 h-3" /> Add Section
            </button>
          </div>

          {error && <p className="text-[10px] text-red-500">{error}</p>}

          <div className="flex gap-2">
            <button onClick={onCancel} className="px-3 py-2 text-xs font-bold text-stone-400 hover:text-stone-600 transition-all">Cancel</button>
            <button
              onClick={handleSend}
              disabled={!title.trim() || !buttonText.trim() || sending}
              className="flex-1 py-2 bg-forest-deep text-white text-xs font-bold rounded-xl hover:bg-[#33301a] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
            >
              {sending ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Sending...</> : <><SendHorizontal className="w-3.5 h-3.5" /> Send</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
