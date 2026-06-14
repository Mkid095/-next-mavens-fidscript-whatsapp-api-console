import React, { useState } from 'react';
import { X, List, SendHorizontal, RefreshCw, Plus, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import type { Instance } from '../../../services/api';
import { instancesApi } from '../../../services/api';
import { TOKEN_COST } from '../../../utils/tokenCosts';

interface ListSendModalProps {
  instance: Instance;
  to: string;
  onClose: () => void;
  onSend: (tokenCost: number) => void;
}

interface Row {
  title: string;
  description: string;
  rowId: string;
}

interface Section {
  title: string;
  rows: Row[];
}

export default function ListSendModal({ instance, to, onClose, onSend }: ListSendModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [buttonText, setButtonText] = useState('View Options');
  const [footerText, setFooterText] = useState('');
  const [sections, setSections] = useState<Section[]>([{ title: 'Main Options', rows: [{ title: '', description: '', rowId: '' }] }]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const addSection = () => setSections(prev => [...prev, { title: '', rows: [{ title: '', description: '', rowId: '' }] }]);
  const removeSection = (i: number) => setSections(prev => prev.filter((_, idx) => idx !== i));
  const updateSectionTitle = (i: number, val: string) => setSections(prev => prev.map((s, idx) => idx === i ? { ...s, title: val } : s));
  const addRow = (si: number) => setSections(prev => prev.map((s, idx) => idx === si ? { ...s, rows: [...s.rows, { title: '', description: '', rowId: '' }] } : s));
  const removeRow = (si: number, ri: number) => setSections(prev => prev.map((s, idx) => idx === si ? { ...s, rows: s.rows.filter((_, r) => r !== ri) } : s));
  const updateRow = (si: number, ri: number, field: keyof Row, val: string) =>
    setSections(prev => prev.map((s, idx) => idx === si ? {
      ...s,
      rows: s.rows.map((r, rIdx) => rIdx === ri ? { ...r, [field]: val, rowId: field === 'title' ? val.toLowerCase().replace(/\s+/g, '_') : r.rowId } : r)
    } : s));

  const handleSend = async () => {
    if (!title.trim() || !buttonText.trim() || sections.length === 0) {
      setError('Title, button text, and at least one section are required');
      return;
    }
    const validSections = sections.filter(s => s.title.trim() && s.rows.some(r => r.title.trim()));
    if (validSections.length === 0) {
      setError('At least one section with at least one row is required');
      return;
    }
    setSending(true);
    setError('');
    try {
      const res = await instancesApi.sendList(instance.name, to, {
        title: title.trim(),
        description: description.trim(),
        buttonText: buttonText.trim(),
        footerText: footerText.trim(),
        sections: validSections,
      });
      if (res.success) {
        onSend(TOKEN_COST.LIST);
        onClose();
      } else {
        setError(res.error || 'Failed to send list');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send list');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl w-full max-w-md mx-4 overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="px-5 py-4 border-b border-[#eaebe4] flex items-center justify-between bg-[#fafaf5] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center">
              <List className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-forest-deep">Send List</h3>
              <p className="text-[10px] text-stone-500 font-mono">{to}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-stone-200 flex items-center justify-center transition-all">
            <X className="w-4 h-4 text-stone-500" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Choose an option" className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Select one from the list" className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Button Text *</label>
              <input type="text" value={buttonText} onChange={e => setButtonText(e.target.value)} placeholder="View Options" className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500" />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Footer</label>
              <input type="text" value={footerText} onChange={e => setFooterText(e.target.value)} placeholder="Powered by FIDScript" className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Sections</label>
              <button onClick={addSection} className="text-[10px] font-bold text-yellow-600 hover:text-yellow-700 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add Section
              </button>
            </div>
            <div className="space-y-3">
              {sections.map((section, si) => (
                <div key={si} className="border border-[#eaebe4] rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="text" value={section.title} onChange={e => updateSectionTitle(si, e.target.value)} placeholder="Section title" className="flex-1 px-3 py-1.5 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500" />
                    {sections.length > 1 && (
                      <button onClick={() => removeSection(si)} className="w-6 h-6 rounded-lg hover:bg-red-50 flex items-center justify-center text-stone-400 hover:text-red-500 transition-all">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {section.rows.map((row, ri) => (
                      <div key={ri} className="flex items-center gap-1.5">
                        <input type="text" value={row.title} onChange={e => updateRow(si, ri, 'title', e.target.value)} placeholder="Row title" className="flex-1 px-2 py-1.5 text-[10px] border border-[#eaebe4] rounded-lg focus:outline-none focus:border-yellow-500" />
                        <input type="text" value={row.description} onChange={e => updateRow(si, ri, 'description', e.target.value)} placeholder="Desc" className="flex-1 px-2 py-1.5 text-[10px] border border-[#eaebe4] rounded-lg focus:outline-none focus:border-yellow-500" />
                        {section.rows.length > 1 && (
                          <button onClick={() => removeRow(si, ri)} className="w-5 h-5 rounded-lg hover:bg-red-50 flex items-center justify-center text-stone-400 hover:text-red-500 transition-all">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button onClick={() => addRow(si)} className="text-[10px] font-bold text-yellow-600 hover:text-yellow-700 flex items-center gap-1">
                      <Plus className="w-3 h-3" /> Add Row
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && <div className="px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-600">{error}</div>}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] text-stone-400">{TOKEN_COST.LIST} token</span>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[#eaebe4] flex items-center gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-[#eaebe4] rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50 transition-all">Cancel</button>
          <button
            onClick={handleSend}
            disabled={!title.trim() || !buttonText.trim() || sending}
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
