import React, { useState } from 'react';
import { Plus } from 'lucide-react';

export const SOURCE_TYPES = [
  { id: 'url', label: 'Website URL' },
  { id: 'faq', label: 'FAQ Pairs' },
  { id: 'text', label: 'Plain Text' },
  { id: 'database', label: 'Database' },
] as const;

interface AddSourceFormProps {
  onAdd: (type: string, name: string, content: string) => void;
  onCancel: () => void;
}

export function AddSourceForm({ onAdd, onCancel }: AddSourceFormProps) {
  const [type, setType] = useState('url');
  const [name, setName] = useState('');
  const [content, setContent] = useState('');

  return (
    <div className="space-y-2 p-3 bg-[#1a1915] rounded-lg border border-[#2d2813]">
      <select value={type} onChange={e => setType(e.target.value)}
        className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-lg px-3 py-2 text-white text-xs focus:border-yellow-500/50 outline-none">
        {SOURCE_TYPES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
      </select>
      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Source name"
        className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-lg px-3 py-2 text-white text-xs focus:border-yellow-500/50 outline-none" />
      <textarea value={content} onChange={e => setContent(e.target.value)}
        placeholder={type === 'url' ? 'https://example.com' : type === 'faq' ? 'Question | Answer (one per line)' : 'Paste content here...'}
        rows={3}
        className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-lg px-3 py-2 text-white text-xs focus:border-yellow-500/50 outline-none resize-none" />
      <div className="flex gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 text-[10px] text-[#6e684a] hover:text-white">Cancel</button>
        <button onClick={() => name.trim() && content.trim() && onAdd(type, name.trim(), content.trim())}
          className="px-3 py-1.5 text-[10px] font-bold bg-yellow-500 text-stone-900 rounded-lg hover:bg-yellow-400">Add</button>
      </div>
    </div>
  );
}
