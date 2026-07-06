import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { type ApiEndpoint } from '../../../data/apiEndpoints/index';
import { PromptEditor } from './PromptEditor';

interface Step3PromptProps {
  apiKey: string;         // pasted full key (if user pasted instead of selected)
  keyId: string;          // selected key ID (fetched server-side)
  clientToken: string;    // JWT for authenticated fetch
  clientName?: string;
  selectedEps: ApiEndpoint[];
  instanceName?: string;
  onBack: () => void;
}

async function fetchFullKey(keyId: string, token: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/sandbox/key/${keyId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    return data.success ? data.api_key : null;
  } catch {
    return null;
  }
}

export default function Step3Prompt({
  apiKey: pastedKey,
  keyId,
  clientToken,
  clientName,
  selectedEps,
  instanceName,
  onBack,
}: Step3PromptProps) {
  const [fullKey, setFullKey] = useState<string | null>(null);
  const [fetchingKey, setFetchingKey] = useState(false);

  // Fetch the full key server-side if keyId is provided instead of a pasted key
  useEffect(() => {
    if (keyId && clientToken) {
      setFetchingKey(true);
      fetchFullKey(keyId, clientToken).then(k => {
        setFullKey(k);
        setFetchingKey(false);
      });
    }
  }, [keyId, clientToken]);

  // Use pasted key if no keyId was selected, otherwise use the fetched full key
  const resolvedKey = keyId ? (fullKey || '') : pastedKey;

  return (
    <div className="space-y-5">
      <PromptEditor
        resolvedKey={resolvedKey}
        clientName={clientName}
        selectedEps={selectedEps}
        instanceName={instanceName}
        fullKey={fullKey}
        fetchingKey={fetchingKey}
        keyId={keyId}
        clientToken={clientToken}
      />

      <button
        onClick={onBack}
        className="px-4 py-2.5 border border-[#2d2813] rounded-xl text-xs font-bold text-[#a8a99e] hover:bg-[#3d3a1e] transition-colors inline-flex items-center gap-1">
        <ArrowLeft size={12} /> Edit Selection
      </button>
    </div>
  );
}
