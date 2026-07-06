import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { CredentialsForm } from './CredentialsForm';

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

  const hasCredentials = !!selectedKeyId || !!pastedKey;

  return (
    <>
      <CredentialsForm
        pastedKey={pastedKey}
        setPastedKey={setPastedKey}
        selectedKeyId={selectedKeyId}
        setSelectedKeyId={setSelectedKeyId}
        instances={instances}
        selectedInstance={selectedInstance}
        setSelectedInstance={setSelectedInstance}
        activeKeys={activeKeys}
        confirmed={confirmed}
        setConfirmed={setConfirmed}
        hasCredentials={hasCredentials}
      />

      <button
        onClick={onNext}
        disabled={!confirmed || !hasCredentials}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#eab308] hover:bg-[#c4940a] disabled:bg-[#2d2813] disabled:text-[#5a554a] text-[#181711] text-xs font-bold rounded-xl transition-all"
      >
        Continue to Endpoint Selection <ArrowRight className="w-4 h-4" />
      </button>
    </>
  );
}
