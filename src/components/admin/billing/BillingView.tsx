import { useState, useEffect } from 'react';
import { Coins, Package, Zap, Check, X, Pencil, Trash2, Plus, AlertCircle } from 'lucide-react';
import { adminApi, type TokenCost, type TokenPackage } from '../../../services/admin';

type Tab = 'costs' | 'packages';

export default function BillingView() {
  const [tab, setTab] = useState<Tab>('costs');
  const [costs, setCosts] = useState<TokenCost[]>([]);
  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const [showPkgForm, setShowPkgForm] = useState(false);
  const [pkgForm, setPkgForm] = useState({ name: '', tokens: '', priceKsh: '', bonusTokens: '0' });
  const [pkgEditing, setPkgEditing] = useState<string | null>(null);
  const [pkgFormEdit, setPkgFormEdit] = useState({ name: '', tokens: '', priceKsh: '', bonusTokens: '0', isActive: true });

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadCosts() {
    setLoading(true); setError(null);
    try {
      const res = await adminApi.getTokenCosts();
      if (res.success && res.data) setCosts(res.data);
      else setError(res.error || 'Failed to load');
    } finally { setLoading(false); }
  }

  async function loadPackages() {
    setLoading(true); setError(null);
    try {
      const res = await adminApi.getTokenPackages(true);
      if (res.success && res.data) setPackages(res.data);
      else setError(res.error || 'Failed to load');
    } finally { setLoading(false); }
  }

  useEffect(() => { tab === 'costs' ? loadCosts() : loadPackages(); }, [tab]);

  async function handleCostToggle(cost: TokenCost) {
    setSaving(cost.id);
    try {
      const res = await adminApi.setTokenCostActive(cost.id, !cost.isActive);
      if (res.success) { await loadCosts(); showToast('Updated', 'success'); }
      else showToast(res.error || 'Failed', 'error');
    } finally { setSaving(null); }
  }

  async function handleCostSave(cost: TokenCost, newCost: number) {
    setSaving(cost.id);
    try {
      const res = await adminApi.updateTokenCost(cost.id, newCost);
      if (res.success) { await loadCosts(); showToast('Saved', 'success'); }
      else showToast(res.error || 'Failed', 'error');
    } finally { setSaving(null); }
  }

  async function handleCreatePackage() {
    const tokens = parseInt(pkgForm.tokens);
    const priceKsh = parseFloat(pkgForm.priceKsh);
    if (!pkgForm.name || isNaN(tokens) || isNaN(priceKsh)) { showToast('Name, tokens, price required', 'error'); return; }
    setSaving('create');
    try {
      const res = await adminApi.createTokenPackage({ name: pkgForm.name, tokens, priceKsh, bonusTokens: parseInt(pkgForm.bonusTokens) || 0 });
      if (res.success) {
        setShowPkgForm(false);
        setPkgForm({ name: '', tokens: '', priceKsh: '', bonusTokens: '0' });
        await loadPackages();
        showToast('Package created', 'success');
      } else { showToast(res.error || 'Failed', 'error'); }
    } finally { setSaving(null); }
  }

  async function handleUpdatePackage(id: string) {
    const tokens = parseInt(pkgFormEdit.tokens);
    const priceKsh = parseFloat(pkgFormEdit.priceKsh);
    if (isNaN(tokens) || isNaN(priceKsh)) { showToast('Tokens and price required', 'error'); return; }
    setSaving(id);
    try {
      const res = await adminApi.updateTokenPackage(id, {
        name: pkgFormEdit.name || undefined, tokens, priceKsh,
        bonusTokens: parseInt(pkgFormEdit.bonusTokens) || 0,
        isActive: pkgFormEdit.isActive,
      });
      if (res.success) { setPkgEditing(null); await loadPackages(); showToast('Updated', 'success'); }
      else showToast(res.error || 'Failed', 'error');
    } finally { setSaving(null); }
  }

  async function handleDeletePackage(id: string) {
    if (!confirm('Delete this package? Existing purchases are unaffected.')) return;
    setSaving(id);
    try {
      const res = await adminApi.deleteTokenPackage(id);
      if (res.success) { await loadPackages(); showToast('Deleted', 'success'); }
      else showToast(res.error || 'Failed', 'error');
    } finally { setSaving(null); }
  }

  const whatsappCosts = costs.filter(c => c.category === 'whatsapp');
  const aiCosts = costs.filter(c => c.category === 'ai');

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-xl text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-900/80 text-green-300 border border-green-700' : 'bg-red-900/80 text-red-300 border border-red-700'
        }`}>{toast.msg}</div>
      )}

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
          <Coins size={18} className="text-yellow-500" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Billing Management</h2>
          <p className="text-xs text-[#6e684a]">Configure token costs and purchase packages</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-[#1a1915] border border-[#2d2813] rounded-xl w-fit">
        {([['costs', 'Token Costs', Zap], ['packages', 'Packages', Package]] as const).map(([t, label, Icon]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              tab === t ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'text-[#6e684a] hover:text-white'
            }`}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-800/40 rounded-xl text-xs text-red-400">
          <AlertCircle size={13} />{error}
        </div>
      )}

      {tab === 'costs' && !loading && (
        <div className="grid grid-cols-2 gap-6">
          <CostSection title="WhatsApp Messages" costs={whatsappCosts} onToggle={handleCostToggle} onSave={handleCostSave} saving={saving} />
          <CostSection title="AI Chatbot Units" costs={aiCosts} onToggle={handleCostToggle} onSave={handleCostSave} saving={saving} />
        </div>
      )}

      {tab === 'packages' && !loading && (
        <div className="space-y-4">
          {showPkgForm ? (
            <div className="bg-[#1a1915] border border-[#2d2813] rounded-2xl p-5 space-y-3">
              <p className="text-xs font-bold text-white">New Package</p>
              <div className="grid grid-cols-2 gap-3">
                <input value={pkgForm.name} onChange={e => setPkgForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Package name" className="px-3 py-2 bg-[#181711] border border-[#2d2813] rounded-xl text-xs text-white placeholder-[#3d3a1e]" />
                <input value={pkgForm.tokens} onChange={e => setPkgForm(p => ({ ...p, tokens: e.target.value }))}
                  placeholder="Tokens" type="number" className="px-3 py-2 bg-[#181711] border border-[#2d2813] rounded-xl text-xs text-white placeholder-[#3d3a1e]" />
                <input value={pkgForm.priceKsh} onChange={e => setPkgForm(p => ({ ...p, priceKsh: e.target.value }))}
                  placeholder="Price KES" type="number" className="px-3 py-2 bg-[#181711] border border-[#2d2813] rounded-xl text-xs text-white placeholder-[#3d3a1e]" />
                <input value={pkgForm.bonusTokens} onChange={e => setPkgForm(p => ({ ...p, bonusTokens: e.target.value }))}
                  placeholder="Bonus tokens" type="number" className="px-3 py-2 bg-[#181711] border border-[#2d2813] rounded-xl text-xs text-white placeholder-[#3d3a1e]" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreatePackage} disabled={saving === 'create'}
                  className="px-3 py-1.5 bg-yellow-500 text-[#181711] rounded-lg text-xs font-bold hover:bg-yellow-400 disabled:opacity-50">
                  {saving === 'create' ? 'Creating…' : 'Create Package'}
                </button>
                <button onClick={() => setShowPkgForm(false)} className="px-3 py-1.5 text-[#6e684a] text-xs hover:text-white">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowPkgForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a1915] border border-dashed border-[#2d2813] rounded-xl text-xs text-[#6e684a] hover:text-white hover:border-[#3d3a1e] transition-all">
              <Plus size={13} />Add Package
            </button>
          )}

          <div className="bg-[#1a1915] border border-[#2d2813] rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#2d2813]">
                  <th className="text-left px-4 py-3 text-[#6e684a] font-bold">Package</th>
                  <th className="text-right px-4 py-3 text-[#6e684a] font-bold">Tokens</th>
                  <th className="text-right px-4 py-3 text-[#6e684a] font-bold">Bonus</th>
                  <th className="text-right px-4 py-3 text-[#6e684a] font-bold">Price (KES)</th>
                  <th className="text-right px-4 py-3 text-[#6e684a] font-bold">KES/Token</th>
                  <th className="text-center px-4 py-3 text-[#6e684a] font-bold">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {packages.map(pkg => (
                  <tr key={pkg.id} className="border-b border-[#2d2813]/50 last:border-0 hover:bg-[#181711]/50">
                    {pkgEditing === pkg.id ? (
                      <>
                        <td className="px-4 py-2"><input value={pkgFormEdit.name} onChange={e => setPkgFormEdit(p => ({ ...p, name: e.target.value }))}
                          className="w-full px-2 py-1 bg-[#181711] border border-[#2d2813] rounded text-white text-xs" /></td>
                        <td className="px-4 py-2"><input value={pkgFormEdit.tokens} onChange={e => setPkgFormEdit(p => ({ ...p, tokens: e.target.value }))}
                          type="number" className="w-full px-2 py-1 bg-[#181711] border border-[#2d2813] rounded text-white text-xs" /></td>
                        <td className="px-4 py-2"><input value={pkgFormEdit.bonusTokens} onChange={e => setPkgFormEdit(p => ({ ...p, bonusTokens: e.target.value }))}
                          type="number" className="w-full px-2 py-1 bg-[#181711] border border-[#2d2813] rounded text-white text-xs" /></td>
                        <td className="px-4 py-2"><input value={pkgFormEdit.priceKsh} onChange={e => setPkgFormEdit(p => ({ ...p, priceKsh: e.target.value }))}
                          type="number" className="w-full px-2 py-1 bg-[#181711] border border-[#2d2813] rounded text-white text-xs" /></td>
                        <td className="px-4 py-2 text-right text-[#6e684a]">—</td>
                        <td className="px-4 py-2 text-center">
                          <button onClick={() => setPkgFormEdit(p => ({ ...p, isActive: !p.isActive }))}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${pkgFormEdit.isActive ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                            {pkgFormEdit.isActive ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => handleUpdatePackage(pkg.id)} disabled={saving === pkg.id} className="p-1 text-green-400 hover:text-green-300 disabled:opacity-50"><Check size={13} /></button>
                            <button onClick={() => setPkgEditing(null)} className="p-1 text-[#6e684a] hover:text-white"><X size={13} /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-white font-medium">{pkg.name}</td>
                        <td className="px-4 py-3 text-right text-[#cbd3cf]">{pkg.tokens.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-green-400">{pkg.bonus_tokens > 0 ? `+${pkg.bonus_tokens.toLocaleString()}` : '—'}</td>
                        <td className="px-4 py-3 text-right text-yellow-500 font-bold">KES {pkg.price_kes.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-[#6e684a]">{(pkg.price_kes / (pkg.tokens + pkg.bonus_tokens)).toFixed(3)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${pkg.is_active ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'}`}>
                            {pkg.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 justify-end">
                            <button onClick={() => { setPkgEditing(pkg.id); setPkgFormEdit({ name: pkg.name, tokens: String(pkg.tokens), priceKsh: String(pkg.price_kes), bonusTokens: String(pkg.bonus_tokens), isActive: Boolean(pkg.is_active) }); }}
                              className="p-1 text-[#6e684a] hover:text-white"><Pencil size={12} /></button>
                            <button onClick={() => handleDeletePackage(pkg.id)} className="p-1 text-[#6e684a] hover:text-red-400"><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {packages.length === 0 && <p className="text-center py-8 text-[#6e684a] text-xs">No packages yet</p>}
          </div>
        </div>
      )}

      {loading && <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>}
    </div>
  );
}

function CostSection({ title, costs, onToggle, onSave, saving }: {
  title: string; costs: TokenCost[];
  onToggle: (c: TokenCost) => void; onSave: (c: TokenCost, n: number) => void; saving: string | null;
}) {
  const [editId, setEditId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');

  return (
    <div className="bg-[#1a1915] border border-[#2d2813] rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-[#2d2813]"><p className="text-xs font-bold text-white">{title}</p></div>
      <div className="divide-y divide-[#2d2813]/50">
        {costs.map(cost => (
          <div key={cost.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white font-medium truncate">{cost.displayName}</p>
              <p className="text-[10px] text-[#6e684a] truncate">{cost.description}</p>
            </div>
            <div className="flex items-center gap-2 ml-4 shrink-0">
              {editId === cost.id ? (
                <>
                  <input value={editVal} onChange={e => setEditVal(e.target.value)} type="number" min="0"
                    className="w-16 px-2 py-1 bg-[#181711] border border-[#2d2813] rounded text-xs text-white text-right" />
                  <button onClick={() => { onSave(cost, parseInt(editVal) || 0); setEditId(null); }} className="text-green-400 hover:text-green-300"><Check size={13} /></button>
                  <button onClick={() => setEditId(null)} className="text-[#6e684a] hover:text-white"><X size={13} /></button>
                </>
              ) : (
                <>
                  <button onClick={() => { setEditId(cost.id); setEditVal(String(cost.tokenCost)); }}
                    className="text-xs font-mono font-bold text-yellow-500 hover:text-yellow-400 min-w-[24px] text-right">
                    {cost.tokenCost}
                  </button>
                  <button onClick={() => onToggle(cost)} disabled={saving === cost.id}
                    className={`p-1 rounded text-[10px] font-bold ${cost.isActive ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'} ${saving === cost.id ? 'opacity-50' : ''}`}>
                    {cost.isActive ? 'ON' : 'OFF'}
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
