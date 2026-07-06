import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const CONNECTION_TYPES = [
  { id: 'postgresql', label: 'PostgreSQL' },
  { id: 'mysql', label: 'MySQL' },
  { id: 'rest-api', label: 'REST API' },
  { id: 'shopify', label: 'Shopify' },
  { id: 'woocommerce', label: 'WooCommerce' },
  { id: 'custom', label: 'Custom' },
] as const;

interface AddConnectionFormProps {
  onAdd: (type: string, name: string, config: Record<string, string>) => void;
  onCancel: () => void;
}

export function AddConnectionForm({ onAdd, onCancel }: AddConnectionFormProps) {
  const [type, setType] = useState('postgresql');
  const [name, setName] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('5432');
  const [database, setDatabase] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const submit = () => {
    if (!name.trim()) return;
    const config: Record<string, string> = { host, port, database, username, password };
    if (type === 'rest-api') { config.baseUrl = host; delete config.host; delete config.port; delete config.database; }
    onAdd(type, name.trim(), config);
  };

  const isDb = type === 'postgresql' || type === 'mysql';

  return (
    <div className="space-y-2 p-3 bg-[#1a1915] rounded-lg border border-[#2d2813]">
      <select value={type} onChange={e => setType(e.target.value)}
        className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-lg px-3 py-2 text-white text-xs focus:border-yellow-500/50 outline-none">
        {CONNECTION_TYPES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>
      <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Connection name"
        className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-lg px-3 py-2 text-white text-xs focus:border-yellow-500/50 outline-none" />
      {isDb ? (
        <>
          <div className="grid grid-cols-3 gap-2">
            <input type="text" value={host} onChange={e => setHost(e.target.value)} placeholder="Host"
              className="col-span-2 bg-[#0d0c0a] border border-[#2d2813] rounded-lg px-3 py-2 text-white text-xs focus:border-yellow-500/50 outline-none" />
            <input type="text" value={port} onChange={e => setPort(e.target.value)} placeholder="Port"
              className="bg-[#0d0c0a] border border-[#2d2813] rounded-lg px-3 py-2 text-white text-xs focus:border-yellow-500/50 outline-none" />
          </div>
          <input type="text" value={database} onChange={e => setDatabase(e.target.value)} placeholder="Database name"
            className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-lg px-3 py-2 text-white text-xs focus:border-yellow-500/50 outline-none" />
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username"
            className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-lg px-3 py-2 text-white text-xs focus:border-yellow-500/50 outline-none" />
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"
              className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-lg px-3 py-2 pr-8 text-white text-xs focus:border-yellow-500/50 outline-none" />
            <button onClick={() => setShowPass(!showPass)} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6e684a]">
              {showPass ? <EyeOff size={12} /> : <Eye size={12} />}
            </button>
          </div>
        </>
      ) : (
        <input type="text" value={host} onChange={e => setHost(e.target.value)}
          placeholder={type === 'rest-api' ? 'https://api.example.com' : 'Connection URL'}
          className="w-full bg-[#0d0c0a] border border-[#2d2813] rounded-lg px-3 py-2 text-white text-xs focus:border-yellow-500/50 outline-none" />
      )}
      <div className="flex gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 text-[10px] text-[#6e684a] hover:text-white">Cancel</button>
        <button onClick={submit} className="px-3 py-1.5 text-[10px] font-bold bg-yellow-500 text-stone-900 rounded-lg hover:bg-yellow-400">Add</button>
      </div>
    </div>
  );
}
