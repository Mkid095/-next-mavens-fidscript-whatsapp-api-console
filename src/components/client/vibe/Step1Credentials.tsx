import { useState } from 'react';
import { Bot, Check, ArrowRight, AlertCircle, Key } from 'lucide-react';
import { PUBLIC_API_BASE } from '../../../data/apiEndpoints/index';
import VibeCopyButton from './VibeCopyButton.js';

interface KeyItem {
  id: string;
  name: string;
  key_prefix?: string;
  last_used: string | null;
}

interface InstanceItem {
  id: string;
  name: string;
  display_name?: string | null;
  phone_number?: string | null;
  status: string;
}

interface Step1CredentialsProps {
  pastedKey: string;
  setPastedKey: (key: string) => void;
  selectedKeyId: string;
  setSelectedKeyId: (id: string) => void;
  instances: InstanceItem[];
  selectedInstance: string;
  setSelectedInstance: (name: string) => void;
  activeKeys: KeyItem[];
  onNext: () => void;
}

export default function Step1Credentials({
  pastedKey,
  setPastedKey,
  selectedKeyId,
  setSelectedKeyId,
  instances,
  selectedInstance,
  setSelectedInstance,
  activeKeys,
  onNext,
}: Step1CredentialsProps) {
  const [confirmed, setConfirmed] = useState(false);

  // Auto-detect a matching key when user pastes
  const isValidKey = pastedKey.startsWith('fidscript_live_') || pastedKey.startsWith('fidscript_test_');
  const detectedPrefix = isValidKey ? pastedKey.substring(0, 20) : null;
  const matchedPasteKey = activeKeys.find(k => k.key_prefix && detectedPrefix && k.key_prefix === detectedPrefix);

  const hasCredentials = !!selectedKeyId || !!pastedKey;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 p-4 bg-[#f9f9f2] border border-[#eaebe4] rounded-2xl">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5 text-blue-700" />
        </div>
        <div>
          <p className="text-xs font-bold text-forest-deep">Vibe Coding Wizard</p>
          <p className="text-[10px] text-graphite">Generate an AI-ready integration prompt for your selected endpoints.</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* API Key selection */}
        {activeKeys.length > 0 && (
          <div>
            <label className="block text-[10px] font-bold text-graphite uppercase mb-2">Select API Key</label>
            <div className="rounded-xl border border-[#eaebe4] bg-stone-50 divide-y divide-[#eaebe4]/60 max-h-40 overflow-y-auto">
              {activeKeys.map(k => {
                const isSelected = selectedKeyId === k.id;
                const prefix = k.key_prefix || 'fidscript_live_';
                return (
                  <button
                    key={k.id}
                    onClick={() => {
                      setSelectedKeyId(k.id);
                      setPastedKey(''); // clear paste when selecting
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all ${isSelected ? 'bg-yellow-50 border-l-2 border-l-yellow-500' : 'hover:bg-stone-100'}`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'bg-yellow-500 border-yellow-500' : 'border-stone-300'}`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[11px] text-forest-deep truncate">{k.name}</p>
                      <p className="font-mono text-[10px] text-stone-500 truncate">{prefix}••••••••</p>
                    </div>
                    <span className="text-[8px] text-stone-400 shrink-0">{k.last_used || 'Never used'}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[9px] text-stone-400 mt-1">Select a key above — the full secret is fetched server-side automatically.</p>
          </div>
        )}

        {/* Or paste a key manually */}
        <div>
          <label className="block text-[10px] font-bold text-graphite uppercase mb-2">
            Or Paste API Key {activeKeys.length > 0 && <span className="normal-case font-normal text-stone-400">(paste if your key is not listed above)</span>}
          </label>
          <input
            type="text"
            value={pastedKey}
            onChange={e => {
              setPastedKey(e.target.value);
              setSelectedKeyId(''); // clear selection when pasting
            }}
            placeholder="fidscript_live_xxxxxxxxxxxx"
            className="w-full px-3 py-2.5 border border-[#eaebe4] bg-white rounded-xl focus:outline-none focus:border-yellow-500 font-mono text-xs text-forest-deep placeholder:text-stone-400"
          />
          {pastedKey && !isValidKey && (
            <p className="text-[9px] text-red-500 mt-1">Key must start with fidscript_live_ or fidscript_test_</p>
          )}
          {matchedPasteKey && (
            <p className="text-[9px] text-green-600 mt-1 flex items-center gap-1">
              <Check className="w-3 h-3" /> Matches "{matchedPasteKey.name}" — no need to paste, just select it above
            </p>
          )}
          {isValidKey && !matchedPasteKey && (
            <p className="text-[9px] text-green-600 mt-1 flex items-center gap-1">
              <Check className="w-3 h-3" /> Valid key format
            </p>
          )}
        </div>

        {/* Container / instance selector */}
        <div>
          <label className="block text-[10px] font-bold text-graphite uppercase mb-2">
            WhatsApp Container <span className="normal-case font-normal text-stone-400">(optional)</span>
          </label>
          <select
            value={selectedInstance}
            onChange={e => setSelectedInstance(e.target.value)}
            className="w-full px-3 py-2.5 border border-[#eaebe4] bg-white rounded-xl focus:outline-none focus:border-yellow-500 text-xs text-forest-deep"
          >
            <option value="">— Leave unset —</option>
            {instances.map(i => (
              <option key={i.id} value={i.name}>
                {i.display_name || i.name} {i.phone_number ? `· ${i.phone_number}` : ''} [{i.status}]
              </option>
            ))}
          </select>
        </div>

        {/* Base URL */}
        <div className="flex items-center gap-2">
          <code className="flex-1 text-[11px] font-mono bg-stone-50 border border-[#eaebe4] px-3 py-2 rounded-lg text-stone-700">{PUBLIC_API_BASE}</code>
          <VibeCopyButton text={PUBLIC_API_BASE} label="Copy" />
        </div>

        {/* Info notice */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
          <p className="text-[10px] text-amber-900 leading-relaxed">
            {activeKeys.length > 0
              ? 'Select a key above or paste your secret. The key will be fetched server-side — never stored in the prompt itself.'
              : 'Paste the API key you saved when it was created. Keys are only shown once.'}
            The container name will be embedded in the generated prompt.
          </p>
        </div>

        {/* Confirm */}
        <label className="flex items-center gap-2 cursor-pointer">
          <button
            onClick={() => setConfirmed(v => !v)}
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${confirmed ? 'bg-forest-deep border-forest-deep' : 'border-stone-300'}`}
          >
            {confirmed && <Check className="w-3 h-3 text-white" />}
          </button>
          <span className="text-[11px] text-graphite">I understand credentials will be embedded in the generated prompt</span>
        </label>
      </div>

      <button
        onClick={onNext}
        disabled={!confirmed || !hasCredentials}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-forest-deep hover:bg-[#33301a] disabled:bg-stone-300 text-white text-xs font-bold rounded-xl transition-all"
      >
        Continue to Endpoint Selection <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
