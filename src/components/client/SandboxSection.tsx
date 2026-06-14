import React, { useState, useEffect, useRef } from 'react';
import { Send, ChevronRight, ChevronDown, Search, Loader2, Play, RotateCcw, Terminal, Copy, Check, Zap, X, MessageSquare, Smartphone, Users, Settings, Building, Tag, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { instancesApi } from '../../services/api';
import type { Instance } from '../../services/api';

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
  bodyFields?: { key: string; label: string; type: 'string' | 'number' | 'boolean' | 'text'; placeholder?: string; required?: boolean }[];
  cost?: number;
  category: string;
}

interface CategoryGroup {
  name: string;
  icon: string;
  endpoints: EndpointDef[];
}

const ICON_MAP: Record<string, React.ReactNode> = { MessageSquare: <MessageSquare className="w-4 h-4 text-yellow-600" />, Smartphone: <Smartphone className="w-4 h-4 text-yellow-600" />, Users: <Users className="w-4 h-4 text-yellow-600" />, Settings: <Settings className="w-4 h-4 text-yellow-600" />, Building: <Building className="w-4 h-4 text-yellow-600" />, Tag: <Tag className="w-4 h-4 text-yellow-600" />, Wrench: <Wrench className="w-4 h-4 text-yellow-600" /> }; const ENDPOINT_GROUPS: CategoryGroup[] = [
  {
    name: 'Messaging',
    icon: 'MessageSquare',
    endpoints: [
      { method: 'POST', path: '/message/sendText/:instanceName', name: 'Send Text', desc: 'Send a plain text message to a WhatsApp number.', pathParams: ['instanceName'], bodyFields: [{ key: 'number', label: 'Phone', type: 'string', placeholder: '254712345678', required: true }, { key: 'text', label: 'Message', type: 'text', placeholder: 'Hello!', required: true }], cost: 1, category: 'Messaging' },
      { method: 'POST', path: '/message/sendMedia/:instanceName', name: 'Send Media', desc: 'Send image, video, audio, or document via URL.', pathParams: ['instanceName'], bodyFields: [{ key: 'number', label: 'Phone', type: 'string', placeholder: '254712345678', required: true }, { key: 'mediatype', label: 'Media Type', type: 'string', placeholder: 'image | video | audio | document', required: true }, { key: 'media', label: 'Media URL', type: 'string', placeholder: 'https://example.com/file.jpg', required: true }, { key: 'caption', label: 'Caption', type: 'text', placeholder: 'Optional caption' }], cost: 2, category: 'Messaging' },
      { method: 'POST', path: '/message/sendLocation/:instanceName', name: 'Send Location', desc: 'Share GPS coordinates with a name and address.', pathParams: ['instanceName'], bodyFields: [{ key: 'number', label: 'Phone', type: 'string', placeholder: '254712345678', required: true }, { key: 'latitude', label: 'Latitude', type: 'number', placeholder: '-1.2921', required: true }, { key: 'longitude', label: 'Longitude', type: 'number', placeholder: '36.8219', required: true }, { key: 'name', label: 'Name', type: 'string', placeholder: 'Nairobi CBD' }, { key: 'address', label: 'Address', type: 'string', placeholder: 'City Square, Nairobi' }], cost: 1, category: 'Messaging' },
      { method: 'POST', path: '/message/sendContact/:instanceName', name: 'Send Contact', desc: 'Share a contact card (vCard format).', pathParams: ['instanceName'], bodyFields: [{ key: 'number', label: 'Phone', type: 'string', placeholder: '254712345678', required: true }, { key: 'contact', label: 'Contact JSON', type: 'text', placeholder: '{"name":"John Doe","phones":["254700000000"]}', required: true }], cost: 1, category: 'Messaging' },
      { method: 'POST', path: '/message/sendReaction/:instanceName', name: 'Send Reaction', desc: 'React to a message with an emoji.', pathParams: ['instanceName'], bodyFields: [{ key: 'number', label: 'Phone', type: 'string', placeholder: '254712345678', required: true }, { key: 'key', label: 'Message Key (JSDrive)', type: 'text', placeholder: '{"id":"false_254700000000@us.c","from":"254700000000@us.c"}', required: true }, { key: 'reaction', label: 'Emoji Reaction', type: 'string', placeholder: '👍', required: true }], cost: 1, category: 'Messaging' },
      { method: 'POST', path: '/message/sendPoll/:instanceName', name: 'Send Poll', desc: 'Create an interactive poll message.', pathParams: ['instanceName'], bodyFields: [{ key: 'number', label: 'Phone', type: 'string', placeholder: '254712345678', required: true }, { key: 'poll', label: 'Poll JSON', type: 'text', placeholder: '{"title":"Vote?","options":["Yes","No","Maybe"]}', required: true }], cost: 1, category: 'Messaging' },
      { method: 'POST', path: '/message/sendList/:instanceName', name: 'Send List', desc: 'Interactive list message with sections and rows.', pathParams: ['instanceName'], bodyFields: [{ key: 'number', label: 'Phone', type: 'string', placeholder: '254712345678', required: true }, { key: 'list', label: 'List JSON', type: 'text', placeholder: '{"title":"Menu","sections":[{"title":"Options","rows":[{"title":"Option 1","description":"Desc 1","rowId":"1"},{"title":"Option 2","description":"Desc 2","rowId":"2"}]}]}', required: true }], cost: 1, category: 'Messaging' },
      { method: 'POST', path: '/message/sendButtons/:instanceName', name: 'Send Buttons', desc: 'Message with interactive button replies.', pathParams: ['instanceName'], bodyFields: [{ key: 'number', label: 'Phone', type: 'string', placeholder: '254712345678', required: true }, { key: 'buttons', label: 'Buttons JSON', type: 'text', placeholder: '{"text":"Choose an option","buttons":[{"type":"reply","reply":{"id":"1","title":"Yes"}},{"type":"reply","reply":{"id":"2","title":"No"}}]}', required: true }], cost: 1, category: 'Messaging' },
      { method: 'POST', path: '/message/sendWhatsAppAudio/:instanceName', name: 'Send Audio', desc: 'Send a WhatsApp-format audio file (OGG).', pathParams: ['instanceName'], bodyFields: [{ key: 'number', label: 'Phone', type: 'string', placeholder: '254712345678', required: true }, { key: 'audio', label: 'Audio URL', type: 'string', placeholder: 'https://example.com/audio.ogg', required: true }], cost: 2, category: 'Messaging' },
      { method: 'POST', path: '/message/sendSticker/:instanceName', name: 'Send Sticker', desc: 'Send a sticker image (webp format).', pathParams: ['instanceName'], bodyFields: [{ key: 'number', label: 'Phone', type: 'string', placeholder: '254712345678', required: true }, { key: 'sticker', label: 'Sticker URL', type: 'string', placeholder: 'https://example.com/sticker.webp', required: true }], cost: 2, category: 'Messaging' },
      { method: 'POST', path: '/message/sendStatus/:instanceName', name: 'Send Status', desc: 'Post a status update (story) to your own account.', pathParams: ['instanceName'], bodyFields: [{ key: 'status', label: 'Status JSON', type: 'text', placeholder: '{"type":"text","content":"My status!","backgroundColor":"#128C7E"}', required: true }], cost: 1, category: 'Messaging' },
    ],
  },
  {
    name: 'Instance',
    icon: 'Smartphone',
    endpoints: [
      { method: 'GET', path: '/instance/connectionState/:instanceName', name: 'Connection State', desc: 'Get the current connection status of an instance.', pathParams: ['instanceName'], bodyFields: [], category: 'Instance' },
      { method: 'GET', path: '/instance/connect/:instanceName', name: 'Generate QR Code', desc: 'Generate a new QR code for linking WhatsApp.', pathParams: ['instanceName'], bodyFields: [], category: 'Instance' },
      { method: 'POST', path: '/instance/restart/:instanceName', name: 'Restart Instance', desc: 'Restart the WhatsApp instance connection.', pathParams: ['instanceName'], bodyFields: [], category: 'Instance' },
      { method: 'DELETE', path: '/instance/logout/:instanceName', name: 'Disconnect', desc: 'Log out and disconnect the WhatsApp session.', pathParams: ['instanceName'], bodyFields: [], category: 'Instance' },
      { method: 'DELETE', path: '/instance/delete/:instanceName', name: 'Delete Instance', desc: 'Permanently delete the instance and all its data.', pathParams: ['instanceName'], bodyFields: [], category: 'Instance' },
      { method: 'POST', path: '/instance/setPresence/:instanceName', name: 'Set Presence', desc: 'Set your online presence status.', pathParams: ['instanceName'], bodyFields: [{ key: 'presence', label: 'Presence', type: 'string', placeholder: 'available | composing | recording | paused', required: true }], category: 'Instance' },
    ],
  },
  {
    name: 'Chat',
    icon: 'MessageSquare',
    endpoints: [
      { method: 'POST', path: '/chat/findContacts/:instanceName', name: 'Find Contacts', desc: 'Search contacts in the instance contact list.', pathParams: ['instanceName'], bodyFields: [{ key: 'search', label: 'Search Query', type: 'string', placeholder: 'John' }], category: 'Chat' },
      { method: 'POST', path: '/chat/findChats/:instanceName', name: 'Find Chats', desc: 'Search chat threads.', pathParams: ['instanceName'], bodyFields: [{ key: 'search', label: 'Search Query', type: 'string', placeholder: 'Sales' }], category: 'Chat' },
      { method: 'POST', path: '/chat/whatsappNumbers/:instanceName', name: 'Check WhatsApp Numbers', desc: 'Validate if phone numbers have WhatsApp.', pathParams: ['instanceName'], bodyFields: [{ key: 'numbers', label: 'Phone Numbers (JSON array)', type: 'text', placeholder: '["254712345678","254798765432"]', required: true }], category: 'Chat' },
      { method: 'POST', path: '/chat/markMessageAsRead/:instanceName', name: 'Mark Message Read', desc: 'Mark a specific message as read.', pathParams: ['instanceName'], bodyFields: [{ key: 'key', label: 'Message Key JSON', type: 'text', placeholder: '{"id":"false_254700000000@us.c","from":"254700000000@us.c"}', required: true }], category: 'Chat' },
      { method: 'POST', path: '/chat/updateBlockStatus/:instanceName', name: 'Update Block Status', desc: 'Block or unblock a contact.', pathParams: ['instanceName'], bodyFields: [{ key: 'number', label: 'Phone', type: 'string', placeholder: '254712345678', required: true }, { key: 'type', label: 'Type', type: 'string', placeholder: 'block | unblock', required: true }], category: 'Chat' },
      { method: 'POST', path: '/chat/sendPresence/:instanceName', name: 'Send Presence', desc: 'Broadcast presence (typing, recording) to a chat.', pathParams: ['instanceName'], bodyFields: [{ key: 'to', label: 'Phone', type: 'string', placeholder: '254712345678', required: true }, { key: 'presence', label: 'Presence', type: 'string', placeholder: 'typing | recording | paused' }], category: 'Chat' },
      { method: 'POST', path: '/chat/fetchProfilePictureUrl/:instanceName', name: 'Fetch Profile Picture', desc: 'Get the profile picture URL for a contact.', pathParams: ['instanceName'], bodyFields: [{ key: 'number', label: 'Phone', type: 'string', placeholder: '254712345678', required: true }], category: 'Chat' },
    ],
  },
  {
    name: 'Group',
    icon: 'Users',
    endpoints: [
      { method: 'POST', path: '/group/create/:instanceName', name: 'Create Group', desc: 'Create a new WhatsApp group.', pathParams: ['instanceName'], bodyFields: [{ key: 'subject', label: 'Group Subject', type: 'string', placeholder: 'Sales Team', required: true }, { key: 'participants', label: 'Participants (JSON array)', type: 'text', placeholder: '["254712345678","254798765432"]', required: true }], category: 'Group' },
      { method: 'POST', path: '/group/updateGroupSubject/:instanceName', name: 'Update Group Subject', desc: 'Change the group name/subject.', pathParams: ['instanceName'], bodyFields: [{ key: 'groupJid', label: 'Group JID', type: 'string', placeholder: '123456789-987654321@g.us', required: true }, { key: 'subject', label: 'New Subject', type: 'string', placeholder: 'New Group Name', required: true }], category: 'Group' },
      { method: 'POST', path: '/group/updateGroupDescription/:instanceName', name: 'Update Group Description', desc: 'Change the group description.', pathParams: ['instanceName'], bodyFields: [{ key: 'groupJid', label: 'Group JID', type: 'string', placeholder: '123456789-987654321@g.us', required: true }, { key: 'description', label: 'Description', type: 'text', placeholder: 'Group description text' }], category: 'Group' },
      { method: 'POST', path: '/group/addParticipants/:instanceName', name: 'Add Participants', desc: 'Add members to a group.', pathParams: ['instanceName'], bodyFields: [{ key: 'groupJid', label: 'Group JID', type: 'string', placeholder: '123456789-987654321@g.us', required: true }, { key: 'participants', label: 'Participants (JSON array)', type: 'text', placeholder: '["254712345678"]', required: true }], category: 'Group' },
      { method: 'POST', path: '/group/removeParticipants/:instanceName', name: 'Remove Participants', desc: 'Remove members from a group.', pathParams: ['instanceName'], bodyFields: [{ key: 'groupJid', label: 'Group JID', type: 'string', placeholder: '123456789-987654321@g.us', required: true }, { key: 'participants', label: 'Participants (JSON array)', type: 'text', placeholder: '["254712345678"]', required: true }], category: 'Group' },
      { method: 'POST', path: '/group/join/:instanceName', name: 'Join Group via Invite', desc: 'Join a group using an invite code.', pathParams: ['instanceName'], bodyFields: [{ key: 'inviteCode', label: 'Invite Code', type: 'string', placeholder: 'ABC123XYZ', required: true }], category: 'Group' },
      { method: 'GET', path: '/group/findGroupInfos/:instanceName', name: 'Find Group Info', desc: 'Get group metadata by invite code.', pathParams: ['instanceName'], bodyFields: [{ key: 'inviteCode', label: 'Invite Code', type: 'string', placeholder: 'ABC123XYZ', required: true }], category: 'Group' },
      { method: 'GET', path: '/group/fetchAllGroups/:instanceName', name: 'List All Groups', desc: 'Get all groups the instance is part of.', pathParams: ['instanceName'], bodyFields: [], category: 'Group' },
    ],
  },
  {
    name: 'Settings',
    icon: 'Settings',
    endpoints: [
      { method: 'GET', path: '/settings/:instanceName', name: 'Get Settings', desc: 'Fetch current instance settings.', pathParams: ['instanceName'], bodyFields: [], category: 'Settings' },
      { method: 'POST', path: '/settings/:instanceName', name: 'Update Settings', desc: 'Update instance settings (webhooks, presence, etc.).', pathParams: ['instanceName'], bodyFields: [{ key: 'settings', label: 'Settings JSON', type: 'text', placeholder: '{"webhook":{"url":"https://yoursite.com/webhook","enabled":true},"presence":"available"}', required: true }], category: 'Settings' },
      { method: 'POST', path: '/webhook/set/:instanceName', name: 'Set Webhook', desc: 'Configure webhook URL and events for an instance.', pathParams: ['instanceName'], bodyFields: [{ key: 'enabled', label: 'Enabled', type: 'boolean', placeholder: 'true' }, { key: 'url', label: 'Webhook URL', type: 'string', placeholder: 'https://yoursite.com/webhook' }, { key: 'webhookByEvents', label: 'By Events', type: 'boolean', placeholder: 'false' }, { key: 'events', label: 'Events (JSON array)', type: 'text', placeholder: '["CONNECTION_UPDATE","MESSAGES_UPSERT"]' }], category: 'Settings' },
    ],
  },
  {
    name: 'Business',
    icon: 'Building',
    endpoints: [
      { method: 'GET', path: '/business/fetchBusinessProfile/:instanceName', name: 'Fetch Business Profile', desc: 'Get the WhatsApp Business profile info.', pathParams: ['instanceName'], bodyFields: [], category: 'Business' },
      { method: 'POST', path: '/business/updateBusinessProfile/:instanceName', name: 'Update Business Profile', desc: 'Update business profile (name, description, logo, etc.).', pathParams: ['instanceName'], bodyFields: [{ key: 'businessProfile', label: 'Profile JSON', type: 'text', placeholder: '{"about":"Your business description","website":"https://yoursite.com"}', required: true }], category: 'Business' },
    ],
  },
  {
    name: 'Labels',
    icon: 'Tag',
    endpoints: [
      { method: 'GET', path: '/label/findLabels/:instanceName', name: 'List Labels', desc: 'Get all labels (tags) for the instance.', pathParams: ['instanceName'], bodyFields: [], category: 'Labels' },
      { method: 'POST', path: '/label/create/:instanceName', name: 'Create Label', desc: 'Create a new label/tag.', pathParams: ['instanceName'], bodyFields: [{ key: 'label', label: 'Label Name', type: 'string', placeholder: 'VIP Customer', required: true }], category: 'Labels' },
      { method: 'POST', path: '/label/delete/:instanceName', name: 'Delete Label', desc: 'Delete a label by ID.', pathParams: ['instanceName'], bodyFields: [{ key: 'labelId', label: 'Label ID', type: 'string', placeholder: 'label_id', required: true }], category: 'Labels' },
    ],
  },
  {
    name: 'Utils',
    icon: 'Wrench',
    endpoints: [
      { method: 'GET', path: '/health', name: 'Health Check', desc: 'Check if the Evolution API server is running.', pathParams: [], bodyFields: [], category: 'Utils' },
      { method: 'GET', path: '/instance/fetchInstances', name: 'Fetch All Instances', desc: 'List all instances on the Evolution API server.', pathParams: [], bodyFields: [], category: 'Utils' },
    ],
  },
];

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-blue-600 text-white',
  POST: 'bg-yellow-600 text-stone-950',
  DELETE: 'bg-red-600 text-white',
  PATCH: 'bg-orange-500 text-white',
  PUT: 'bg-purple-600 text-white',
};

