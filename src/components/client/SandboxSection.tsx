import React, { useState, useEffect, useRef } from 'react';
import { Send, ChevronRight, ChevronDown, Search, Loader2, Play, RotateCcw, Terminal, Copy, Check, Zap, X, MessageSquare, Smartphone, Users, Settings, Building, Tag, Wrench, Compass, Inbox, Key, Upload, Mic, Smile, MapPin, Plus, Trash2, Phone, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { instancesApi, clientKeysApi, contactsApi } from '../../services/api';
import type { Instance } from '../../services/api';
import { API_ENDPOINTS, API_CATEGORIES, PUBLIC_API_BASE, type ApiEndpoint } from '../../data/apiEndpoints/index';

interface SandboxSectionProps {
  clientToken?: string;
  instances: Instance[];
  tokenBalance: number;
  onTokenDeduct: (n: number) => void;
}

// ─── Endpoint definitions ───────────────────────────────────────────────────

interface EndpointDef {
  method: 'GET' | 'POST' | 'DELETE' | 'PATCH' | 'PUT';
  path: string;
  name: string;
  desc: string;
  pathParams?: string[];
  bodyFields?: { key: string; label: string; type: 'string' | 'number' | 'boolean' | 'text'; placeholder?: string; required?: boolean; enum?: string[] }[];
  cost?: number;
  category: string;
}

interface CategoryGroup {
  name: string;
  icon: string;
  endpoints: EndpointDef[];
}

const ICON_MAP: Record<string, React.ReactNode> = {
  MessageSquare: <MessageSquare className="w-4 h-4 text-yellow-600" />,
  Smartphone: <Smartphone className="w-4 h-4 text-yellow-600" />,
  Users: <Users className="w-4 h-4 text-yellow-600" />,
  Settings: <Settings className="w-4 h-4 text-yellow-600" />,
  Building: <Building className="w-4 h-4 text-yellow-600" />,
  Tag: <Tag className="w-4 h-4 text-yellow-600" />,
  Wrench: <Wrench className="w-4 h-4 text-yellow-600" />,
  Compass: <Compass className="w-4 h-4 text-yellow-600" />,
  Send: <Send className="w-4 h-4 text-yellow-600" />,
  Inbox: <Inbox className="w-4 h-4 text-yellow-600" />,
};

function toSandboxEndpoint(ep: ApiEndpoint): EndpointDef {
  return {
    method: ep.method,
    path: ep.path.replace('/api/v1', '').replace(':instance', ':instanceName'),
    name: ep.name,
    desc: ep.desc,
    pathParams: ep.pathParams.map(p => p.name),
    bodyFields: ep.bodyFields.map(f => ({
      key: f.key,
      label: f.label,
      type: f.type as 'string' | 'number' | 'boolean' | 'text',
      placeholder: f.placeholder || (f.enum ? f.enum.join(' | ') : ''),
      required: f.required,
      enum: f.enum,
    })),
    cost: ep.cost,
    category: ep.category,
  };
}

const ENDPOINT_GROUPS: CategoryGroup[] =
  API_CATEGORIES
    .filter(cat => cat.name !== 'Receiving')
    .map(cat => ({
      name: cat.name,
      icon: cat.icon,
      endpoints: API_ENDPOINTS
        .filter((ep: ApiEndpoint) => ep.category === cat.name && ep.path.startsWith('/api/v1'))
        .map(toSandboxEndpoint),
    }))
    .filter(g => g.endpoints.length > 0);

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-600 text-white',
  POST: 'bg-yellow-600 text-stone-950',
  DELETE: 'bg-red-600 text-white',
  PATCH: 'bg-orange-500 text-white',
  PUT: 'bg-purple-600 text-white',
};

const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '😡', '🙌', '👏', '🔥', '💯'];
const STATUS_MEDIA_TYPES = ['text', 'image', 'audio'];

