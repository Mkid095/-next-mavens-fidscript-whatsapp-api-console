import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';
import { API_ENDPOINTS } from '../../data/apiEndpoints/index';
import Step1Credentials from './vibe/Step1Credentials';
import Step2Select, { type Step2State } from './vibe/Step2Select';
import Step3Prompt from './vibe/Step3Prompt';

interface VibeWizardProps {
  clientName?: string;
  clientToken: string;
  instances: Array<{ id: string; name: string; display_name?: string | null; phone_number?: string | null; status: string }>;
  activeKeys: Array<{ id: string; name: string; key_prefix?: string; last_used: string | null }>;
}

type WizardStep = 1 | 2 | 3;

const STEP_LABELS = ['Verify Credentials', 'Select Endpoints', 'AI Integration Prompt'];

/**
 * Phase 3 Vibe Coding Wizard — 3-step AI prompt generator.
 * Step 1 collects credentials (api key paste + optional container).
 * Step 2 picks endpoints from the live registry.
 * Step 3 generates a complete integration-prompt markdown for the user's
 * preferred language. The heavy lifting lives in the vibe/ sub-folder.
 */
export default function VibeWizard({ clientName, clientToken, instances, activeKeys }: VibeWizardProps) {
  const [step, setStep] = useState<WizardStep>(1);
  const [pastedKey, setPastedKey] = useState<string>('');
  const [selectedKeyId, setSelectedKeyId] = useState<string>('');
  const [selectedInstance, setSelectedInstance] = useState<string>('');
  const [step2State, setStep2State] = useState<Step2State>({
    global: 'all',
    categories: {},
    selectedEndpoints: new Set(API_ENDPOINTS.filter(e => e.path.startsWith('/api/v1')).map(e => e.id)),
  });

  const selectedEps = useMemo(
    () => API_ENDPOINTS.filter(e => step2State.selectedEndpoints.has(e.id)),
    [step2State.selectedEndpoints]
  );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-0 flex-wrap">
        {([1, 2, 3] as WizardStep[]).map((s, i) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-colors ${
              step === s
                ? 'bg-[#eab308] text-[#181711]'
                : s < step
                  ? 'bg-green-900/40 text-green-400 border border-green-900/50'
                  : 'bg-[#2d2813] text-[#6e684a]'
            }`}>
              <span className="w-4 h-4 rounded-full bg-current flex items-center justify-center text-[8px] shrink-0">{s < step ? <Check size={8} /> : s}</span>
              <span className="hidden sm:inline">{STEP_LABELS[i]}</span>
            </div>
            {i < 2 && <div className={`flex-1 h-0.5 mx-1 min-w-4 rounded ${s < step ? 'bg-green-600' : 'bg-[#2d2813]'}`} />}
          </React.Fragment>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <Step1Credentials
              pastedKey={pastedKey}
              setPastedKey={setPastedKey}
              selectedKeyId={selectedKeyId}
              setSelectedKeyId={setSelectedKeyId}
              instances={instances}
              selectedInstance={selectedInstance}
              setSelectedInstance={setSelectedInstance}
              activeKeys={activeKeys}
              onNext={() => setStep(2)}
            />
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <Step2Select state={step2State} setState={setStep2State} onBack={() => setStep(1)} onNext={() => setStep(3)} />
          </motion.div>
        )}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
            <Step3Prompt
              apiKey={pastedKey}
              keyId={selectedKeyId}
              clientToken={clientToken}
              clientName={clientName}
              selectedEps={selectedEps}
              instanceName={selectedInstance}
              onBack={() => setStep(2)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
