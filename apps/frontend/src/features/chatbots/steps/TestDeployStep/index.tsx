/**
 * TestDeployStep — thin shell.
 * Step 5 of the Chatbot Builder: chat simulator + config summary + publish.
 */
import React, { useState, useRef, useEffect } from 'react';
import { useChatbotBuilderStore } from '../../store/chatbotBuilderStore';
import { fetchApi } from '../../../../data/api/client.js';
import ConfigSummary from './ConfigSummary';
import ChatSimulator from './ChatSimulator';
import DebugInfo from './DebugInfo';
import { Smartphone, MessageSquare, Cpu, BookOpen, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot' | 'error';
  content: string;
  meta?: {
    trigger?: string;
    latency?: number;
    tokens?: number;
    sources?: string[];
    confidence?: number;
  };
}

interface DebugPayload {
  matched_trigger?: string;
  matched_rule?: string;
  knowledge_sources?: string[];
  tokens_used?: number;
  latency_ms?: number;
  confidence?: number;
  ai_response?: string;
}

export default function TestDeployStep() {
  const { draft, clientToken, botId } = useChatbotBuilderStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [debug, setDebug] = useState<DebugPayload | null>(null);

  const configItems = [
    { icon: Smartphone, label: 'Container', value: draft.instanceId ? 'Connected' : 'Not set', ok: !!draft.instanceId },
    { icon: MessageSquare, label: 'Audience', value: draft.audience.responseScope.replace(/-/g, ' '), ok: true },
    { icon: Cpu, label: 'AI Model', value: draft.aiBrain.model || draft.aiBrain.providerName || 'Not set', ok: !!(draft.aiBrain.model || draft.aiBrain.llmConnectionId) },
    { icon: BookOpen, label: 'Knowledge', value: `${draft.knowledge.sources.length} sources`, ok: draft.knowledge.sources.length > 0 },
    { icon: Sparkles, label: 'Tools', value: `${draft.tools.tools.length} attached`, ok: draft.tools.tools.length > 0 },
  ];

  const canPublish = draft.general.name.trim().length > 0
    && draft.instanceId.length > 0
    && (draft.aiBrain.llmConnectionId.length > 0 || draft.aiBrain.model.length > 0);

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending || !botId) return;
    const userMsg: ChatMessage = { id: `u${Date.now()}`, role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSending(true);
    try {
      const res = await fetchApi<DebugPayload>(`/api/platform/chatbots/${botId}/test-trigger`, {
        method: 'POST',
        body: JSON.stringify({ message: text.trim() }),
      });
      if (res.success && res.data) {
        const d = res.data;
        setDebug(d);
        setMessages(prev => [...prev, {
          id: `b${Date.now()}`, role: 'bot', content: d.ai_response || '(no response)',
          meta: { trigger: d.matched_trigger, latency: d.latency_ms, tokens: d.tokens_used, sources: d.knowledge_sources, confidence: d.confidence },
        }]);
      } else {
        setMessages(prev => [...prev, { id: `e${Date.now()}`, role: 'error', content: res.error || 'Test failed — the bot may not be published yet.' }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { id: `e${Date.now()}`, role: 'error', content: String(e) }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center py-2">
        <h2 className="text-lg font-bold text-white">Test & Deploy</h2>
        <p className="text-xs text-[#8f834a] mt-1">Try a conversation, then publish when ready.</p>
      </div>

      <ConfigSummary configItems={configItems} />

      <ChatSimulator
        messages={messages}
        input={input}
        sending={sending}
        botId={botId}
        onInputChange={setInput}
        onSend={sendMessage}
        onClear={() => { setMessages([]); setDebug(null); }}
      />

      <DebugInfo debug={debug} canPublish={canPublish} />
    </div>
  );
}