// ─── Component ───────────────────────────────────────────────────────────────

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
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'explorer' | 'send'>('explorer');

  const responseRef = useRef<HTMLDivElement>(null);

  // Auto-select first connected instance
  useEffect(() => {
    if (instances.length > 0 && !instanceName) {
      const connected = instances.find(i => i.status === 'connected');
      if (connected) setInstanceName(connected.name);
    }
  }, [instances]);

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
  };

  const buildCurl = (): string => {
    if (!selectedEndpoint || !instanceName) return '';
    const base = 'https://whatsapp.fidscript.com/api/instance';
    const path = selectedEndpoint.path.replace(':instanceName', instanceName);
    const method = selectedEndpoint.method;
    const lines = [`curl -X ${method} ${base}${path}`];
    lines.push(`  -H "X-API-Key: fidscript_live_xxxx"`);
    lines.push(`  -H "Content-Type: application/json"`);
    if (selectedEndpoint.bodyFields && selectedEndpoint.bodyFields.length > 0) {
      const body: Record<string, unknown> = {};
      selectedEndpoint.bodyFields.forEach(f => {
        if (bodyValues[f.key] !== undefined && bodyValues[f.key] !== '') {
          body[f.key] = f.type === 'number' ? Number(bodyValues[f.key]) : bodyValues[f.key];
        }
      });
      if (Object.keys(body).length > 0) {
        lines.push(`  -d '${JSON.stringify(body)}'`);
      }
    }
    return lines.join(' \\\n');
  };

  const handleExecute = async () => {
    if (!selectedEndpoint || !instanceName || !clientToken) return;
    setLoading(true);
    setResponse(null);
    setResponseStatus(null);

    try {
      const body: Record<string, unknown> = {};
      if (selectedEndpoint.bodyFields) {
        selectedEndpoint.bodyFields.forEach(f => {
          if (bodyValues[f.key] !== undefined && bodyValues[f.key] !== '') {
            body[f.key] = f.type === 'number' ? Number(bodyValues[f.key]) : bodyValues[f.key];
          }
        });
      }

      const res = await fetch('/api/sandbox/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${clientToken}` },
        body: JSON.stringify({
          method: selectedEndpoint.method,
          endpoint: selectedEndpoint.path,
          pathParams: { instanceName },
          body: Object.keys(body).length > 0 ? body : undefined,
          instanceName,
        }),
      });

      const data = await res.json().catch(() => ({}));
      setResponseStatus(res.status);
      setResponse(JSON.stringify(data, null, 2));

      setHistory(prev => [{ ep: selectedEndpoint, status: res.status, ts: new Date().toLocaleTimeString() }, ...prev].slice(0, 20));

      if (selectedEndpoint.cost && selectedEndpoint.cost > 0) {
        onTokenDeduct(selectedEndpoint.cost);
      }
    } catch (err) {
      setResponseStatus(500);
      setResponse(JSON.stringify({ error: String(err) }, null, 2));
    }
    setLoading(false);
  };

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(buildCurl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredGroups = search
    ? ENDPOINT_GROUPS.map(g => ({
        ...g,
        endpoints: g.endpoints.filter(ep =>
          ep.name.toLowerCase().includes(search.toLowerCase()) ||
          ep.path.toLowerCase().includes(search.toLowerCase()) ||
          ep.desc.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(g => g.endpoints.length > 0)
    : ENDPOINT_GROUPS;

  return (
    <div className="space-y-4">
      {/* Instance selector bar */}
      <div className="bg-white border border-[#eaebe4] rounded-2xl px-4 py-3 flex items-center gap-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold text-forest-deep">
          <Zap className="w-4 h-4 text-yellow-600" />
          <span>API Sandbox</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-stone-500">
          <span>Container:</span>
          <select
            value={instanceName}
            onChange={e => setInstanceName(e.target.value)}
            className="px-2 py-1 border border-[#eaebe4] rounded-lg text-xs font-mono focus:outline-none focus:border-yellow-500"
          >
            <option value="">-- Select --</option>
            {instances.map(inst => (
              <option key={inst.id} value={inst.name}>{inst.name} ({inst.status})</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-stone-500 ml-auto">
          <span>Balance:</span>
          <span className="font-bold text-yellow-700">{tokenBalance.toLocaleString()} tokens</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4" style={{ gridTemplateColumns: '1fr 1.5fr' }}>
        {/* Left: endpoint browser */}
        <div className="bg-white border border-[#eaebe4] rounded-3xl overflow-hidden shadow-sm flex flex-col" style={{ maxHeight: '700px' }}>
          <div className="p-3 border-b border-[#eaebe4] bg-[#f9f9f2]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search endpoints..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 bg-white"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredGroups.map(group => (
              <div key={group.name}>
                <button
                  onClick={() => toggleCategory(group.name)}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-forest-deep bg-[#f9f9f2] border-b border-[#eaebe4] hover:bg-stone-100 transition-colors"
                >
                  <span className="text-stone-600">{ICON_MAP[group.icon]}</span>
                  <span>{group.name}</span>
                  <span className="ml-auto text-stone-400">{group.endpoints.length}</span>
                  {expandedCategories.has(group.name) ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>
                <AnimatePresence>
                  {expandedCategories.has(group.name) && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      {group.endpoints.map(ep => (
                        <button
                          key={ep.path + ep.method}
                          onClick={() => selectEndpoint(ep)}
                          className={`w-full flex items-center gap-2 px-4 py-2 text-[11px] hover:bg-stone-50 transition-colors text-left border-b border-[#eaebe4]/50 ${selectedEndpoint?.path === ep.path && selectedEndpoint?.method === ep.method ? 'bg-yellow-50 border-l-2 border-l-yellow-500' : ''}`}
                        >
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ${METHOD_COLORS[ep.method]}`}>{ep.method}</span>
                          <div className="min-w-0">
                            <p className="font-bold text-forest-deep truncate">{ep.name}</p>
                            <p className="text-[9px] text-stone-400 font-mono truncate">{ep.path.replace(':instanceName', instanceName || ':instance')}</p>
                          </div>
                          {ep.cost !== undefined && ep.cost > 0 && (
                            <span className="ml-auto text-[9px] font-bold text-yellow-700 shrink-0">{ep.cost}t</span>
                          )}
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
              {/* Request builder */}
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
                    <span className="text-[10px] font-bold text-yellow-700 bg-yellow-50 px-2 py-1 rounded-xl border border-yellow-200 shrink-0">{selectedEndpoint.cost} token{selectedEndpoint.cost > 1 ? 's' : ''}</span>
                  )}
                </div>

                {selectedEndpoint.pathParams && selectedEndpoint.pathParams.length > 0 && (
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl">
                    <p className="text-[9px] font-bold text-stone-500 uppercase mb-2">Path Parameter</p>
                    <div className="flex items-center gap-2">
                      <code className="text-[11px] font-mono text-stone-600">:instanceName</code>
                      <input
                        value={instanceName}
                        onChange={e => setInstanceName(e.target.value)}
                        placeholder="my-container"
                        className="flex-1 px-2 py-1 border border-[#eaebe4] rounded-lg text-xs font-mono focus:outline-none focus:border-yellow-500"
                      />
                    </div>
                  </div>
                )}

                {selectedEndpoint.bodyFields && selectedEndpoint.bodyFields.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold text-stone-500 uppercase">Request Body</p>
                    {selectedEndpoint.bodyFields.map(field => (
                      <div key={field.key}>
                        <label className="block text-[10px] font-bold text-graphite mb-1">
                          {field.label} <span className="text-stone-400">{field.required ? '*' : '(optional)'}</span>
                        </label>
                        {field.type === 'text' ? (
                          <textarea
                            rows={3}
                            value={bodyValues[field.key] || ''}
                            onChange={e => setBodyValues(p => ({ ...p, [field.key]: e.target.value }))}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 border border-[#eaebe4] rounded-xl text-xs font-mono focus:outline-none focus:border-yellow-500 resize-none"
                          />
                        ) : (
                          <input
                            type={field.type === 'number' ? 'number' : 'text'}
                            value={bodyValues[field.key] || ''}
                            onChange={e => setBodyValues(p => ({ ...p, [field.key]: e.target.value }))}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 border border-[#eaebe4] rounded-xl text-xs font-mono focus:outline-none focus:border-yellow-500"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* curl preview */}
                <div className="bg-[#13120d] rounded-xl p-3 relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-bold text-[#8f834a] uppercase">cURL</span>
                    <button onClick={handleCopyCurl} className="flex items-center gap-1 text-[9px] text-stone-400 hover:text-yellow-400 transition-colors">
                      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="text-[10px] font-mono text-yellow-200 overflow-x-auto whitespace-pre-wrap">{buildCurl()}</pre>
                </div>

                <button
                  onClick={handleExecute}
                  disabled={loading || !instanceName}
                  className="w-full flex items-center justify-center gap-2 bg-forest-deep hover:bg-[#33301a] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  {loading ? 'Executing...' : 'Execute Request'}
                </button>
              </div>

              {/* Response viewer */}
              <div className="bg-[#13120d] border border-[#2d2813] rounded-3xl overflow-hidden shadow-lg flex flex-col" style={{ minHeight: '250px' }}>
                <div className="p-3 bg-[#1f1d0b] border-b border-[#353116] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-yellow-400" />
                    <span className="text-[11px] font-mono text-[#cbd4d0]">Response</span>
                    {responseStatus && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${responseStatus < 300 ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                        {responseStatus}
                      </span>
                    )}
                  </div>
                  {response && (
                    <button onClick={() => { setResponse(null); setResponseStatus(null); }} className="text-stone-500 hover:text-white text-[10px] flex items-center gap-1">
                      <X className="w-3 h-3" /> Clear
                    </button>
                  )}
                </div>
                <div ref={responseRef} className="p-4 flex-1 overflow-auto font-mono text-[11px] whitespace-pre-wrap bg-[#0d0d0a] text-yellow-100">
                  {loading ? (
                    <div className="flex items-center justify-center h-full text-yellow-600/60 gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" /> Executing request...
                    </div>
                  ) : response ? (
                    <code>{response}</code>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-[#4a452c] gap-2 text-center">
                      <Terminal className="w-8 h-8" />
                      <p className="text-xs font-bold text-white">Ready to execute</p>
                      <p className="text-[10px] text-[#7d7756] max-w-xs">Fill in the parameters above and click Execute to see the real API response.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white border border-[#eaebe4] rounded-3xl p-8 shadow-sm flex flex-col items-center justify-center text-center space-y-3" style={{ minHeight: '400px' }}>
              <div className="w-16 h-16 rounded-full bg-yellow-50 flex items-center justify-center">
                <Terminal className="w-8 h-8 text-yellow-300" />
              </div>
              <p className="font-bold text-forest-deep text-sm">Select an endpoint to start</p>
              <p className="text-xs text-graphite max-w-sm">Choose any Evolution API endpoint from the browser on the left to build and execute a live request.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
