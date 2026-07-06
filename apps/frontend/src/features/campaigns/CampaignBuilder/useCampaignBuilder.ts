import { useState } from 'react';
import { campaignsApi } from '../../../services/api';
import type { Instance } from '../../../services/api';
import type { CampaignFormType } from './CampaignTypeSelector.js';

export function useCampaignBuilder(defaultInstanceName = '') {
  const [name, setName] = useState('');
  const [instanceName, setInstanceName] = useState(defaultInstanceName);
  const [messageType, setMessageType] = useState<'text' | 'media'>('text');
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const create = async (opts: {
    name: string; instanceName: string; type: CampaignFormType;
    messageType: 'text' | 'media'; content: string; mediaUrl: string;
    resolvedPhones: string[];
  }, andLaunch: boolean) => {
    setError(null);
    setSaving(true);
    try {
      const res = await campaignsApi.create({
        name: opts.name.trim(), instance_name: opts.instanceName,
        message_type: opts.type === 'broadcast' ? opts.messageType : 'text',
        content: opts.type === 'broadcast' ? opts.content || undefined : undefined,
        media_url: opts.type === 'broadcast' ? opts.mediaUrl || undefined : undefined,
        phone_numbers: opts.type === 'broadcast' ? opts.resolvedPhones : [],
      });
      if (!res.success || !res.data) { setError(res.error || 'Failed to create campaign'); return; }
      const id = (res.data as { id: string }).id;
      setCreatedId(id);
      if (andLaunch && opts.type === 'broadcast') await campaignsApi.send(id);
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to create'); }
    finally { setSaving(false); }
  };

  return { name, setName, instanceName, setInstanceName, type, setType, messageType, setMessageType, content, setContent, mediaUrl, setMediaUrl, saving, error, createdId, create };
}
