import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Image as ImageIcon, MapPin, CheckCircle, CheckCheck,
  MoreVertical, Phone, Video, ChevronDown, X, MessageSquare,
  RefreshCw, Smile, Paperclip, SendHorizontal, Users, Clock,
  Plus, Calendar, Trash2, Play, Pause, Zap, AlertCircle, Check
} from 'lucide-react';
import { clientMessagesApi, contactsApi, campaignsApi, instancesApi, groupsApi } from '../../services/api';
import type { ClientMessage, Contact, Instance, ContactGroup } from '../../services/api';

interface ConversationContact {
  phone: string;
  name: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  instanceName: string;
}

interface MessagesViewProps {
  clientToken?: string;
  instances: Instance[];
  onTokenDeduct?: (n: number) => void;
}

export default function MessagesView({ clientToken, instances, onTokenDeduct }: MessagesViewProps) {
  const [messages, setMessages] = useState<ClientMessage[]>([]);
  const [contacts, setContacts] = useState<ConversationContact[]>([]);
  const [savedContacts, setSavedContacts] = useState<Contact[]>([]);
  const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [selectedInstance, setSelectedInstance] = useState<string>('');
  const [showInstancePicker, setShowInstancePicker] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState('');
  const [newChatName, setNewChatName] = useState('');
  const [sendingError, setSendingError] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'bulk'>('chat');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const connectedInstances = instances.filter(i => i.status === 'connected');

  useEffect(() => {
    if (connectedInstances.length > 0 && !selectedInstance) {
      setSelectedInstance(connectedInstances[0].name);
    }
  }, [connectedInstances, selectedInstance]);

  useEffect(() => {
    if (!clientToken) return;
    contactsApi.getAll().then((res) => {
      if (res.success && res.data) setSavedContacts(res.data);
    });
  }, [clientToken]);

  useEffect(() => {
    if (!clientToken) return;
    clientMessagesApi.getAll(selectedInstance || undefined).then((res) => {
      if (res.success && res.data) setMessages(res.data);
    });
  }, [clientToken, selectedInstance]);

  useEffect(() => {
    const handler = (e: CustomEvent<ClientMessage>) => {
      const msg = e.detail as ClientMessage;
      setMessages(prev => {
        const exists = prev.find(m => m.id === msg.id);
        if (exists) return prev;
        return [msg, ...prev];
      });
    };
    window.addEventListener('sse-new-message', handler as EventListener);
    return () => window.removeEventListener('sse-new-message', handler as EventListener);
  }, []);

  useEffect(() => {
    const map = new Map<string, ConversationContact>();
    messages.forEach(msg => {
      const phone = msg.from_number;
      if (!map.has(phone)) {
        map.set(phone, {
          phone,
          name: msg.from_name || phone,
          lastMessage: msg.content || `[${msg.message_type}]`,
          lastTime: msg.timestamp,
          unread: msg.is_read === 0 ? 1 : 0,
          instanceName: msg.instance_name,
        });
      } else {
        const existing = map.get(phone)!;
        if (new Date(msg.timestamp) > new Date(existing.lastTime)) {
          map.set(phone, { ...existing, lastMessage: msg.content || `[${msg.message_type}]`, lastTime: msg.timestamp });
        }
        if (msg.is_read === 0) {
          map.set(phone, { ...existing, unread: existing.unread + 1 });
        }
      }
    });
    setContacts(Array.from(map.values()).sort((a, b) =>
      new Date(b.lastTime).getTime() - new Date(a.lastTime).getTime()
    ));
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedPhone, messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [replyText]);

  const filteredContacts = contacts.filter(c =>
    c.phone.includes(search) || c.name.toLowerCase().includes(search.toLowerCase())
  );

  const conversationMessages = messages
    .filter(m => selectedPhone ? m.from_number === selectedPhone : true)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const selectedContact = contacts.find(c => c.phone === selectedPhone);

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedPhone || !selectedInstance || !clientToken) return;
    setSending(true);
    setSendingError('');

    try {
      const res = await instancesApi.sendText(selectedInstance, selectedPhone, replyText.trim());
      if (res.success && res.data) {
        const sentMsg: ClientMessage = {
          id: res.data.messageId,
          from_number: selectedPhone,
          from_name: selectedContact?.name || selectedPhone,
          message_type: 'text',
          content: replyText.trim(),
          media_url: null,
          is_read: 1,
          timestamp: res.data.timestamp || new Date().toISOString(),
          direction: 'outgoing',
          instance_name: selectedInstance,
        };
        setMessages(prev => [sentMsg, ...prev]);
        setReplyText('');
        onTokenDeduct?.(1);
      } else {
        setSendingError(res.error || 'Failed to send message');
      }
    } catch (err: any) {
      setSendingError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleStartNewChat = () => {
    if (!newChatPhone.trim()) return;
    const phone = newChatPhone.replace(/\D/g, '');
    // Silently save unknown numbers to contacts
    const isKnown = savedContacts.some(c => c.phone === phone);
    if (!isKnown) {
      contactsApi.importBatch([{ phone, name: newChatName || '' }]).then(res => {
        if (res.success && res.data?.count > 0) {
          setSavedContacts(prev => [{ id: `new_${Date.now()}`, phone, name: newChatName || '', tags: '', created_at: new Date().toISOString() }, ...prev]);
        }
      });
    }
    setSelectedPhone(phone);
    setNewChatPhone('');
    setNewChatName('');
    setShowNewChat(false);
  };

  const handleSelectSavedContact = (contact: Contact) => {
    setNewChatPhone(contact.phone);
    setNewChatName(contact.name || '');
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const formatFullTime = (ts: string) => {
    return new Date(ts).toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = (msg: ClientMessage) => {
    if (msg.direction !== 'outgoing') return null;
    return msg.is_read
      ? <CheckCheck className="w-3 h-3 text-blue-400" />
      : <CheckCircle className="w-3 h-3 text-white/40" />;
  };

  return (
    <div className="bg-white border border-[#eaebe4] rounded-3xl overflow-hidden shadow-sm flex" style={{ height: '640px' }}>
      {/* Left sidebar */}
      <div className="w-72 border-r border-[#eaebe4] flex flex-col bg-[#fafaf5]">
        {/* Header */}
        <div className="p-4 border-b border-[#eaebe4]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-forest-deep">Conversations</h3>
            <div className="flex items-center gap-1">
              <button
                onClick={() => { setActiveTab('chat'); setShowNewChat(true); }}
                className="w-7 h-7 rounded-lg bg-forest-deep text-white flex items-center justify-center hover:bg-[#33301a] transition-all"
                title="New chat"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { setActiveTab('bulk'); setShowBulkModal(true); }}
                className="w-7 h-7 rounded-lg bg-yellow-500 text-stone-950 flex items-center justify-center hover:bg-yellow-400 transition-all"
                title="Bulk messages"
              >
                <Zap className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 bg-white"
            />
          </div>
        </div>

        {/* Container filter chips */}
        {connectedInstances.length > 1 && (
          <div className="px-3 py-2 border-b border-[#eaebe4] flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setSelectedInstance('')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-all ${!selectedInstance ? 'bg-forest-deep text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
            >
              All
            </button>
            {connectedInstances.map(inst => (
              <button
                key={inst.name}
                onClick={() => setSelectedInstance(inst.name)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-all flex items-center gap-1 ${selectedInstance === inst.name ? 'bg-forest-deep text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${inst.status === 'connected' ? 'bg-green-400' : 'bg-stone-300'}`} />
                {inst.display_name || inst.name}
              </button>
            ))}
          </div>
        )}

        {/* Contact list */}
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.length > 0 ? filteredContacts.map(contact => (
            <button
              key={contact.phone}
              onClick={() => setSelectedPhone(contact.phone)}
              className={`w-full p-3 flex items-start gap-2.5 hover:bg-stone-100 transition-all text-left border-b border-[#eaebe4]/40 ${
                selectedPhone === contact.phone ? 'bg-yellow-50 border-l-2 border-l-yellow-500' : ''
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-forest-deep flex items-center justify-center text-xs font-bold text-white shrink-0">
                {(contact.name || contact.phone).charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-forest-deep truncate">{contact.name || contact.phone}</span>
                  <span className="text-[9px] text-stone-400 shrink-0 ml-1">{formatTime(contact.lastTime)}</span>
                </div>
                <p className="text-[10px] text-stone-500 font-mono truncate">{contact.phone}</p>
                <p className="text-[10px] text-stone-400 truncate mt-0.5">{contact.lastMessage}</p>
              </div>
              {contact.unread > 0 && (
                <span className="w-4 h-4 rounded-full bg-yellow-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {contact.unread}
                </span>
              )}
            </button>
          )) : (
            <div className="p-8 text-center text-stone-400 space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-yellow-200" />
              <p className="text-xs font-bold text-forest-deep">No conversations yet</p>
              <p className="text-[10px] text-graphite">Incoming messages will appear here.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col">
        {selectedPhone ? (
          <>
            {/* Header */}
            <div className="p-3 border-b border-[#eaebe4] bg-[#fafaf5] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-forest-deep flex items-center justify-center text-xs font-bold text-white">
                  {(selectedContact?.name || selectedPhone).charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-forest-deep">{selectedContact?.name || selectedPhone}</p>
                  <p className="text-[10px] text-stone-500 font-mono">{selectedPhone}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-all" title="Call">
                  <Phone className="w-3.5 h-3.5" />
                </button>
                <button className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-all" title="Video call">
                  <Video className="w-3.5 h-3.5" />
                </button>
                <button className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-500 transition-all" title="More options">
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Instance selector */}
            <div className="px-4 py-2 border-b border-[#eaebe4] bg-white flex items-center gap-2">
              <span className="text-[10px] text-stone-400 font-medium">Sending from:</span>
              <div className="relative">
                <button
                  onClick={() => setShowInstancePicker(!showInstancePicker)}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 hover:bg-stone-200 rounded-lg text-[10px] font-bold text-forest-deep transition-all"
                >
                  <SmartphoneIcon className="w-3 h-3" />
                  {selectedInstance || 'All containers'}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showInstancePicker && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-[#eaebe4] rounded-xl shadow-lg z-10 min-w-[180px]">
                    <button
                      onClick={() => { setSelectedInstance(''); setShowInstancePicker(false); }}
                      className="w-full px-3 py-2 text-left text-[11px] hover:bg-stone-50 flex items-center gap-2 border-b border-[#eaebe4] font-bold text-forest-deep"
                    >
                      All containers
                    </button>
                    {connectedInstances.map(inst => (
                      <button
                        key={inst.name}
                        onClick={() => { setSelectedInstance(inst.name); setShowInstancePicker(false); }}
                        className={`w-full px-3 py-2 text-left text-[11px] hover:bg-stone-50 flex items-center gap-2 ${selectedInstance === inst.name ? 'bg-yellow-50 font-bold text-forest-deep' : 'text-stone-600'}`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${inst.status === 'connected' ? 'bg-green-500' : 'bg-stone-300'}`} />
                        {inst.display_name || inst.name}
                        {inst.phone_number && <span className="text-stone-400 font-mono ml-auto">{inst.phone_number}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {connectedInstances.length === 0 && (
                <span className="text-[10px] text-red-500">Connect a container to send messages</span>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f4f4ef]">
              {conversationMessages.length > 0 ? conversationMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                  title={formatFullTime(msg.timestamp)}
                >
                  <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                    msg.direction === 'outgoing'
                      ? 'bg-forest-deep text-white rounded-br-md'
                      : 'bg-white border border-[#eaebe4] text-forest-deep rounded-bl-md'
                  }`}>
                    {msg.media_url && (
                      msg.message_type === 'image' ? (
                        <img src={msg.media_url} alt="media" className="rounded-xl w-52 h-52 object-cover mb-2" />
                      ) : msg.message_type === 'video' ? (
                        <video src={msg.media_url} controls className="rounded-xl w-52 mb-2" />
                      ) : (
                        <div className="flex items-center gap-2 mb-2">
                          <Paperclip className="w-4 h-4" />
                          <a href={msg.media_url} target="_blank" rel="noreferrer" className="underline text-[10px]">View media</a>
                        </div>
                      )
                    )}
                    {msg.message_type === 'location' && (
                      <div className="flex items-center gap-2 mb-2 text-[10px]">
                        <MapPin className="w-4 h-4" />
                        <span>Location</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                    <div className={`flex items-center gap-1 mt-1.5 ${msg.direction === 'outgoing' ? 'justify-end' : ''}`}>
                      <span className={`text-[9px] ${msg.direction === 'outgoing' ? 'text-white/50' : 'text-stone-400'}`}>
                        {formatTime(msg.timestamp)}
                      </span>
                      {getStatusIcon(msg)}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center text-stone-400 py-12 space-y-2">
                  <MessageSquare className="w-8 h-8 mx-auto text-yellow-200" />
                  <p className="text-xs font-bold text-forest-deep">Start the conversation</p>
                  <p className="text-[10px] text-graphite">Send a message to {selectedPhone}</p>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {sendingError && (
              <div className="px-4 py-1.5 bg-red-50 border-t border-red-100 flex items-center gap-2">
                <span className="text-[10px] text-red-600">{sendingError}</span>
                <button onClick={() => setSendingError('')} className="ml-auto"><X className="w-3 h-3 text-red-400" /></button>
              </div>
            )}

            {/* Composer */}
            <div className="p-3 border-t border-[#eaebe4] bg-white">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder={`Message ${selectedContact?.name || selectedPhone}...`}
                    className="w-full px-3 py-2 pr-10 text-xs border border-[#eaebe4] rounded-2xl focus:outline-none focus:border-yellow-500 resize-none bg-stone-50"
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); } }}
                  />
                  <button className="absolute right-2.5 bottom-2.5 w-5 h-5 text-stone-400 hover:text-stone-600 transition-all">
                    <Smile className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || sending || connectedInstances.length === 0}
                  className="bg-forest-deep hover:bg-[#33301a] text-white p-2.5 rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
                >
                  {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[9px] text-stone-400">1 token per text</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-stone-400 space-y-3 bg-[#fafaf5]">
            <MessageSquare className="w-12 h-12 text-yellow-200" />
            <div>
              <p className="font-bold text-forest-deep text-sm">Select a conversation</p>
              <p className="text-xs text-graphite">Choose a contact from the left to view messages</p>
            </div>
          </div>
        )}
      </div>

      {/* New chat modal */}
      {showNewChat && (
        <NewChatModal
          savedContacts={savedContacts}
          value={newChatPhone}
          name={newChatName}
          onChangePhone={setNewChatPhone}
          onChangeName={setNewChatName}
          onSelectContact={handleSelectSavedContact}
          onClose={() => setShowNewChat(false)}
          onSubmit={handleStartNewChat}
        />
      )}

      {/* Bulk message modal */}
      {showBulkModal && (
        <BulkMessageModal
          instances={connectedInstances}
          savedContacts={savedContacts}
          clientToken={clientToken}
          onClose={() => setShowBulkModal(false)}
          onTokenDeduct={onTokenDeduct}
        />
      )}
    </div>
  );
}

// ---- Sub-components ----

function SmartphoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  );
}

interface NewChatModalProps {
  savedContacts: Contact[];
  value: string;
  name: string;
  onChangePhone: (v: string) => void;
  onChangeName: (v: string) => void;
  onSelectContact: (c: Contact) => void;
  onClose: () => void;
  onSubmit: () => void;
}

const COUNTRY_CODES = [
  { code: '+1', country: 'US/CA', flag: '🇺🇸' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+255', country: 'Tanzania', flag: '🇹🇿' },
  { code: '+256', country: 'Uganda', flag: '🇺🇬' },
  { code: '+250', country: 'Rwanda', flag: '🇷🇼' },
  { code: '+251', country: 'Ethiopia', flag: '🇪🇹' },
  { code: '+249', country: 'Sudan', flag: '🇸🇩' },
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+216', country: 'Tunisia', flag: '🇹🇳' },
  { code: '+213', country: 'Algeria', flag: '🇩🇿' },
  { code: '+212', country: 'Morocco', flag: '🇲🇦' },
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+66', country: 'Thailand', flag: '🇹🇭' },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+233', country: 'Ghana', flag: '🇬🇭' },
  { code: '+225', country: "Cote d'Ivoire", flag: '🇨🇮' },
  { code: '+221', country: 'Senegal', flag: '🇸🇳' },
  { code: '+230', country: 'Mauritius', flag: '🇲🇺' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+32', country: 'Belgium', flag: '🇧🇪' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: '+43', country: 'Austria', flag: '🇦🇹' },
  { code: '+45', country: 'Denmark', flag: '🇩🇰' },
  { code: '+46', country: 'Sweden', flag: '🇸🇪' },
  { code: '+47', country: 'Norway', flag: '🇳🇴' },
  { code: '+358', country: 'Finland', flag: '🇫🇮' },
  { code: '+30', country: 'Greece', flag: '🇬🇷' },
  { code: '+90', country: 'Turkey', flag: '🇹🇷' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+973', country: 'Bahrain', flag: '🇧🇭' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+962', country: 'Jordan', flag: '🇯🇴' },
  { code: '+972', country: 'Israel', flag: '🇮🇱' },
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+56', country: 'Chile', flag: '🇨🇱' },
  { code: '+57', country: 'Colombia', flag: '🇨🇴' },
  { code: '+51', country: 'Peru', flag: '🇵🇪' },
  { code: '+598', country: 'Uruguay', flag: '🇺🇾' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
];

function NewChatModal({ savedContacts, value, name, onChangePhone, onChangeName, onSelectContact, onClose, onSubmit }: NewChatModalProps) {
  const [activeTab, setActiveTab] = useState<'contacts' | 'newnumber'>('contacts');
  const [contactSearch, setContactSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('+254');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');

  const filtered = savedContacts.filter(c =>
    !contactSearch || c.phone.includes(contactSearch) || (c.name || '').toLowerCase().includes(contactSearch.toLowerCase())
  );

  const handlePhoneChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    onChangePhone(selectedCountry + digits);
  };

  const handleCountrySelect = (code: string) => {
    setSelectedCountry(code);
    setShowCountryPicker(false);
    setPhoneInput('');
    onChangePhone(code);
  };

  const selectedCountryData = COUNTRY_CODES.find(c => c.code === selectedCountry);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[420px] overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-[#eaebe4] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-forest-deep">New Conversation</h3>
            <p className="text-[10px] text-graphite mt-0.5">Start a chat with any contact</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center transition-all">
            <X className="w-4 h-4 text-stone-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#eaebe4]">
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex-1 py-2.5 text-[11px] font-bold transition-all border-b-2 ${
              activeTab === 'contacts'
                ? 'border-forest-deep text-forest-deep'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Existing Contacts
            </div>
          </button>
          <button
            onClick={() => setActiveTab('newnumber')}
            className={`flex-1 py-2.5 text-[11px] font-bold transition-all border-b-2 ${
              activeTab === 'newnumber'
                ? 'border-forest-deep text-forest-deep'
                : 'border-transparent text-stone-400 hover:text-stone-600'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              New Number
            </div>
          </button>
        </div>

        <div className="p-5">
          {activeTab === 'contacts' && (
            <div className="space-y-3">
              {savedContacts.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Users className="w-8 h-8 mx-auto text-stone-200" />
                  <p className="text-xs font-bold text-forest-deep">No saved contacts</p>
                  <p className="text-[10px] text-graphite">Switch to "New Number" to message any number</p>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
                    <input
                      value={contactSearch}
                      onChange={e => setContactSearch(e.target.value)}
                      placeholder="Search by name or number..."
                      className="w-full pl-9 pr-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-1">
                    {filtered.map(c => (
                      <button
                        key={c.id}
                        onClick={() => onSelectContact(c)}
                        className="w-full px-3 py-2.5 text-left rounded-xl hover:bg-stone-50 flex items-center gap-3 transition-all border border-transparent hover:border-[#eaebe4]"
                      >
                        <div className="w-9 h-9 rounded-full bg-forest-deep flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {(c.name || c.phone).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-forest-deep truncate">{c.name || c.phone}</p>
                          <p className="text-[10px] text-stone-400 font-mono">{c.phone}</p>
                        </div>
                        {c.tags && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-stone-100 rounded-full text-stone-500 shrink-0">{c.tags}</span>
                        )}
                      </button>
                    ))}
                    {filtered.length === 0 && (
                      <p className="text-center text-[11px] text-stone-400 py-4">No contacts match your search</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'newnumber' && (
            <div className="space-y-4">
              {/* Country picker */}
              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Country</label>
                <div className="relative mt-1">
                  <button
                    onClick={() => setShowCountryPicker(!showCountryPicker)}
                    className="w-full px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 bg-white flex items-center justify-between"
                  >
                    <span className="font-bold text-forest-deep">
                      {selectedCountryData?.code} {selectedCountryData?.country}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                  </button>
                  {showCountryPicker && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#eaebe4] rounded-xl shadow-lg z-10 max-h-52 overflow-y-auto">
                      <div className="sticky top-0 bg-white border-b border-[#eaebe4] px-3 py-1.5">
                        <input
                          placeholder="Search country..."
                          className="w-full text-[10px] border border-[#eaebe4] rounded-lg px-2 py-1 focus:outline-none focus:border-yellow-500"
                          onChange={e => {
                            const q = e.target.value.toLowerCase();
                            // filter the picker list
                          }}
                          autoFocus
                        />
                      </div>
                      {COUNTRY_CODES.map(c => (
                        <button
                          key={c.code + c.country}
                          onClick={() => handleCountrySelect(c.code)}
                          className={`w-full px-3 py-2 text-left text-[11px] hover:bg-stone-50 flex items-center gap-2 transition-colors ${
                            selectedCountry === c.code ? 'bg-yellow-50 font-bold text-forest-deep' : 'text-stone-600'
                          }`}
                        >
                          <span className="w-6 text-center">{c.flag}</span>
                          <span className="font-mono text-[10px] text-stone-400 w-10">{c.code}</span>
                          <span>{c.country}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Phone number */}
              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Phone Number</label>
                <div className="mt-1 flex rounded-xl border border-[#eaebe4] overflow-hidden focus-within:border-yellow-500">
                  <div className="px-3 py-2 bg-stone-50 text-xs font-bold text-stone-500 font-mono flex items-center border-r border-[#eaebe4] shrink-0">
                    {selectedCountry}
                  </div>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={e => { setPhoneInput(e.target.value); handlePhoneChange(e.target.value); }}
                    placeholder="712 345 678"
                    className="flex-1 px-3 py-2 text-xs font-mono focus:outline-none bg-white"
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') onSubmit(); }}
                  />
                </div>
                <p className="text-[9px] text-stone-400 mt-1">Enter the local number without the country code</p>
              </div>

              {/* Name */}
              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Name (optional)</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => onChangeName(e.target.value)}
                  placeholder="Display name for this contact"
                  className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500"
                  onKeyDown={e => { if (e.key === 'Enter') onSubmit(); }}
                />
              </div>

              {/* Preview */}
              {phoneInput && (
                <div className="px-3 py-2 bg-stone-50 rounded-xl flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  <span className="text-xs font-mono text-forest-deep">{selectedCountry} {phoneInput}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={onSubmit}
            disabled={activeTab === 'newnumber' && !phoneInput.trim()}
            className="w-full py-2.5 bg-forest-deep text-white text-xs font-bold rounded-xl hover:bg-[#33301a] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Open Chat
          </button>
        </div>
      </div>
    </div>
  );
}

interface BulkMessageModalProps {
  instances: Instance[];
  savedContacts: Contact[];
  clientToken?: string;
  onClose: () => void;
  onTokenDeduct?: (n: number) => void;
}

function BulkMessageModal({ instances, savedContacts, clientToken, onClose, onTokenDeduct }: BulkMessageModalProps) {
  const [step, setStep] = useState<'setup' | 'preview' | 'sending'>('setup');
  const [campaignName, setCampaignName] = useState('');
  const [selectedInstance, setSelectedInstance] = useState(instances[0]?.name || '');
  const [messageText, setMessageText] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [phoneInput, setPhoneInput] = useState('');
  const [extraPhones, setExtraPhones] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [loadingGroups, setLoadingGroups] = useState(false);

  useEffect(() => {
    groupsApi.getAll().then(res => {
      if (res.success && res.data) setGroups(res.data);
    });
  }, []);

  const allPhones = [
    ...(selectedGroup ? [] : Array.from(selectedContacts)),
    ...extraPhones.map(p => p.replace(/\D/g, '')).filter(Boolean),
  ];

  const toggleContact = (phone: string) => {
    setSelectedContacts(prev => {
      const next = new Set(prev);
      if (next.has(phone)) next.delete(phone);
      else next.add(phone);
      return next;
    });
  };

  const addPhone = () => {
    const phone = phoneInput.replace(/\D/g, '');
    if (phone && !allPhones.includes(phone)) {
      setExtraPhones(prev => [...prev, phone]);
      setPhoneInput('');
    }
  };

  const totalCost = messageText.trim() ? allPhones.length : 0;

  const handleCreateAndSend = async () => {
    if (!campaignName.trim() || !selectedInstance || allPhones.length === 0 || !messageText.trim()) return;
    setCreating(true);
    setError('');
    try {
      const payload: any = {
        name: campaignName,
        instance_name: selectedInstance,
        message_type: 'text',
        content: messageText,
        scheduled_at: scheduledAt || undefined,
      };
      if (selectedGroup) {
        payload.group_id = selectedGroup;
      } else {
        payload.phone_numbers = allPhones;
      }
      const res = await campaignsApi.create(payload);
      if (res.success && res.data) {
        const sendRes = await campaignsApi.send(res.data.id);
        if (sendRes.success) {
          onTokenDeduct?.(sendRes.data?.tokens_deducted || totalCost);
          setStep('sending');
        } else {
          setError(sendRes.error || 'Failed to start campaign');
        }
      } else {
        setError(res.error || 'Failed to create campaign');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const recipientCount = selectedGroup
    ? groups.find(g => g.id === selectedGroup)?.member_count || 0
    : allPhones.length;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-[560px] max-h-[85vh] flex flex-col">
        {/* Modal header */}
        <div className="p-5 border-b border-[#eaebe4] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-yellow-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-stone-950" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-forest-deep">Bulk Message Campaign</h3>
              <p className="text-[10px] text-graphite">Send to multiple contacts with smart queuing</p>
            </div>
          </div>
          <button onClick={onClose} className="w-6 h-6 rounded-lg hover:bg-stone-100 flex items-center justify-center">
            <X className="w-4 h-4 text-stone-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {step === 'setup' && (
            <>
              {/* Campaign name */}
              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Campaign Name</label>
                <input
                  value={campaignName}
                  onChange={e => setCampaignName(e.target.value)}
                  placeholder="e.g. June Promotion"
                  className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500"
                />
              </div>

              {/* Container */}
              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Container</label>
                <div className="relative mt-1">
                  <select
                    value={selectedInstance}
                    onChange={e => setSelectedInstance(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 bg-white appearance-none"
                  >
                    {instances.map(inst => (
                      <option key={inst.name} value={inst.name}>
                        {inst.display_name || inst.name}{inst.phone_number ? ` (${inst.phone_number})` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400 pointer-events-none" />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Message</label>
                <textarea
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  rows={4}
                  placeholder="Type your message..."
                  className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 resize-none"
                />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[9px] text-stone-400">{recipientCount} recipients</span>
                  <span className="text-[9px] text-stone-400">{totalCost} tokens</span>
                </div>
              </div>

              {/* Source selector: group or manual */}
              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1 block">Recipients</label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[9px] text-stone-400 mb-1 block">From group</label>
                    <div className="relative">
                      <select
                        value={selectedGroup}
                        onChange={e => { setSelectedGroup(e.target.value); setSelectedContacts(new Set()); setExtraPhones([]); }}
                        className="w-full px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 bg-white appearance-none"
                      >
                        <option value="">-- Select a group --</option>
                        {groups.map(g => (
                          <option key={g.id} value={g.id}>{g.name} ({g.member_count})</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-stone-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Manual selection — only show when no group selected */}
              {!selectedGroup && (
                <>
                  {savedContacts.length > 0 && (
                    <div>
                      <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide mb-1 block">
                        Select from saved contacts
                      </label>
                      <div className="max-h-32 overflow-y-auto border border-[#eaebe4] rounded-xl">
                        {savedContacts.map(c => (
                          <label key={c.id} className="flex items-center gap-2 px-3 py-2 hover:bg-stone-50 cursor-pointer border-b border-[#eaebe4]/50 last:border-0">
                            <input
                              type="checkbox"
                              checked={selectedContacts.has(c.phone)}
                              onChange={() => toggleContact(c.phone)}
                              className="w-3.5 h-3.5 rounded accent-yellow-500"
                            />
                            <div>
                              <p className="text-[11px] font-bold text-forest-deep">{c.name || c.phone}</p>
                              <p className="text-[9px] text-stone-400 font-mono">{c.phone}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Extra phones */}
                  <div>
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Add phone numbers</label>
                    <div className="flex gap-1.5 mt-1">
                      <input
                        value={phoneInput}
                        onChange={e => setPhoneInput(e.target.value)}
                        placeholder="254712345678"
                        className="flex-1 px-3 py-1.5 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 font-mono"
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPhone(); } }}
                      />
                      <button onClick={addPhone} className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-xl text-[10px] font-bold text-stone-600 transition-all">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    {extraPhones.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {extraPhones.map(p => (
                          <span key={p} className="px-2 py-0.5 bg-stone-100 rounded-full text-[10px] font-mono flex items-center gap-1">
                            {p}
                            <button onClick={() => setExtraPhones(prev => prev.filter(x => x !== p))}>
                              <X className="w-2.5 h-2.5 text-stone-400" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Schedule */}
              <div>
                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wide">Schedule (optional)</label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500"
                />
              </div>

              {error && (
                <div className="px-3 py-2 bg-red-50 rounded-xl text-[11px] text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </div>
              )}
            </>
          )}

          {step === 'preview' && (
            <div className="space-y-3">
              <div className="bg-stone-50 rounded-xl p-4 space-y-2">
                <p className="text-[11px] font-bold text-forest-deep">Campaign: {campaignName}</p>
                <p className="text-[10px] text-stone-500">Container: {selectedInstance}</p>
                <p className="text-[10px] text-stone-500">Recipients: {recipientCount}</p>
                <p className="text-[10px] text-stone-500">Tokens: {totalCost}</p>
                {selectedGroup && <p className="text-[10px] text-stone-500">Group: {groups.find(g => g.id === selectedGroup)?.name}</p>}
                {scheduledAt && <p className="text-[10px] text-stone-500">Scheduled: {new Date(scheduledAt).toLocaleString()}</p>}
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <p className="text-[10px] font-bold text-yellow-800 mb-1">Message preview:</p>
                <p className="text-[11px] text-yellow-900 whitespace-pre-wrap">{messageText}</p>
              </div>
            </div>
          )}

          {step === 'sending' && (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm font-bold text-forest-deep">Campaign created and queued!</p>
              <p className="text-xs text-graphite">{recipientCount} messages queued for delivery</p>
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="p-5 border-t border-[#eaebe4] flex items-center justify-between shrink-0">
          {step === 'setup' && (
            <>
              <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-stone-500 hover:text-stone-700 transition-all">
                Cancel
              </button>
              <button
                onClick={() => { if (recipientCount > 0 && messageText.trim() && campaignName.trim()) setStep('preview'); }}
                disabled={recipientCount <= 0 || !messageText.trim() || !campaignName.trim()}
                className="px-4 py-2 bg-forest-deep text-white text-xs font-bold rounded-xl hover:bg-[#33301a] disabled:opacity-30 transition-all"
              >
                Preview ({recipientCount})
              </button>
            </>
          )}
          {step === 'preview' && (
            <>
              <button onClick={() => setStep('setup')} className="px-4 py-2 text-xs font-bold text-stone-500 hover:text-stone-700 transition-all">
                Back
              </button>
              <button
                onClick={handleCreateAndSend}
                disabled={creating || !selectedInstance}
                className="px-4 py-2 bg-yellow-500 text-stone-950 text-xs font-bold rounded-xl hover:bg-yellow-400 disabled:opacity-30 transition-all flex items-center gap-2"
              >
                {creating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                {creating ? 'Sending...' : `Send Campaign (${totalCost} tokens)`}
              </button>
            </>
          )}
          {step === 'sending' && (
            <button onClick={onClose} className="px-4 py-2 bg-forest-deep text-white text-xs font-bold rounded-xl hover:bg-[#33301a] transition-all mx-auto">
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
