import React, { useState, useEffect, useRef } from 'react';
import {
  Search, CheckCircle, CheckCheck,
  MessageCircle, PenSquare, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clientMessagesApi, contactsApi, instancesApi } from '../../services/api';
import type { ClientMessage, Contact, Instance } from '../../services/api';
import ChatList from './ChatList';
import ChatPanel from './ChatPanel';
import NewChatPanelInline from './NewChatPanelInline';
import EmptyState from './EmptyState';
import ContactProfilePanel from './contacts/ContactProfilePanel';

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
  const [sendingError, setSendingError] = useState('');
  const [showNewChatInline, setShowNewChatInline] = useState(false);
  const [showContactProfile, setShowContactProfile] = useState(false);
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
    const savedContactMap = new Map(savedContacts.map(c => [c.phone, c.name || c.phone]));
    const map = new Map<string, ConversationContact>();
    messages.forEach(msg => {
      const phone = msg.from_number;
      const savedName = savedContactMap.get(phone);
      const displayName = savedName || msg.from_name || phone;
      if (!map.has(phone)) {
        map.set(phone, { phone, name: displayName, lastMessage: msg.content || `[${msg.message_type}]`, lastTime: msg.timestamp, unread: msg.is_read === 0 ? 1 : 0, instanceName: msg.instance_name });
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
  }, [messages, savedContacts]);

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
  const selectedContactDetails = savedContacts.find(c => c.phone === selectedPhone);

  const handleSendReply = async () => {
    const instanceIsConnected = connectedInstances.some(i => i.name === selectedInstance);
    if (!replyText.trim() || !selectedPhone || !selectedInstance || !instanceIsConnected || !clientToken) return;
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

  const handleSelectConversation = (phone: string) => {
    setSelectedPhone(phone);
    setShowContactProfile(false);
  };

  const handleOpenContactProfile = () => {
    if (selectedPhone) setShowContactProfile(true);
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

  const formatDateSeparator = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return 'Today';
    if (diff < 172800000) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const getStatusIcon = (msg: ClientMessage) => {
    if (msg.direction !== 'outgoing') return null;
    return msg.is_read
      ? <CheckCheck className="w-3 h-3 text-blue-400" />
      : <CheckCircle className="w-3 h-3 text-white/40" />;
  };

  const groupedMessages: { date: string; messages: ClientMessage[] }[] = [];
  let lastDate = '';
  conversationMessages.forEach(msg => {
    const dateKey = formatDateSeparator(msg.timestamp);
    if (dateKey !== lastDate) {
      groupedMessages.push({ date: dateKey, messages: [msg] });
      lastDate = dateKey;
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(msg);
    }
  });

  const unreadCount = contacts.reduce((sum, c) => sum + c.unread, 0);

  return (
    <div className="bg-white border border-[#eaebe4] rounded-3xl overflow-hidden shadow-sm flex" style={{ height: '640px' }}>
      {/* Left sidebar */}
      <div className="w-80 border-r border-[#eaebe4] flex flex-col bg-[#fafaf5] shrink-0">
        {/* Sidebar header */}
        <div className="p-4 border-b border-[#eaebe4]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-forest-deep">Chats</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-yellow-500 text-white text-[9px] font-bold rounded-full">{unreadCount}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowNewChatInline(true)}
                className="w-7 h-7 rounded-lg bg-forest-deep text-white flex items-center justify-center hover:bg-[#33301a] transition-all"
                title="New chat"
              >
                <PenSquare className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          { !showNewChatInline && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#eaebe4] rounded-xl focus:outline-none focus:border-yellow-500 bg-white"
              />
            </div>
          )}
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

        {/* Sidebar content */}
        { showNewChatInline ? (
          <NewChatPanelInline
            savedContacts={savedContacts}
            clientToken={clientToken}
            onSelectContact={(phone) => { setSelectedPhone(phone); setShowNewChatInline(false); }}
            onContactCreated={(contact) => { setSavedContacts(prev => [contact, ...prev]); setSelectedPhone(contact.phone); setShowNewChatInline(false); }}
            onClose={() => setShowNewChatInline(false)}
          />
        ) : (
          <ChatList
            contacts={filteredContacts}
            selectedPhone={selectedPhone}
            onSelect={handleSelectConversation}
            formatTime={formatTime}
          />
        )}
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedPhone ? (
          <ChatPanel
            selectedContact={selectedContact}
            selectedPhone={selectedPhone}
            selectedContactDetails={selectedContactDetails}
            conversationMessages={conversationMessages}
            groupedMessages={groupedMessages}
            selectedInstance={selectedInstance}
            selectedInstanceConnected={connectedInstances.some(i => i.name === selectedInstance)}
            connectedInstances={connectedInstances}
            showInstancePicker={showInstancePicker}
            sendingError={sendingError}
            replyText={replyText}
            sending={sending}
            textareaRef={textareaRef}
            bottomRef={bottomRef}
            savedContacts={savedContacts}
            onBack={() => setSelectedPhone(null)}
            onOpenContactProfile={handleOpenContactProfile}
            onToggleInstancePicker={() => setShowInstancePicker(!showInstancePicker)}
            onSelectInstance={(name) => { setSelectedInstance(name); setShowInstancePicker(false); }}
            onClearError={() => setSendingError('')}
            onReplyTextChange={setReplyText}
            onSend={handleSendReply}
            formatTime={formatTime}
            formatFullTime={formatFullTime}
            getStatusIcon={getStatusIcon}
            onTokenDeduct={onTokenDeduct}
          />
        ) : (
          <EmptyState onNewChat={() => setShowNewChatInline(true)} />
        )}
      </div>

      {/* Contact profile panel */}
      <AnimatePresence>
        {showContactProfile && selectedPhone && (
          <ContactProfilePanel
            contact={selectedContactDetails}
            phone={selectedPhone}
            onClose={() => setShowContactProfile(false)}
            messages={conversationMessages}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
