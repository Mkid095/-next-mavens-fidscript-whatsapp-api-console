/**
 * ChatbotsView — chatbot management + test console for the client dashboard.
 * Allows creating bots, configuring triggers/rules, and testing them in-browser.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../../../services/api';
import type { Instance } from '../../../services/api';
import { Bot, Plus, Zap, Settings, MessageSquare, Trash2, ToggleLeft, ToggleRight, Send, ChevronRight } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Chatbot {
  id: string;
  name: string;
  description: string;
  instance_id: string;
  enabled: number;
  priority: number;
  trigger_count?: number;
  contact_count?: number;
  created_at: string;
}

interface Trigger {
  id: string;
  trigger_type: string;
  trigger_value: string;
  keyword_mode: string;
  enabled: number;
  priority: number;
}

interface Rule {
  id: string;
  name: string;
  action: string;
  conditions_json: string;
  priority: number;
  enabled: number;
}

interface AiConfig {
  model: string;
  provider: string;
  system_prompt: string;
  hallucination_policy: string;
  max_tokens: number;
  temperature: number;
  llm_connection_id?: string;
}

interface ProviderOption {
  id: string;
  provider_type: string;
  name: string;
  description: string;
  base_url: string;
  is_free_tier: number;
}

interface ConnectionOption {
  id: string;
  provider: string;
  model: string;
  provider_name: string;
  is_default: number;
}

interface Policy {
  confidence_threshold: number;
  requires_confirmation: string;
  fallback_reply: string;
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface ChatbotsViewProps {
  clientToken: string;
  instances: Instance[];
}

export default function ChatbotsView({ clientToken, instances }: ChatbotsViewProps) {
  const navigate = useNavigate();
  const [bots, setBots] = useState<Chatbot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBot, setSelectedBot] = useState<Chatbot | null>(null);
  const [tab, setTab] = useState<'triggers' | 'rules' | 'ai' | 'test'>('triggers');
  const [showCreate, setShowCreate] = useState(false);

  // Triggers
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [newTriggerType, setNewTriggerType] = useState('keyword');
  const [newTriggerValue, setNewTriggerValue] = useState('');

  // Rules
  const [rules, setRules] = useState<Rule[]>([]);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleAction, setNewRuleAction] = useState('ai');

  // AI Config
  const [aiConfig, setAiConfig] = useState<AiConfig>({
    model: 'gemini-2.0-flash', provider: 'gemini', system_prompt: '',
    hallucination_policy: 'balanced', max_tokens: 2048, temperature: 0.7,
  });
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [connections, setConnections] = useState<ConnectionOption[]>([]);

  // Test Console
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState<Record<string, unknown> | null>(null);
  const [testing, setTesting] = useState(false);

  const loadBots = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/api/platform/chatbots', {
        headers: { Authorization: `Bearer ${clientToken}` },
      }) as { success: boolean; data: Chatbot[] };
      if (data.success) setBots(data.data);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [clientToken]);

  const loadBotDetail = useCallback(async (botId: string) => {
    const data = await fetchApi(`/api/platform/chatbots/${botId}`, {
      headers: { Authorization: `Bearer ${clientToken}` },
    }) as { success: boolean; data: {
      triggers?: Trigger[];
      rules?: Rule[];
      aiConfig?: Partial<AiConfig>[];
    } };
    if (data.success) {
      const d = data.data;
      setTriggers(d.triggers ?? []);
      setRules(d.rules ?? []);
      setAiConfig({
        model: d.aiConfig?.[0]?.model ?? 'gemini-2.0-flash',
        provider: d.aiConfig?.[0]?.provider ?? 'gemini',
        system_prompt: d.aiConfig?.[0]?.system_prompt ?? '',
        hallucination_policy: d.aiConfig?.[0]?.hallucination_policy ?? 'balanced',
        max_tokens: d.aiConfig?.[0]?.max_tokens ?? 2048,
        temperature: d.aiConfig?.[0]?.temperature ?? 0.7,
        llm_connection_id: d.aiConfig?.[0]?.llm_connection_id,
      });
    }
    // Load available providers + workspace connections
    const [provRes, connRes] = await Promise.all([
      fetchApi<ProviderOption[]>('/api/platform/llm-connections/available-providers', {
        headers: { Authorization: `Bearer ${clientToken}` },
      }),
      fetchApi<ConnectionOption[]>('/api/platform/llm-connections', {
        headers: { Authorization: `Bearer ${clientToken}` },
      }),
    ]);
    if (provRes.success && provRes.data) setProviders(provRes.data);
    if (connRes.success && connRes.data) setConnections(connRes.data);
  }, [clientToken]);

  useEffect(() => { loadBots(); }, [loadBots]);

  useEffect(() => {
    if (selectedBot) loadBotDetail(selectedBot.id);
  }, [selectedBot, loadBotDetail]);

  // ─── Create bot ─────────────────────────────────────────────────────────────

  const [createName, setCreateName] = useState('');
  const [createInstance, setCreateInstance] = useState('');

  const handleCreate = async () => {
    if (!createName || !createInstance) return;
    const res = await fetchApi('/api/platform/chatbots', {
      method: 'POST',
      headers: { Authorization: `Bearer ${clientToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: createName, instance_id: createInstance }),
    });
    if (res.success) {
      setShowCreate(false);
      setCreateName('');
      loadBots();
    }
  };

  // ─── Toggle bot ────────────────────────────────────────────────────────────

  const handleToggle = async (bot: Chatbot) => {
    await fetchApi(`/api/platform/chatbots/${bot.id}/toggle`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${clientToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !bot.enabled }),
    });
    loadBots();
  };

  // ─── Delete bot ────────────────────────────────────────────────────────────

  const handleDelete = async (botId: string) => {
    if (!confirm('Delete this chatbot?')) return;
    await fetchApi(`/api/platform/chatbots/${botId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    if (selectedBot?.id === botId) setSelectedBot(null);
    loadBots();
  };

  // ─── Add trigger ───────────────────────────────────────────────────────────

  const handleAddTrigger = async () => {
    if (!selectedBot || !newTriggerValue) return;
    const res = await fetchApi(`/api/platform/chatbots/${selectedBot.id}/triggers`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${clientToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ trigger_type: newTriggerType, trigger_value: newTriggerValue }),
    });
    if (res.success) { setNewTriggerValue(''); loadBotDetail(selectedBot.id); }
  };

  const handleDeleteTrigger = async (triggerId: string) => {
    if (!selectedBot) return;
    await fetchApi(`/api/platform/chatbots/${selectedBot.id}/triggers/${triggerId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    loadBotDetail(selectedBot.id);
  };

  // ─── Add rule ─────────────────────────────────────────────────────────────

  const handleAddRule = async () => {
    if (!selectedBot || !newRuleName) return;
    const res = await fetchApi(`/api/platform/chatbots/${selectedBot.id}/rules`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${clientToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newRuleName, action: newRuleAction, conditions_json: '[]' }),
    });
    if (res.success) { setNewRuleName(''); loadBotDetail(selectedBot.id); }
  };

  // ─── Save AI config ────────────────────────────────────────────────────────

  const handleSaveAiConfig = async () => {
    if (!selectedBot) return;
    await fetchApi(`/api/platform/chatbots/${selectedBot.id}/ai-config`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${clientToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(aiConfig),
    });
  };

  // ─── Test console ──────────────────────────────────────────────────────────

  const handleTest = async () => {
    if (!selectedBot || !testMessage) return;
    setTesting(true);
    try {
      const res = await fetchApi(`/api/platform/chatbots/${selectedBot.id}/test-trigger`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${clientToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testMessage }),
      }) as { success: boolean; data?: Record<string, unknown>; error?: string };
      setTestResult(res.success && res.data ? res.data : { error: res.error ?? 'Unknown error' });
    } catch (err) {
      setTestResult({ error: String(err) });
    } finally { setTesting(false); }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  const instanceMap = Object.fromEntries(instances.map(i => [i.id, i.name]));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-yellow-400" />
            Chatbots
          </h2>
          <p className="text-sm text-[#8f834a] mt-1">
            Build AI-powered automated responses for your WhatsApp containers
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-xl text-sm transition"
        >
          <Plus className="w-4 h-4" />
          New Chatbot
        </button>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="bg-[#1a1915] border border-yellow-500/20 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-white">Create Chatbot</h3>
          <div>
            <label className="block text-xs text-[#8f834a] mb-1">Bot Name</label>
            <input value={createName} onChange={e => setCreateName(e.target.value)}
              className="w-full bg-[#0d0c0a] border border-[#2a2520] rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-500/50 outline-none"
              placeholder="e.g. Sales Bot, FAQ Bot" />
          </div>
          <div>
            <label className="block text-xs text-[#8f834a] mb-1">WhatsApp Container</label>
            <select value={createInstance} onChange={e => setCreateInstance(e.target.value)}
              className="w-full bg-[#0d0c0a] border border-[#2a2520] rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-500/50 outline-none">
              <option value="">Select container...</option>
              {instances.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreate}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg text-sm">
              Create
            </button>
            <button onClick={() => setShowCreate(false)}
              className="px-4 py-2 bg-[#2a2520] hover:bg-[#3a3530] text-white rounded-lg text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full" />
        </div>
      ) : bots.length === 0 ? (
        <div className="text-center py-16 text-[#8f834a]">
          <Bot className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-semibold">No chatbots yet</p>
          <p className="text-sm mt-1">Create your first chatbot to automate WhatsApp responses</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bot list */}
          <div className="space-y-2">
            {bots.map(bot => (
              <button
                key={bot.id}
                onClick={() => setSelectedBot(bot)}
                className={`w-full text-left p-4 rounded-xl border transition ${
                  selectedBot?.id === bot.id
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-[#1a1915] border-[#2a2520] hover:border-[#3a3530]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white text-sm">{bot.name}</p>
                    <p className="text-xs text-[#8f834a] mt-0.5">
                      {instanceMap[bot.instance_id] ?? bot.instance_id}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={ev => { ev.stopPropagation(); handleToggle(bot); }}
                      className="text-[#8f834a] hover:text-white" title={bot.enabled ? 'Disable' : 'Enable'}>
                      {bot.enabled
                        ? <ToggleRight className="w-5 h-5 text-green-400" />
                        : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <ChevronRight className="w-4 h-4 text-[#5a554a]" />
                  </div>
                </div>
                <div className="flex gap-3 mt-2 text-xs text-[#6e684a]">
                  <span>{bot.trigger_count ?? 0} triggers</span>
                  <span>{bot.contact_count ?? 0} contacts</span>
                </div>
              </button>
            ))}
          </div>

          {/* Bot detail */}
          <div className="lg:col-span-2 bg-[#1a1915] border border-[#2a2520] rounded-2xl overflow-hidden">
            {selectedBot ? (
              <>
                <div className="flex border-b border-[#2a2520]">
                  {(['triggers', 'rules', 'ai', 'test'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                      className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wide transition ${
                        tab === t ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-[#6e684a] hover:text-white'
                      }`}>
                      {t === 'test' ? 'Test Console' : t}
                    </button>
                  ))}
                </div>

                <div className="p-5 space-y-4">
                  {/* Triggers */}
                  {tab === 'triggers' && (
                    <>
                      <div className="space-y-2">
                        {triggers.length === 0 && (
                          <p className="text-sm text-[#6e684a] text-center py-4">No triggers yet</p>
                        )}
                        {triggers.map(trig => (
                          <div key={trig.id} className="flex items-center justify-between bg-[#0d0c0a] rounded-lg px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Zap className="w-4 h-4 text-yellow-400" />
                              <div>
                                <span className="text-xs font-mono bg-[#2a2520] px-2 py-0.5 rounded text-yellow-300">
                                  {trig.trigger_type}
                                </span>
                                {trig.trigger_value && (
                                  <span className="ml-2 text-sm text-white">{trig.trigger_value}</span>
                                )}
                              </div>
                            </div>
                            <button onClick={() => handleDeleteTrigger(trig.id)}
                              className="text-[#5a554a] hover:text-red-400">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <select value={newTriggerType} onChange={e => setNewTriggerType(e.target.value)}
                          className="bg-[#0d0c0a] border border-[#2a2520] rounded-lg px-3 py-2 text-white text-sm outline-none">
                          <option value="keyword">Keyword</option>
                          <option value="mention">Mention</option>
                          <option value="first_message">First Message</option>
                          <option value="always">Always</option>
                          <option value="regex">Regex</option>
                        </select>
                        <input value={newTriggerValue} onChange={e => setNewTriggerValue(e.target.value)}
                          placeholder="keyword or pattern..."
                          className="flex-1 bg-[#0d0c0a] border border-[#2a2520] rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-500/50 outline-none" />
                        <button onClick={handleAddTrigger}
                          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg text-sm">
                          Add
                        </button>
                      </div>
                    </>
                  )}

                  {/* Rules */}
                  {tab === 'rules' && (
                    <>
                      <div className="space-y-2">
                        {rules.length === 0 && (
                          <p className="text-sm text-[#6e684a] text-center py-4">No rules yet</p>
                        )}
                        {rules.map(rule => (
                          <div key={rule.id} className="flex items-center justify-between bg-[#0d0c0a] rounded-lg px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Settings className="w-4 h-4 text-[#6e684a]" />
                              <span className="text-sm text-white">{rule.name || '(unnamed rule)'}</span>
                              <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                                rule.action === 'ai' ? 'bg-blue-500/20 text-blue-300' :
                                rule.action === 'manual' ? 'bg-red-500/20 text-red-300' :
                                'bg-[#2a2520] text-[#8f834a]'
                              }`}>{rule.action}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input value={newRuleName} onChange={e => setNewRuleName(e.target.value)}
                          placeholder="Rule name..."
                          className="flex-1 bg-[#0d0c0a] border border-[#2a2520] rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-500/50 outline-none" />
                        <select value={newRuleAction} onChange={e => setNewRuleAction(e.target.value)}
                          className="bg-[#0d0c0a] border border-[#2a2520] rounded-lg px-3 py-2 text-white text-sm outline-none">
                          <option value="ai">AI Reply</option>
                          <option value="manual">Handoff to Human</option>
                          <option value="skip">Skip (No Reply)</option>
                        </select>
                        <button onClick={handleAddRule}
                          className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg text-sm">
                          Add Rule
                        </button>
                      </div>
                    </>
                  )}

                  {/* AI Config */}
                  {tab === 'ai' && (
                    <div className="space-y-4">
                      {/* AI Connection selector */}
                      <div>
                        <label className="block text-xs text-[#8f834a] mb-1">AI Connection</label>
                        <select
                          value={aiConfig.llm_connection_id ?? ''}
                          onChange={e => {
                            const connId = e.target.value;
                            const conn = connections.find(c => c.id === connId);
                            setAiConfig({
                              ...aiConfig,
                              llm_connection_id: connId || undefined,
                              provider: conn?.provider ?? aiConfig.provider,
                              model: conn?.model ?? aiConfig.model,
                            });
                          }}
                          className="w-full bg-[#0d0c0a] border border-[#2a2520] rounded-lg px-3 py-2 text-white text-sm outline-none"
                        >
                          <option value="">— Use workspace default —</option>
                          {connections.map(conn => (
                            <option key={conn.id} value={conn.id}>
                              {conn.provider_name} / {conn.model}{conn.is_default ? ' ★' : ''}
                            </option>
                          ))}
                        </select>
                        {connections.length === 0 && (
                          <p className="mt-1 text-[10px] text-[#6e684a]">
                            No AI connections configured.{' '}
                            <span className="text-yellow-400 underline cursor-pointer"
                              onClick={() => navigate('/sandbox')}>
                              Set one up in the API Sandbox
                            </span>
                          </p>
                        )}
                      </div>

                      {/* Model — derived from connection, but can override */}
                      <div>
                        <label className="block text-xs text-[#8f834a] mb-1">
                          Model
                          {aiConfig.llm_connection_id && (
                            <span className="ml-1 text-yellow-400/60 normal-case">(from connection)</span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={aiConfig.model}
                          onChange={e => setAiConfig({ ...aiConfig, model: e.target.value })}
                          placeholder="e.g. gemini-2.0-flash, gpt-4o-mini"
                          className="w-full bg-[#0d0c0a] border border-[#2a2520] rounded-lg px-3 py-2 text-white text-sm font-mono focus:border-yellow-500/50 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-[#8f834a] mb-1">System Prompt</label>
                        <textarea value={aiConfig.system_prompt} onChange={e => setAiConfig({ ...aiConfig, system_prompt: e.target.value })}
                          rows={5}
                          className="w-full bg-[#0d0c0a] border border-[#2a2520] rounded-lg px-3 py-2 text-white text-sm focus:border-yellow-500/50 outline-none resize-none"
                          placeholder="You are a helpful assistant for [Business Name]..." />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-[#8f834a] mb-1">Temperature: {aiConfig.temperature}</label>
                          <input type="range" min="0" max="1" step="0.1" value={aiConfig.temperature}
                            onChange={e => setAiConfig({ ...aiConfig, temperature: Number(e.target.value) })}
                            className="w-full accent-yellow-400" />
                        </div>
                        <div>
                          <label className="block text-xs text-[#8f834a] mb-1">Max Tokens: {aiConfig.max_tokens}</label>
                          <input type="range" min="256" max="4096" step="256" value={aiConfig.max_tokens}
                            onChange={e => setAiConfig({ ...aiConfig, max_tokens: Number(e.target.value) })}
                            className="w-full accent-yellow-400" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-[#8f834a] mb-1">Hallucination Policy</label>
                        <select value={aiConfig.hallucination_policy}
                          onChange={e => setAiConfig({ ...aiConfig, hallucination_policy: e.target.value })}
                          className="w-full bg-[#0d0c0a] border border-[#2a2520] rounded-lg px-3 py-2 text-white text-sm outline-none">
                          <option value="strict">Strict (Knowledge Only)</option>
                          <option value="balanced">Balanced</option>
                          <option value="creative">Creative</option>
                          <option value="disabled">Disabled (Tools Only)</option>
                        </select>
                      </div>
                      <button onClick={handleSaveAiConfig}
                        className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg text-sm">
                        Save AI Config
                      </button>
                    </div>
                  )}

                  {/* Test Console */}
                  {tab === 'test' && (
                    <div className="space-y-4">
                      <div className="bg-[#0d0c0a] rounded-xl p-4 text-xs text-[#6e684a]">
                        <p className="font-semibold text-yellow-400 mb-2">Test Console</p>
                        <p>Type a message below to see which triggers and rules would fire for <strong className="text-white">{selectedBot?.name}</strong>.</p>
                        <p className="mt-1">Actual AI replies are processed asynchronously via NATS.</p>
                      </div>
                      <div className="flex gap-2">
                        <input value={testMessage} onChange={e => setTestMessage(e.target.value)}
                          placeholder="Type a test message..."
                          className="flex-1 bg-[#0d0c0a] border border-[#2a2520] rounded-lg px-4 py-3 text-white text-sm focus:border-yellow-500/50 outline-none"
                          onKeyDown={e => e.key === 'Enter' && handleTest()} />
                        <button onClick={handleTest} disabled={testing}
                          className="px-5 py-3 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-semibold rounded-xl text-sm flex items-center gap-2">
                          {testing ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                          Test
                        </button>
                      </div>
                      {testResult && (
                        <pre className="bg-[#0d0c0a] border border-[#2a2520] rounded-xl p-4 text-xs text-[#8f834a] overflow-auto max-h-64">
                          {JSON.stringify(testResult, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-[#6e684a]">
                <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">Select a chatbot to configure</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete button for selected bot */}
      {selectedBot && (
        <div className="flex justify-end">
          <button onClick={() => handleDelete(selectedBot.id)}
            className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 text-sm">
            <Trash2 className="w-4 h-4" />
            Delete Chatbot
          </button>
        </div>
      )}
    </div>
  );
}
