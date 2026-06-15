import { useState } from 'react';
import { Bot, Check, ArrowRight, AlertCircle } from 'lucide-react';
import { PUBLIC_API_BASE } from '../../../data/apiEndpoints/index';
import VibeCopyButton from './VibeCopyButton.js';

interface VibeWizardProps {
  instances: Array<{ id: string; name: string; display_name?: string; phone_number?: string; status: string }>;
  activeKeys: Array<{ id: string; name: string; key_prefix?: string; last_used: string | null }>;
}

interface Step1CredentialsProps {
  pastedKey: string;
  setPastedKey: (key: string) => void;
  instances: VibeWizardProps['instances'];
  selectedInstance: string;
  setSelectedInstance: (name: string) => void;
  activeKeys: VibeWizardProps['activeKeys'];
  onNext: () => void;
}

export default function Step1Credentials({ pastedKey, setPastedKey, instances, selectedInstance, setSelectedInstance, activeKeys, onNext }: Step1CredentialsProps) {
  const [confirmed, setConfirmed] = useState(false);

  const isValidKey = pastedKey.startsWith('fidscript_live_') || pastedKey.startsWith('fidscript_test_');
  const detectedPrefix = isValidKey ? pastedKey.substring(0, 20) : null;
  const matchedKey = activeKeys.find(k => k.key_prefix && detectedPrefix && k.key_prefix === detectedPrefix);

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
        {/* API Key paste input */}
        <div>
          <label className="block text-[10px] font-bold text-graphite uppercase mb-2">Paste Your API Key</label>
          <input
            type="text"
            value={pastedKey}
            onChange={e => setPastedKey(e.target.value)}
            placeholder="fidscript_live_xxxxxxxxxxxx"
            className="w-full px-3 py-2.5 border border-[#eaebe4] bg-white rounded-xl focus:outline-none focus:border-yellow-500 font-mono text-xs text-forest-deep placeholder:text-stone-400"
          />
          {pastedKey && !isValidKey && (
            <p className="text-[9px] text-red-500 mt-1">Key must start with fidscript_live_ or fidscript_test_</p>
          )}
          {matchedKey && (
            <p className="text-[9px] text-green-600 mt-1 flex items-center gap-1">
              <Check className="w-3 h-3" /> Matches &ldquo;{matchedKey.name}&rdquo;
            </p>
          )}
          {isValidKey && !matchedKey && (
            <p className="text-[9px] text-green-600 mt-1 flex items-center gap-1">
              <Check className="w-3 h-3" /> Valid key format
            </p>
          )}
          {!pastedKey && (
            <p className="text-[9px] text-stone-400 mt-1">
              No key stored — paste the one you saved when it was created.
            </p>
          )}
        </div>

        {activeKeys.length > 0 && (
          <div>
            <label className="block text-[10px] font-bold text-graphite uppercase mb-2">Your Active Keys</label>
            <div className="rounded-xl border border-[#eaebe4] bg-stone-50 divide-y divide-[#eaebe4]/60 max-h-32 overflow-y-auto">
              {activeKeys.map(k => {
                const isMatch = matchedKey?.id === k.id;
                return (
                  <div key={k.id} className={`flex items-center justify-between gap-2 px-3 py-2 text-[10px] ${isMatch ? 'bg-green-50/60' : ''}`}>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-forest-deep truncate">{k.name}</p>
                      <p className="font-mono text-stone-500 truncate">{k.key_prefix || 'fidscript_live_'}••••••••</p>
                    </div>
                    <span className="text-[8px] text-stone-400 shrink-0">{k.last_used || 'Never used'}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-[9px] text-stone-400 mt-1">Keys are not retrievable from the server — paste the secret you saved at creation. The matching key is highlighted as you type.</p>
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold text-graphite uppercase mb-2">Container <span className="normal-case font-normal text-stone-400">(optional)</span></label>
          <select
            value={selectedInstance}
            onChange={e => setSelectedInstance(e.target.value)}
            className="w-full px-3 py-2.5 border border-[#eaebe4] bg-white rounded-xl focus:outline-none focus:border-yellow-500 font-mono text-xs text-forest-deep"
          >
            <option value="">— Leave unset —</option>
            {instances.map(i => (
              <option key={i.id} value={i.name}>
                {(i.display_name || i.name)} {i.phone_number ? `· ${i.phone_number}` : ''} [{i.status}]
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <code className="flex-1 text-[11px] font-mono bg-stone-50 border border-[#eaebe4] px-3 py-2 rounded-lg text-stone-700">{PUBLIC_API_BASE}</code>
          <VibeCopyButton text={PUBLIC_API_BASE} label="Copy" />
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
          <p className="text-[10px] text-amber-900 leading-relaxed">
            Paste the API key you saved when it was created. Keys are only shown once. The key and container name will be embedded in the generated prompt.
          </p>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <button onClick={() => setConfirmed(v => !v)}
            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${confirmed ? 'bg-forest-deep border-forest-deep' : 'border-stone-300'}`}>
            {confirmed && <Check className="w-3 h-3 text-white" />}
          </button>
          <span className="text-[11px] text-graphite">I understand credentials will be embedded in the generated prompt</span>
        </label>
      </div>

      <button onClick={onNext} disabled={!confirmed}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-forest-deep hover:bg-[#33301a] disabled:bg-stone-300 text-white text-xs font-bold rounded-xl transition-all">
        Continue to Endpoint Selection <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
