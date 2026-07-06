import { useState } from 'react';
import { Bot, Check, AlertCircle } from 'lucide-react';
import { PUBLIC_API_BASE } from '../../../../data/apiEndpoints/index';
import VibeCopyButton from '../VibeCopyButton';

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

interface CredentialsFormProps {
  pastedKey: string;
  setPastedKey: (key: string) => void;
  selectedKeyId: string;
  setSelectedKeyId: (id: string) => void;
  instances: InstanceItem[];
  selectedInstance: string;
  setSelectedInstance: (name: string) => void;
  activeKeys: KeyItem[];
  confirmed: boolean;
  setConfirmed: (v: boolean) => void;
  hasCredentials: boolean;
}

export function CredentialsForm({
  pastedKey,
  setPastedKey,
  selectedKeyId,
  setSelectedKeyId,
  instances,
  selectedInstance,
  setSelectedInstance,
  activeKeys,
  confirmed,
  setConfirmed,
  hasCredentials,
}: CredentialsFormProps) {
  // Auto-detect a matching key when user pastes
  const isValidKey = pastedKey.startsWith('fidscript_live_') || pastedKey.startsWith('fidscript_test_');
  const detectedPrefix = isValidKey ? pastedKey.substring(0, 20) : null;
  const matchedPasteKey = activeKeys.find(k => k.key_prefix && detectedPrefix && k.key_prefix === detectedPrefix);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 p-4 bg-[#1a1915] border border-[#2d2813] rounded-2xl">
        <div className="w-10 h-10 rounded-xl bg-[#2d2813] flex items-center justify-center shrink-0">
          <Bot className="w-5 h-5 text-[#eab308]" />
        </div>
        <div>
          <p className="text-xs font-bold text-[#a8a99e]">Vibe Coding Wizard</p>
          <p className="text-[10px] text-[#6e684a]">Generate an AI-ready integration prompt for your selected endpoints.</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* API Key selection */}
        {activeKeys.length > 0 && (
          <div>
            <label className="block text-[10px] font-bold text-[#a8a99e] uppercase mb-2">Select API Key</label>
            <div className="rounded-xl border border-[#2d2813] bg-[#181711] divide-y divide-[#2d2813]/60 max-h-40 overflow-y-auto">
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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all ${isSelected ? 'bg-[#2d2813] border-l-2 border-l-[#eab308]' : 'hover:bg-[#3d3a1e]'}`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'bg-[#eab308] border-[#eab308]' : 'border-[#5a554a]'}`}>
                      {isSelected && <Check className="w-3 h-3 text-[#181711]" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[11px] text-[#a8a99e] truncate">{k.name}</p>
                      <p className="font-mono text-[10px] text-[#6e684a] truncate">{prefix}••••••••</p>
                    </div>
                    <span className="text-[8px] text-[#5a554a] shrink-0">{k.last_used || 'Never used'}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[9px] text-[#5a554a] mt-1">Select a key above — the full secret is fetched server-side automatically.</p>
          </div>
        )}

        {/* Or paste a key manually */}
        <div>
          <label className="block text-[10px] font-bold text-[#a8a99e] uppercase mb-2">
            Or Paste API Key {activeKeys.length > 0 && <span className="normal-case font-normal text-[#5a554a]">(paste if your key is not listed above)</span>}
          </label>
          <input
            type="text"
            value={pastedKey}
            onChange={e => {
              setPastedKey(e.target.value);
              setSelectedKeyId(''); // clear selection when pasting
            }}
            placeholder="fidscript_live_xxxxxxxxxxxx"
            className="w-full px-3 py-2.5 border border-[#2d2813] bg-[#1a1915] rounded-xl focus:outline-none focus:border-[#eab308] font-mono text-xs text-[#a8a99e] placeholder:text-[#5a554a]"
          />
          {pastedKey && !isValidKey && (
            <p className="text-[9px] text-red-400 mt-1">Key must start with fidscript_live_ or fidscript_test_</p>
          )}
          {matchedPasteKey && (
            <p className="text-[9px] text-green-400 mt-1 flex items-center gap-1">
              <Check className="w-3 h-3" /> Matches &quot;{matchedPasteKey.name}&quot; — no need to paste, just select it above
            </p>
          )}
          {isValidKey && !matchedPasteKey && (
            <p className="text-[9px] text-green-400 mt-1 flex items-center gap-1">
              <Check className="w-3 h-3" /> Valid key format
            </p>
          )}
        </div>

        {/* Container / instance selector */}
        <div>
          <label className="block text-[10px] font-bold text-[#a8a99e] uppercase mb-2">
            WhatsApp Container <span className="normal-case font-normal text-[#5a554a]">(optional)</span>
          </label>
          <select
            value={selectedInstance}
            onChange={e => setSelectedInstance(e.target.value)}
            className="w-full px-3 py-2.5 border border-[#2d2813] bg-[#1a1915] rounded-xl focus:outline-none focus:border-[#eab308] text-xs text-[#a8a99e]"
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
          <code className="flex-1 text-[11px] font-mono bg-[#1a1915] border border-[#2d2813] px-3 py-2 rounded-lg text-[#a8a99e]">{PUBLIC_API_BASE}</code>
          <VibeCopyButton text={PUBLIC_API_BASE} label="Copy" />
        </div>

        {/* Info notice */}
        <div className="p-3 bg-[#1a1915] border border-[#2d2813] rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-[#eab308] mt-0.5 shrink-0" />
          <p className="text-[10px] text-[#a8a99e] leading-relaxed">
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
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${confirmed ? 'bg-[#eab308] border-[#eab308]' : 'border-[#5a554a]'}`}
          >
            {confirmed && <Check className="w-3 h-3 text-[#181711]" />}
          </button>
          <span className="text-[11px] text-[#a8a99e]">I understand credentials will be embedded in the generated prompt</span>
        </label>
      </div>
    </div>
  );
}
