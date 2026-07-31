import { useCallback, useState } from 'react';
import { messagesApi } from '../messagesApi';

type SyncState = 'idle' | 'syncing' | 'done' | 'error';

export function useSyncPhonebook(refreshChats: () => void) {
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  const handleSyncPhonebook = useCallback(
    async (instanceName: string) => {
      if (syncState === 'syncing') return;
      setSyncState('syncing');
      setSyncMessage('');
      const res = await messagesApi.syncPhonebook(instanceName);
      if (res.success && res.data) {
        setSyncState('done');
        setSyncMessage(`Synced ${res.data.synced} contacts (${res.data.removed} removed)`);
        refreshChats();
        setTimeout(() => setSyncState('idle'), 4000);
      } else {
        setSyncState('error');
        setSyncMessage(res.error || 'Sync failed');
        setTimeout(() => setSyncState('idle'), 6000);
      }
    },
    [syncState, refreshChats],
  );

  return { syncState, syncMessage, handleSyncPhonebook };
}