export default function SandboxSection({ clientToken, instances, tokenBalance, onTokenDeduct }: SandboxSectionProps) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDef | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['Messaging']));
  const [search, setSearch] = useState('');
  const [bodyValues, setBodyValues] = useState<Record<string, string>>({});
  const [instanceName, setInstanceName] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ ep: EndpointDef; status: number; ts: string }[]>([]);
  const [copied, setCopied] = useState(false);
  const [apiKeys, setApiKeys] = useState<Array<{ id: string; name: string; key_prefix?: string; status: string }>>([]);
  const [selectedKeyId, setSelectedKeyId] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [contacts, setContacts] = useState<Array<{ id: string; name: string; phone: string }>>([]);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [recordingAudio, setRecordingAudio] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const responseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!clientToken) return;
    clientKeysApi.getAll().then(res => {
      if (res.success && res.data) setApiKeys(res.data.filter((k: { status: string }) => k.status === 'Active'));
    });
    contactsApi.getAll().then(res => {
      if (res.success && res.data) setContacts(res.data as Array<{ id: string; name: string; phone: string }>);
    });
  }, [clientToken]);

  useEffect(() => {
    if (instances.length > 0 && !instanceName) {
      const connected = instances.find(i => i.status === 'connected');
      if (connected) setInstanceName(connected.name);
    }
  }, [instances]);

  useEffect(() => {
    if (apiKeys.length > 0 && !selectedKeyId) setSelectedKeyId(apiKeys[0].id);
  }, [apiKeys]);

  const toggleCategory = (name: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const selectEndpoint = (ep: EndpointDef) => {
    setSelectedEndpoint(ep);
    setBodyValues({});
    setResponse(null);
    setResponseStatus(null);
    setPollOptions(['', '']);
  };

  const buildCurl = (): string => {
    if (!selectedEndpoint || !instanceName) return '';
    const base = PUBLIC_API_BASE;
    const path = selectedEndpoint.path.replace(':instanceName', instanceName);
    const method = selectedEndpoint.method;
    const lines = [`curl -X ${method} ${base}${path}`];
    lines.push(`  -H "X-API-Key: <your-key>"`);
    lines.push(`  -H "Content-Type: application/json"`);
    if (selectedEndpoint.bodyFields && selectedEndpoint.bodyFields.length > 0) {
      const body: Record<string, unknown> = {};
      selectedEndpoint.bodyFields.forEach(f => {
        if (bodyValues[f.key] !== undefined && bodyValues[f.key] !== '') {
          body[f.key] = f.type === 'number' ? Number(bodyValues[f.key]) : bodyValues[f.key];
        }
      });
      if (Object.keys(body).length > 0) lines.push(`  -d '${JSON.stringify(body)}'`);
    }
    return lines.join(' \\\n');
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(buildCurl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMediaUpload = async (fieldKey: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*,audio/*,application/pdf';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !clientToken) return;
      setUploadingMedia(true);
      try {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const res = await fetch('/api/uploads/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${clientToken}` },
          body: JSON.stringify({ image: base64 }),
        });
        const data = await res.json();
        if (data.success && data.data?.url) {
          const url = data.data.url;
          setBodyValues(prev => ({ ...prev, [fieldKey]: url }));
          // Auto-detect media_type
          if (file.type.startsWith('image/')) setBodyValues(prev => ({ ...prev, media_type: 'image' }));
          else if (file.type.startsWith('video/')) setBodyValues(prev => ({ ...prev, media_type: 'video' }));
          else if (file.type.startsWith('audio/')) setBodyValues(prev => ({ ...prev, media_type: 'audio' }));
          else if (file.type === 'application/pdf') setBodyValues(prev => ({ ...prev, media_type: 'document' }));
        } else {
          alert(data.error || 'Upload failed');
        }
      } catch (err) { alert(String(err)); }
      finally { setUploadingMedia(false); }
    };
    input.click();
  };

  const handleAddTestContact = async () => {
    if (!newContactName.trim() || !newContactPhone.trim() || !clientToken) return;
    const res = await contactsApi.batchImport([{ name: newContactName.trim(), phone: newContactPhone.trim() }]);
    if (res.success && res.data) {
      setContacts(prev => [...prev, { id: String(Date.now()), name: newContactName.trim(), phone: newContactPhone.trim() }]);
      setNewContactName('');
      setNewContactPhone('');
      setShowAddContact(false);
    }
  };

  const handleRecordAudio = async (fieldKey: string) => {
    if (recordingAudio && mediaRecorder) {
      mediaRecorder.stop();
      setRecordingAudio(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = async () => {
        setRecordingAudio(false);
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          setUploadingMedia(true);
          const res = await fetch('/api/uploads/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${clientToken}` },
            body: JSON.stringify({ image: base64 }),
          });
          const data = await res.json();
          if (data.success && data.data?.url) {
            setBodyValues(prev => ({ ...prev, [fieldKey]: data.data.url, media_type: 'audio' }));
          } else { alert(data.error || 'Upload failed'); }
          setUploadingMedia(false);
        };
        reader.readAsDataURL(blob);
      };
      recorder.start();
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setRecordingAudio(true);
    } catch (err) { alert('Microphone access denied or not available: ' + String(err)); }
  };

  const handleExecute = async () => {
    if (!selectedEndpoint || !instanceName || !clientToken || !selectedKeyId) return;
    setLoading(true);
    setResponse(null);
    setResponseStatus(null);
    try {
      const reqBody: Record<string, unknown> = {
        method: selectedEndpoint.method,
        endpoint: selectedEndpoint.path,
        instanceName,
        keyId: selectedKeyId,
      };
      // Poll options special handling
      if (selectedEndpoint.path.includes('/poll/')) {
        const options = pollOptions.filter(o => o.trim());
        reqBody.options = options;
      }
      if (selectedEndpoint.bodyFields) {
        selectedEndpoint.bodyFields.forEach(f => {
          if (f.key === 'options' || f.key === 'list') return; // handled separately
          if (bodyValues[f.key] !== undefined && bodyValues[f.key] !== '') {
            reqBody[f.key] = f.type === 'number' ? Number(bodyValues[f.key]) : bodyValues[f.key];
          }
        });
      }
      const res = await fetch('/api/sandbox/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${clientToken}` },
        body: JSON.stringify(reqBody),
      });
      const data = await res.json().catch(() => ({}));
      setResponseStatus(res.status);
      setResponse(JSON.stringify(data, null, 2));
      setHistory(prev => [{ ep: selectedEndpoint, status: res.status, ts: new Date().toLocaleTimeString() }, ...prev].slice(0, 20));
      if (selectedEndpoint.cost && selectedEndpoint.cost > 0) onTokenDeduct(selectedEndpoint.cost);
    } catch (err) {
      setResponseStatus(500);
      setResponse(JSON.stringify({ error: String(err) }, null, 2));
    }
    setLoading(false);
  };

  const filteredGroups = search
    ? ENDPOINT_GROUPS.map(g => ({ ...g, endpoints: g.endpoints.filter(ep => ep.name.toLowerCase().includes(search.toLowerCase()) || ep.path.toLowerCase().includes(search.toLowerCase()) || ep.desc.toLowerCase().includes(search.toLowerCase())) })).filter(g => g.endpoints.length > 0)
    : ENDPOINT_GROUPS;

  const isMediaField = (key: string) => ['media_url', 'url', 'image', 'audio', 'video', 'sticker', 'content'].some(k => key.toLowerCase().includes(k));
  const isLocationField = (key: string) => key.toLowerCase().includes('latitude') || key.toLowerCase().includes('longitude') || key.toLowerCase().includes('location');
  const isContactField = (key: string) => key.toLowerCase().includes('contact') || key.toLowerCase().includes('vcard') || key.toLowerCase().includes('phone');
  const isPollOptions = (key: string) => key.toLowerCase().includes('option') || key.toLowerCase().includes('list');
  const isStatusType = (key: string) => key.toLowerCase().includes('type') && selectedEndpoint?.path.includes('status');

  const getFieldComponent = (field: EndpointDef['bodyFields'][0]) => {
    const { key, label, type, placeholder, required, enum: enumVals } = field;

    // Contact picker
    if (isContactField(key) && key.toLowerCase().includes('contact')) {
      return (
        <div className="space-y-1.5">
          <select
            value={bodyValues[key] || ''}
            onChange={e => setBodyValues(prev => ({ ...prev, [key]: e.target.value }))}
            className="w-full px-3 py-2 border border-[#eaebe4] rounded-xl text-xs font-mono focus:outline-none focus:border-yellow-500"
          >
            <option value="">-- Select contact --</option>
            {contacts.map(c => <option key={c.id} value={c.phone}>{c.name} ({c.phone})</option>)}
          </select>
          <button onClick={() => setShowAddContact(true)} className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800">
            <Plus className="w-3 h-3" /> Add test contact
          </button>
        </div>
      );
    }

    // Location picker
    if (isLocationField(key)) {
      return (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={bodyValues[key] || ''}
              onChange={e => setBodyValues(prev => ({ ...prev, [key]: e.target.value }))}
              placeholder={placeholder}
              className="flex-1 px-3 py-2 border border-[#eaebe4] rounded-xl text-xs font-mono focus:outline-none focus:border-yellow-500"
            />
            <button onClick={() => setShowLocationPicker(true)} className="flex items-center gap-1 px-2.5 py-2 text-[10px] font-bold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-xl shrink-0">
              <MapPin className="w-3.5 h-3.5" /> Pick on Map
            </button>
          </div>
          <p className="text-[9px] text-stone-400">Format: latitude,longitude e.g. -1.286389,36.817223</p>
        </div>
      );
    }

    // Status type selector
    if (isStatusType(key) && enumVals) {
      return (
        <div className="flex flex-wrap gap-2">
          {enumVals.map(opt => (
            <button
              key={opt}
              onClick={() => setBodyValues(prev => ({ ...prev, [key]: opt }))}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-xl border transition-colors ${bodyValues[key] === opt ? 'bg-forest-deep text-white border-forest-deep' : 'border-[#eaebe4] text-stone-600 hover:border-yellow-300'}`}
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
      );
    }

    // Poll options
    if (isPollOptions(key) && selectedEndpoint?.path.includes('/poll/')) {
      return (
        <div className="space-y-2">
          {pollOptions.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={opt}
                onChange={e => {
                  const updated = [...pollOptions];
                  updated[i] = e.target.value;
                  setPollOptions(updated);
                }}
                placeholder={`Option ${i + 1}`}
                className="flex-1 px-3 py-2 border border-[#eaebe4] rounded-xl text-xs font-mono focus:outline-none focus:border-yellow-500"
              />
              {pollOptions.length > 2 && (
                <button onClick={() => setPollOptions(prev => prev.filter((_, j) => j !== i))} className="p-2 text-red-400 hover:text-red-600">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          <button onClick={() => setPollOptions(prev => [...prev, ''])} className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800">
            <Plus className="w-3 h-3" /> Add option
          </button>
        </div>
      );
    }

    // Emoji picker for reaction
    if (key.toLowerCase().includes('reaction') || key.toLowerCase().includes('emoji')) {
      return (
        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-1">
            {EMOJIS.map(e => (
              <button
                key={e}
                onClick={() => setBodyValues(prev => ({ ...prev, [key]: e }))}
                className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-colors ${bodyValues[key] === e ? 'bg-yellow-100 ring-2 ring-yellow-500' : 'bg-stone-100 hover:bg-yellow-50'}`}
              >
                {e}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={bodyValues[key] || ''}
            onChange={e => setBodyValues(prev => ({ ...prev, [key]: e.target.value }))}
            placeholder="Or type emoji"
            className="w-full px-3 py-2 border border-[#eaebe4] rounded-xl text-xs font-mono focus:outline-none focus:border-yellow-500"
          />
        </div>
      );
    }

    // Enum select
    if (enumVals && enumVals.length > 0) {
      return (
        <select
          value={bodyValues[key] || ''}
          onChange={e => setBodyValues(prev => ({ ...prev, [key]: e.target.value }))}
          className="w-full px-3 py-2 border border-[#eaebe4] rounded-xl text-xs font-mono focus:outline-none focus:border-yellow-500"
        >
          <option value="">-- Select --</option>
          {enumVals.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    }

    // Boolean
    if (type === 'boolean') {
      return (
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={bodyValues[key] === 'true'}
            onChange={e => setBodyValues(prev => ({ ...prev, [key]: String(e.target.checked) }))}
            className="w-4 h-4 accent-yellow-600"
          />
          <span className="text-xs text-stone-500">{placeholder || 'true / false'}</span>
        </label>
      );
    }

    // Textarea
    if (type === 'text') {
      return (
        <textarea
          value={bodyValues[key] || ''}
          onChange={e => setBodyValues(prev => ({ ...prev, [key]: e.target.value }))}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2 border border-[#eaebe4] rounded-xl text-xs font-mono focus:outline-none focus:border-yellow-500 resize-none"
        />
      );
    }

    // Audio record button
    if (key.toLowerCase().includes('audio') || key.toLowerCase().includes('media')) {
      return (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={bodyValues[key] || ''}
            onChange={e => setBodyValues(prev => ({ ...prev, [key]: e.target.value }))}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-[#eaebe4] rounded-xl text-xs font-mono focus:outline-none focus:border-yellow-500"
          />
          <button onClick={() => handleRecordAudio(key)} disabled={uploadingMedia} className={`flex items-center gap-1 px-2.5 py-2 text-[10px] font-bold border rounded-xl transition-colors shrink-0 disabled:opacity-50 ${recordingAudio ? 'bg-red-100 text-red-700 border-red-200' : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200'}`}>
            {recordingAudio ? <><Mic className="w-3.5 h-3.5 animate-pulse" /> Recording…</> : <><Mic className="w-3.5 h-3.5" /> Record</>}
          </button>
          <button onClick={() => handleMediaUpload(key)} disabled={uploadingMedia} className="flex items-center gap-1 px-2.5 py-2 text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl shrink-0 disabled:opacity-50">
            {uploadingMedia ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Upload
          </button>
        </div>
      );
    }

    // Default text/number input with optional upload
    return (
      <div className="flex items-center gap-2">
        <input
          type={type === 'number' ? 'number' : 'text'}
          value={bodyValues[key] || ''}
          onChange={e => setBodyValues(prev => ({ ...prev, [key]: e.target.value }))}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-[#eaebe4] rounded-xl text-xs font-mono focus:outline-none focus:border-yellow-500"
        />
        {isMediaField(key) && (
          <button onClick={() => handleMediaUpload(key)} disabled={uploadingMedia} className="flex items-center gap-1 px-2.5 py-2 text-[10px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl shrink-0 disabled:opacity-50">
            {uploadingMedia ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Upload
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Selector bar */}
      <div className="bg-white border border-[#eaebe4] rounded-2xl px-4 py-3 flex flex-wrap items-center gap-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-forest-deep"><Zap className="w-4 h-4 text-yellow-600" /><span>API Sandbox</span></div>
        <div className="flex items-center gap-2 text-[10px] text-stone-500">
          <span>Container:</span>
          <select value={instanceName} onChange={e => setInstanceName(e.target.value)} className="px-2 py-1 border border-[#eaebe4] rounded-lg text-xs font-mono focus:outline-none focus:border-yellow-500">
            <option value="">-- Select --</option>
            {instances.map(inst => <option key={inst.id} value={inst.name}>{inst.name} ({inst.status})</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-stone-500">
          <Key className="w-3.5 h-3.5 text-stone-400" /><span>API Key:</span>
          <select value={selectedKeyId} onChange={e => setSelectedKeyId(e.target.value)} className="px-2 py-1 border border-[#eaebe4] rounded-lg text-xs font-mono focus:outline-none focus:border-yellow-500 min-w-[140px]">
            <option value="">-- Select --</option>
            {apiKeys.map(k => <option key={k.id} value={k.id}>{k.name} ({k.key_prefix || 'fidscript_live_…'})</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-stone-500 ml-auto">
          <span>Balance:</span><span className="font-bold text-yellow-700">{tokenBalance.toLocaleString()} tokens</span>
        </div>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: '340px 1fr', minHeight: '600px', height: 'calc(100vh - 240px)' }}>
        {/* Left: endpoint browser */}
        <div className="bg-white border border-[#eaebe4] rounded-3xl overflow-hidden shadow-sm flex flex-col" style={{ maxHeight: '100%' }}>
          <div className="p-3 border-b border-[#eaebe4] bg-[#f9f9f2]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search endpoints…" className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 bg-white" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredGroups.map(group => (
              <div key={group.name}>
                <button onClick={() => toggleCategory(group.name)} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-forest-deep bg-[#f9f9f2] border-b border-[#eaebe4] hover:bg-stone-100 transition-colors">
                  <span className="text-stone-600">{ICON_MAP[group.icon]}</span><span>{group.name}</span>
                  <span className="ml-auto text-stone-400">{group.endpoints.length}</span>
                  {expandedCategories.has(group.name) ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
                <AnimatePresence>
                  {expandedCategories.has(group.name) && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      {group.endpoints.map(ep => (
                        <button key={ep.path + ep.method} onClick={() => selectEndpoint(ep)} className={`w-full flex items-center gap-2 px-4 py-2 text-[11px] hover:bg-stone-50 transition-colors text-left border-b border-[#eaebe4]/50 ${selectedEndpoint?.path === ep.path && selectedEndpoint?.method === ep.method ? 'bg-yellow-50 border-l-2 border-l-yellow-500' : ''}`}>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ${METHOD_COLORS[ep.method]}`}>{ep.method}</span>
                          <div className="min-w-0"><p className="font-bold text-forest-deep truncate">{ep.name}</p><p className="text-[9px] text-stone-400 font-mono truncate">{ep.path.replace(':instanceName', instanceName || ':instance')}</p></div>
                          {ep.cost !== undefined && ep.cost > 0 && <span className="ml-auto text-[9px] font-bold text-yellow-700 shrink-0">{ep.cost}t</span>}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* Right: request builder + response */}
        <div className="flex flex-col gap-4">
          {selectedEndpoint ? (
            <>
              <div className="bg-white border border-[#eaebe4] rounded-3xl p-5 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded font-mono ${METHOD_COLORS[selectedEndpoint.method]}`}>{selectedEndpoint.method}</span>
                      <code className="text-xs font-mono font-bold text-forest-deep">{selectedEndpoint.path.replace(':instanceName', instanceName || ':instance')}</code>
                    </div>
                    <p className="text-xs text-graphite">{selectedEndpoint.desc}</p>
                  </div>
                  {selectedEndpoint.cost !== undefined && selectedEndpoint.cost > 0 && (
                    <span className="text-[10px] font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-200 shrink-0">{selectedEndpoint.cost} token{selectedEndpoint.cost > 1 ? 's' : ''}</span>
                  )}
                </div>

                {/* Tip for reaction */}
                {selectedEndpoint.path.includes('/reaction/') && (
                  <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl text-[10px] text-blue-800">
                    <MessageCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p><strong>Tip:</strong> You need a <strong>messageId</strong> to react to. First send a message using <strong>Send Text</strong>, then use the returned <code>messageId</code> here.</p>
                  </div>
                )}

                {/* Body fields */}
                {selectedEndpoint.bodyFields && selectedEndpoint.bodyFields.length > 0 && (
                  <div className="grid gap-3">
                    {selectedEndpoint.bodyFields.map(field => (
                      <div key={field.key}>
                        <label className="block text-[10px] font-bold text-stone-600 mb-1">
                          {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
                        </label>
                        {getFieldComponent(field)}
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button onClick={handleExecute} disabled={loading || !instanceName || !selectedKeyId} className="flex items-center gap-2 px-4 py-2 bg-forest-deep hover:bg-[#33301a] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-colors">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    {loading ? 'Executing…' : 'Execute Request'}
                  </button>
                  <button onClick={handleCopyCurl} className="flex items-center gap-1.5 px-3 py-2 border border-[#eaebe4] hover:border-yellow-300 text-stone-600 text-xs font-bold rounded-xl transition-colors">
                    {copied ? <><Check className="w-3.5 h-3.5 text-green-600" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy cURL</>}
                  </button>
                </div>
              </div>

              {response !== null && (
                <div className="bg-white border border-[#eaebe4] rounded-3xl overflow-hidden shadow-sm flex-1 flex flex-col">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#f9f9f2] border-b border-[#eaebe4]">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-stone-500" /><span className="text-[10px] font-bold text-stone-600">Response</span>
                      {responseStatus !== null && <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${responseStatus < 300 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{responseStatus}</span>}
                    </div>
                    <button onClick={() => { setResponse(null); setResponseStatus(null); }} className="text-stone-400 hover:text-black"><X className="w-3.5 h-3.5" /></button>
                  </div>
                  <div ref={responseRef} className="flex-1 overflow-auto p-4">
                    <pre className="text-[11px] font-mono text-stone-700 whitespace-pre-wrap break-all">{response}</pre>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-white border border-[#eaebe4] rounded-3xl text-center p-8 text-stone-400 space-y-3 shadow-sm">
              <Compass className="w-12 h-12 text-yellow-200" />
              <p className="font-bold text-forest-deep text-sm">Select an endpoint to test</p>
              <p className="text-xs text-graphite max-w-xs">Choose an endpoint from the left panel, fill in the parameters, and execute a live request.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add contact modal */}
      <AnimatePresence>
        {showAddContact && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-[#eaebe4] text-forest-deep rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <h4 className="font-bold text-sm">Add Test Contact</h4>
                <button onClick={() => setShowAddContact(false)} className="text-gray-400 hover:text-black"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-graphite uppercase mb-1">Name</label>
                  <input type="text" value={newContactName} onChange={e => setNewContactName(e.target.value)} placeholder="John Doe" className="w-full px-3 py-2 border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-graphite uppercase mb-1">Phone (with country code)</label>
                  <input type="text" value={newContactPhone} onChange={e => setNewContactPhone(e.target.value)} placeholder="254712345678" className="w-full px-3 py-2 border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 text-xs font-mono" />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button onClick={() => setShowAddContact(false)} className="px-4 py-2 border border-stone-200 rounded-xl hover:bg-stone-50">Cancel</button>
                  <button onClick={handleAddTestContact} className="px-4 py-2 bg-forest-deep hover:bg-[#33301a] text-white font-bold text-xs rounded-xl">Save Contact</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Location picker modal */}
      <AnimatePresence>
        {showLocationPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-[#eaebe4] text-forest-deep rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <h4 className="font-bold text-sm">Pick Location</h4>
                <button onClick={() => setShowLocationPicker(false)} className="text-gray-400 hover:text-black"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-[10px] text-graphite">Enter coordinates manually or use the Google Maps link below.</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-graphite uppercase mb-1">Latitude</label>
                  <input id="lat-input" type="text" placeholder="-1.286389" className="w-full px-3 py-2 border border-[#eaebe4] rounded-xl text-xs font-mono focus:outline-none focus:border-yellow-500" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-graphite uppercase mb-1">Longitude</label>
                  <input id="lng-input" type="text" placeholder="36.817223" className="w-full px-3 py-2 border border-[#eaebe4] rounded-xl text-xs font-mono focus:outline-none focus:border-yellow-500" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => {
                  const lat = (document.getElementById('lat-input') as HTMLInputElement).value;
                  const lng = (document.getElementById('lng-input') as HTMLInputElement).value;
                  if (lat && lng) {
                    setBodyValues(prev => ({ ...prev, latitude: lat, longitude: lng }));
                    setShowLocationPicker(false);
                  }
                }} className="flex-1 px-4 py-2 bg-forest-deep hover:bg-[#33301a] text-white font-bold text-xs rounded-xl">Apply</button>
                <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 px-3 py-2 border border-[#eaebe4] text-stone-600 text-xs font-bold rounded-xl hover:bg-stone-50">
                  <MapPin className="w-3.5 h-3.5" /> Google Maps
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
