import { useCallback, useState } from 'react';
import { contactsApi } from '../../../services/api';
import type { EndpointDef, SandboxContact, SandboxContactItem } from './types.js';
import {
  buildCurl, buildExecBody, executeRequest, mediaTypeFor, pickAndUpload,
} from './sandboxActions.js';

interface UseSandboxActionsOptions {
  clientToken?: string;
  onTokenDeduct: (n: number) => void;
  onContactsAdded: (next: SandboxContact[]) => void;
}

interface UseSandboxActionsReturn {
  bodyValues: Record<string, string>;
  setBodyValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  pollOptions: string[];
  setPollOptions: React.Dispatch<React.SetStateAction<string[]>>;
  contactItems: SandboxContactItem[];
  setContactItems: React.Dispatch<React.SetStateAction<SandboxContactItem[]>>;
  response: string | null;
  responseStatus: number | null;
  loading: boolean;
  uploadingMedia: boolean;
  copied: boolean;
  selectEndpoint: (ep: EndpointDef) => void;
  copyCurl: (endpoint: EndpointDef, instanceName: string) => void;
  uploadMedia: (fieldKey: string) => Promise<void>;
  execute: (params: { endpoint: EndpointDef; instanceName: string; selectedKeyId: string }) => Promise<void>;
  addContact: (name: string, phone: string) => Promise<void>;
  closeResponse: () => void;
}

/**
 * Owns the form state and the side-effect handlers for the sandbox.
 * The caller owns the contact list (loaded via useSandboxData) and is notified
 * via onContactsAdded when a new one is created.
 */
export function useSandboxActions({ clientToken, onTokenDeduct, onContactsAdded }: UseSandboxActionsOptions): UseSandboxActionsReturn {
  const [bodyValues, setBodyValues] = useState<Record<string, string>>({});
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [contactItems, setContactItems] = useState<SandboxContactItem[]>([]);
  const [response, setResponse] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [copied, setCopied] = useState(false);

  const selectEndpoint = useCallback((_ep: EndpointDef) => {
    setBodyValues({});
    setResponse(null);
    setResponseStatus(null);
    setPollOptions(['', '']);
    setContactItems([]);
  }, []);

  const copyCurl = useCallback((endpoint: EndpointDef, instanceName: string) => {
    navigator.clipboard.writeText(buildCurl(endpoint, instanceName, bodyValues));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [bodyValues]);

  const uploadMedia = useCallback(async (fieldKey: string) => {
    if (!clientToken) return;
    setUploadingMedia(true);
    try {
      const result = await pickAndUpload(clientToken);
      if (result) {
        const next: Record<string, string> = { [fieldKey]: result.url };
        const mt = mediaTypeFor(result.file.type);
        if (mt) next.media_type = mt;
        setBodyValues(prev => ({ ...prev, ...next }));
      }
    } finally {
      setUploadingMedia(false);
    }
  }, [clientToken]);

  const execute = useCallback(async (params: { endpoint: EndpointDef; instanceName: string; selectedKeyId: string }) => {
    if (!params.endpoint || !params.instanceName || !clientToken || !params.selectedKeyId) return;
    setLoading(true);
    setResponse(null);
    setResponseStatus(null);
    const reqBody = buildExecBody({
      endpoint: params.endpoint, instanceName: params.instanceName,
      selectedKeyId: params.selectedKeyId, bodyValues, pollOptions, contactItems,
    });
    const result = await executeRequest(reqBody, clientToken);
    setResponseStatus(result.status);
    setResponse(result.error ? JSON.stringify({ error: result.error }, null, 2) : JSON.stringify(result.data, null, 2));
    if (params.endpoint.cost && params.endpoint.cost > 0) onTokenDeduct(params.endpoint.cost);
    setLoading(false);
  }, [bodyValues, contactItems, pollOptions, clientToken, onTokenDeduct]);

  const addContact = useCallback(async (name: string, phone: string) => {
    if (!name.trim() || !phone.trim() || !clientToken) return;
    const res = await contactsApi.batchImport([{ name: name.trim(), phone: phone.trim() }]);
    if (res.success && res.data) {
      onContactsAdded([{ id: String(Date.now()), name: name.trim(), phone: phone.trim() }]);
    }
  }, [clientToken, onContactsAdded]);

  const closeResponse = useCallback(() => {
    setResponse(null);
    setResponseStatus(null);
  }, []);

  return {
    bodyValues, setBodyValues,
    pollOptions, setPollOptions,
    contactItems, setContactItems,
    response, responseStatus, loading,
    uploadingMedia, copied,
    selectEndpoint, copyCurl, uploadMedia, execute, addContact, closeResponse,
  };
}
