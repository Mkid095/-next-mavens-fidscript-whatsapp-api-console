/**
 * DataSourcesPanel - CRUD UI for workspace data sources.
 * API: GET/POST/PUT/DELETE /api/platform/data-sources
 * Each data source has tools generated from its config, which can be attached to chatbots.
 */
import { useState, useEffect, useCallback } from 'react';
import { Database, Plus, Pencil, Trash2, X, ChevronDown, ChevronUp, Wrench, Loader2 } from 'lucide-react';

interface DataSource {
  id: string;
  name: string;
  description: string;
  type: string;
  config_json: string;
  is_builtin: number;
  enabled: number;
  created_at: string;
  updated_at: string;
  tools?: Tool[];
}

interface Tool {
  id: string;
  name: string;
  description: string;
  type: string;
  parameters_json: string;
  enabled: number;
}

interface DsForm {
  name: string;
  description: string;
  type: string;
  config_json: string;
}

const TYPE_OPTIONS = [
  { value: 'demo', label: 'Demo (built-in sample data)' },
  { value: 'api_endpoint', label: 'REST API endpoint' },
  { value: 'sql_table', label: 'SQL table or query' },
];

function ConfigEditor({ type, value, onChange }: { type: string; value: string; onChange: (v: string) => void }) {
  if (type === 'demo') {
    return (
      <div className="bg-[#1a1915] border border-[#2d2813] rounded-xl p-3 text-xs text-[#6e684a]">
        Demo data source - no configuration needed.
      </div>
    );
  }
  if (type === 'api_endpoint') {
    return (
      <div className="space-y-2">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={4}
          placeholder={'{\n  "url": "https://api.example.com/products",\n  "method": "GET",\n  "headers": { "Authorization": "Bearer ..." },\n  "response_path": "data.products"\n}'}
          className="w-full px-3 py-2 bg-[#181711] border border-[#2d2813] rounded-xl text-xs text-white font-mono placeholder-[#3d3a1e] focus:outline-none focus:border-yellow-500/50 resize-none"
        />
        <p className="text-[10px] text-[#6e684a]">JSON config: url, method, headers, response_path (optional JSONPath to array in response)</p>
      </div>
    );
  }
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={3}
      placeholder='{"table": "products", "columns": ["id", "name", "price"]}'
      className="w-full px-3 py-2 bg-[#181711] border border-[#2d2813] rounded-xl text-xs text-white font-mono placeholder-[#3d3a1e] focus:outline-none focus:border-yellow-500/50 resize-none"
    />
  );
}

