import ApiKeyList from './ApiKeyList';
import KeysTabHeader from './KeysTabHeader';
import type { ClientApiKey } from '../../../services/api';

interface KeyWithStats extends ClientApiKey {
  request_count?: number;
}

interface KeysTabPanelProps {
  apiKeys: KeyWithStats[];
  showKeyValue: Set<string>;
  copiedKeyId: string | null;
  testingKeyId: string | null;
  testResult: { id: string; ok: boolean; msg: string } | null;
  onCreateKey: () => void;
  onCopyKey: (id: string, val: string) => void;
  onToggleShowKey: (id: string) => void;
  onTestKey: (k: KeyWithStats) => void;
  onRevokeKey: (id: string, name: string) => void;
  onOpenRegenerateModal: (k: KeyWithStats) => void;
  copyToClipboard: (text: string) => void;
}

export default function KeysTabPanel(props: KeysTabPanelProps) {
  return (
    <div className="p-4 sm:p-6 space-y-4">
      <KeysTabHeader onCreateKey={props.onCreateKey} copyToClipboard={props.copyToClipboard} />
      <ApiKeyList {...props} />
    </div>
  );
}
