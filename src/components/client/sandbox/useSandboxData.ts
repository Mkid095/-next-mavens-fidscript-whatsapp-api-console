import { useState, useEffect } from 'react';
import { clientKeysApi, contactsApi } from '../../../services/api';
import type { Instance } from '../../../services/api';
import type { SandboxApiKey, SandboxContact } from './types.js';

interface UseSandboxDataOptions {
  clientToken?: string;
  instances: Instance[];
}

/**
 * Loads the data the sandbox needs: API keys, contacts, and picks a default
 * connected instance + first API key.
 */
export function useSandboxData({ clientToken, instances }: UseSandboxDataOptions) {
  const [apiKeys, setApiKeys] = useState<SandboxApiKey[]>([]);
  const [contacts, setContacts] = useState<SandboxContact[]>([]);
  const [instanceName, setInstanceName] = useState('');
  const [selectedKeyId, setSelectedKeyId] = useState('');

  useEffect(() => {
    if (!clientToken) return;
    clientKeysApi.getAll().then(res => {
      if (res.success && res.data) setApiKeys(res.data.filter((k: SandboxApiKey) => k.status === 'Active'));
    });
    contactsApi.getAll().then(res => {
      if (res.success && res.data) setContacts(res.data as SandboxContact[]);
    });
  }, [clientToken]);

  useEffect(() => {
    if (instances.length > 0 && !instanceName) {
      const connected = instances.find(i => i.status === 'connected');
      if (connected) setInstanceName(connected.name);
    }
  }, [instances, instanceName]);

  useEffect(() => {
    if (apiKeys.length > 0 && !selectedKeyId) setSelectedKeyId(apiKeys[0].id);
  }, [apiKeys, selectedKeyId]);

  return { apiKeys, contacts, setContacts, instanceName, setInstanceName, selectedKeyId, setSelectedKeyId };
}
