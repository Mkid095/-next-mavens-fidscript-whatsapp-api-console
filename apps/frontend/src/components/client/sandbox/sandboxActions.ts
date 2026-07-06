import { PUBLIC_API_BASE } from '../../../data/apiEndpoints/index';
import type { EndpointDef } from './types.js';

/** Builds a cURL command string for the given endpoint and body values. */
export function buildCurl(endpoint: EndpointDef | null, instanceName: string, bodyValues: Record<string, string>): string {
  if (!endpoint || !instanceName) return '';
  const base = PUBLIC_API_BASE;
  const path = endpoint.path.replace(':instanceName', instanceName);
  const method = endpoint.method;
  const lines = [`curl -X ${method} ${base}${path}`];
  lines.push(`  -H "X-API-Key: <your-key>"`);
  lines.push(`  -H "Content-Type: application/json"`);
  if (endpoint.bodyFields && endpoint.bodyFields.length > 0) {
    const body: Record<string, unknown> = {};
    endpoint.bodyFields.forEach(f => {
      if (bodyValues[f.key] !== undefined && bodyValues[f.key] !== '') {
        body[f.key] = f.type === 'number' ? Number(bodyValues[f.key]) : bodyValues[f.key];
      }
    });
    if (Object.keys(body).length > 0) lines.push(`  -d '${JSON.stringify(body)}'`);
  }
  return lines.join(' \\\n');
}

/** Maps a file MIME type to the v1 media_type enum. */
export function mediaTypeFor(mime: string): string | null {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime === 'application/pdf') return 'document';
  return null;
}

/** Reads a Blob (e.g. File or recorded media) as a base64 data-URL. */
export function readAsDataURL(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/** Uploads a base64 data-URL to the server and returns the resulting hosted URL. */
export async function uploadBase64(base64: string, clientToken: string): Promise<UploadResult> {
  const res = await fetch('/api/uploads/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${clientToken}` },
    body: JSON.stringify({ image: base64 }),
  });
  const data = await res.json();
  if (data.success && data.data?.url) return { success: true, url: data.data.url };
  return { success: false, error: data.error || 'Upload failed' };
}

/** Prompts the user to pick a file, uploads it, and returns the URL. */
export function pickAndUpload(clientToken: string): Promise<{ file: File; url: string } | null> {
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/*,audio/*,application/pdf';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) { resolve(null); return; }
      try {
        const base64 = await readAsDataURL(file);
        const result = await uploadBase64(base64, clientToken);
        if (result.success && result.url) resolve({ file, url: result.url });
        else { alert(result.error || 'Upload failed'); resolve(null); }
      } catch (err) {
        alert(String(err));
        resolve(null);
      }
    };
    input.click();
  });
}

/** Builds the /api/sandbox/exec request body from the current form state. */
export function buildExecBody(params: {
  endpoint: EndpointDef;
  instanceName: string;
  selectedKeyId: string;
  bodyValues: Record<string, string>;
  pollOptions: string[];
  contactItems: Array<{ fullName: string; phoneNumber: string; wuid?: string; organization?: string }>;
}): Record<string, unknown> {
  const { endpoint, instanceName, selectedKeyId, bodyValues, pollOptions, contactItems } = params;
  const reqBody: Record<string, unknown> = {
    method: endpoint.method,
    endpoint: endpoint.path,
    instanceName,
    keyId: selectedKeyId,
  };
  if (endpoint.path.includes('/poll/')) {
    reqBody.options = pollOptions.filter(o => o.trim());
  }
  if (endpoint.path.includes('/contact/') && contactItems.length > 0) {
    reqBody.contact = contactItems;
  }
  if (endpoint.bodyFields) {
    endpoint.bodyFields.forEach(f => {
      if (['options', 'list', 'contact'].includes(f.key)) return;
      if (bodyValues[f.key] !== undefined && bodyValues[f.key] !== '') {
        reqBody[f.key] = f.type === 'number' ? Number(bodyValues[f.key]) : bodyValues[f.key];
      }
    });
  }
  return reqBody;
}

export interface ExecResult {
  status: number;
  data: unknown;
  error?: string;
}

/** Sends the request to /api/sandbox/exec and returns the parsed result. */
export async function executeRequest(reqBody: Record<string, unknown>, clientToken: string): Promise<ExecResult> {
  try {
    const res = await fetch('/api/sandbox/exec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${clientToken}` },
      body: JSON.stringify(reqBody),
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  } catch (err) {
    return { status: 500, data: {}, error: String(err) };
  }
}