function DataSourceCard({ ds, clientToken, onUpdated, onDeleted }: {
  ds: DataSource;
  clientToken: string;
  onUpdated: () => void;
  onDeleted: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<DsForm>({ name: ds.name, description: ds.description, type: ds.type, config_json: ds.config_json });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const r = await fetch(`/api/platform/data-sources/${ds.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientToken}` },
        body: JSON.stringify(form),
      });
      if (r.ok) { setEditing(false); onUpdated(); }
    } finally { setSaving(false); }
  }

  async function deleteSrc() {
    if (!confirm(`Delete "${ds.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const r = await fetch(`/api/platform/data-sources/${ds.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${clientToken}` } });
      if (r.ok) onDeleted();
    } finally { setDeleting(false); }
  }

  if (editing) {
    return (
      <div className="bg-[#1a1915] border border-yellow-500/30 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-yellow-500">Edit Data Source</p>
          <button onClick={() => setEditing(false)} className="text-[#6e684a] hover:text-white"><X size={13} /></button>
        </div>
        <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          className="w-full px-3 py-2 bg-[#181711] border border-[#2d2813] rounded-xl text-xs text-white placeholder-[#3d3a1e] focus:outline-none focus:border-yellow-500/50" placeholder="Name" />
        <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          className="w-full px-3 py-2 bg-[#181711] border border-[#2d2813] rounded-xl text-xs text-white placeholder-[#3d3a1e] focus:outline-none focus:border-yellow-500/50" placeholder="Description (optional)" />
        <ConfigEditor type={form.type} value={form.config_json} onChange={v => setForm(f => ({ ...f, config_json: v }))} />
        <div className="flex gap-2">
          <button onClick={save} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 text-[#181711] rounded-lg text-xs font-bold hover:bg-yellow-400 disabled:opacity-50">
            {saving && <Loader2 size={11} className="animate-spin" />}Save
          </button>
          <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-[#6e684a] text-xs hover:text-white">Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1915] border border-[#2d2813] rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <div className="w-8 h-8 rounded-lg bg-[#2d2813] flex items-center justify-center shrink-0">
          <Database size={14} className="text-yellow-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-white truncate">{ds.name}</p>
            {ds.is_builtin === 1 && <span className="text-[9px] bg-[#2d2813] text-[#6e684a] px-1.5 py-0.5 rounded">builtin</span>}
            {!ds.enabled && <span className="text-[9px] bg-red-900/40 text-red-400 px-1.5 py-0.5 rounded">disabled</span>}
          </div>
          {ds.description && <p className="text-[10px] text-[#6e684a] truncate">{ds.description}</p>}
          <p className="text-[9px] text-[#3d3a1e]">{ds.type}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setExpanded(v => !v)} className="p-1.5 text-[#6e684a] hover:text-white">
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {!ds.is_builtin && (
            <>
              <button onClick={() => setEditing(true)} className="p-1.5 text-[#6e684a] hover:text-white"><Pencil size={12} /></button>
              <button onClick={deleteSrc} disabled={deleting} className="p-1.5 text-[#6e684a] hover:text-red-400 disabled:opacity-50">
                {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
              </button>
            </>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-[#2d2813] px-4 py-3 space-y-2">
          {ds.tools && ds.tools.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[#6e684a] uppercase mb-1">Tools ({ds.tools.length})</p>
              <div className="space-y-1">
                {ds.tools.map(tool => (
                  <div key={tool.id} className="flex items-center gap-2 p-2 bg-[#181711] rounded-lg">
                    <Wrench size={11} className="text-yellow-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-white truncate">{tool.name}</p>
                      {tool.description && <p className="text-[10px] text-[#6e684a] truncate">{tool.description}</p>}
                    </div>
                    {!tool.enabled && <span className="text-[9px] text-red-400 shrink-0">disabled</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
          <details className="text-[10px]">
            <summary className="text-[#6e684a] cursor-pointer hover:text-white">View config</summary>
            <pre className="mt-1 p-2 bg-[#181711] rounded text-[9px] text-[#cbd3cf] overflow-auto max-h-32 font-mono">
              {JSON.stringify(JSON.parse(ds.config_json || '{}'), null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

export default function DataSourcesPanel({ clientToken }: { clientToken: string }) {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<DsForm>({ name: '', description: '', type: 'demo', config_json: '{}' });
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/platform/data-sources', { headers: { Authorization: `Bearer ${clientToken}` } });
      const j = await r.json();
      if (j.success) setSources(j.data);
    } finally { setLoading(false); }
  }, [clientToken]);

  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      const r = await fetch('/api/platform/data-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${clientToken}` },
        body: JSON.stringify(form),
      });
      if (r.ok) { setShowForm(false); setForm({ name: '', description: '', type: 'demo', config_json: '{}' }); load(); }
    } finally { setCreating(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Data Sources</h3>
          <p className="text-[11px] text-[#6e684a]">REST APIs, databases, or demo data - each generates AI tools</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 text-[#181711] rounded-xl text-xs font-bold hover:bg-yellow-400 transition-colors">
          <Plus size={13} />Add Source
        </button>
      </div>

      {showForm && (
        <div className="bg-[#1a1915] border border-yellow-500/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-yellow-500">New Data Source</p>
            <button onClick={() => setShowForm(false)} className="text-[#6e684a] hover:text-white"><X size={13} /></button>
          </div>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full px-3 py-2 bg-[#181711] border border-[#2d2813] rounded-xl text-xs text-white placeholder-[#3d3a1e] focus:outline-none focus:border-yellow-500/50" placeholder="Name (e.g. Product Catalog)" />
          <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full px-3 py-2 bg-[#181711] border border-[#2d2813] rounded-xl text-xs text-white placeholder-[#3d3a1e] focus:outline-none focus:border-yellow-500/50" placeholder="Description (optional)" />
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            className="w-full px-3 py-2 bg-[#181711] border border-[#2d2813] rounded-xl text-xs text-white focus:outline-none focus:border-yellow-500/50">
            {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ConfigEditor type={form.type} value={form.config_json} onChange={v => setForm(f => ({ ...f, config_json: v }))} />
          <div className="flex gap-2">
            <button onClick={create} disabled={creating || !form.name.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 text-[#181711] rounded-lg text-xs font-bold hover:bg-yellow-400 disabled:opacity-50">
              {creating && <Loader2 size={11} className="animate-spin" />}Create
            </button>
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-[#6e684a] text-xs hover:text-white">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : sources.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-[#2d2813] rounded-2xl">
          <Database size={24} className="mx-auto text-[#2d2813] mb-2" />
          <p className="text-xs text-[#6e684a]">No data sources yet</p>
          <p className="text-[10px] text-[#3d3a1e] mt-1">Add a source to generate AI tools</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sources.map(ds => (
            <DataSourceCard key={ds.id} ds={ds} clientToken={clientToken} onUpdated={load} onDeleted={load} />
          ))}
        </div>
      )}
    </div>
  );
}
