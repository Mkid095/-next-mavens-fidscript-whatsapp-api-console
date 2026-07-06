import { useState } from 'react';
import { Plus, ShieldCheck, Loader2 } from 'lucide-react';
import { adminApi, type AdminKey } from '../../services/admin';

interface NewKeyDisplay {
  id: string;
  name: string;
  key: string;
}

interface KeyFormProps {
  onKeyCreated: (key: NewKeyDisplay) => void;
}

export default function KeyForm({ onKeyCreated }: KeyFormProps) {
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreating(true);
    const res = await adminApi.createKey(newKeyName.trim());
    setCreating(false);
    if (res.success && res.data) {
      onKeyCreated({
        id: res.data.id,
        name: res.data.name,
        key: (res.data as AdminKey & { key: string }).key,
      });
      setNewKeyName('');
    }
  };

  return (
    <div className="bg-white border border-[#e1e9e5]/80 rounded-[28px] p-5 space-y-4 h-fit shadow-sm">
      <h3 className="text-xs font-bold text-forest-deep uppercase tracking-wider">
        Generate Bearer Token
      </h3>
      <p className="text-[11px] text-[#4d665a]">
        Secret keys let your CRM, ERP, or transactional servers dispatch data straight into Nairobi routes.
      </p>
      <form onSubmit={handleCreate} className="space-y-4 text-xs font-semibold text-[#0f241d]">
        <div>
          <label className="block text-[10px] font-bold text-graphite uppercase tracking-wider mb-1.5">
            Credential Label
          </label>
          <input
            type="text"
            required
            placeholder="e.g. ERP System Webhook"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            className="w-full px-3 py-2.5 border border-[#dee9e4] text-[#0f241d] bg-white rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-xs"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="w-full inline-flex items-center justify-center gap-2 bg-forest-deep hover:bg-[#0c2e21] disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs transition-all"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 text-emerald-400" />}
          <span>{creating ? 'Generating…' : 'Register API key'}</span>
        </button>
      </form>
      <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-[18px] space-y-1.5">
        <h4 className="font-bold text-[11px] text-forest-deep flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          Cryptographic Safeguarding
        </h4>
        <p className="text-[10px] text-[#55695f] leading-relaxed font-medium">
          Tokens use the <code className="font-mono">fidscript_admin_</code> prefix. Keep credentials fully hidden.
          Avoid committing keys to public repositories.
        </p>
      </div>
    </div>
  );
}
