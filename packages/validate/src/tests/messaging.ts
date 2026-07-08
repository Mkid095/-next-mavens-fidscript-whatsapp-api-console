import type { HttpClient, ApiResponse } from '../client/http.js';
import type { TestCollection, Severity } from '../types.js';

function mkResult(
  name: string,
  res: ApiResponse<unknown>,
  severity: Severity = 'high',
) {
  const isOk = res.error === undefined && (res.status ?? 200) < 400;
  return {
    name,
    status: (isOk ? 'pass' : 'fail') as 'pass' | 'fail',
    severity: isOk ? undefined : severity,
    category: 'messaging',
    latency: res.latency,
    error: res.error,
    detail: res.errorBody !== undefined ? JSON.stringify(res.errorBody) : undefined,
  };
}

export async function messagingTests(
  whatsapp: HttpClient,
  authKey: string,
  instanceName: string,
): Promise<TestCollection> {
  const h = { apikey: authKey };
  const recipient = process.env.TEST_WHATSAPP_NUMBER ?? '+254700000000';

  const [text, image, document] = await Promise.all([
    whatsapp.request({
      method: 'POST',
      path: `/message/sendText/${encodeURIComponent(instanceName)}`,
      headers: h,
      body: { number: recipient, text: 'E2E test message from FIDScript validation suite' },
    }),
    whatsapp.request({
      method: 'POST',
      path: `/message/sendMedia/${encodeURIComponent(instanceName)}`,
      headers: h,
      body: {
        number: recipient,
        mediatype: 'image',
        caption: 'Test image from E2E suite',
        url: 'https://www.w3.org/WAI/WCAG21/Techniques/img/top.png',
      },
    }),
    whatsapp.request({
      method: 'POST',
      path: `/message/sendMedia/${encodeURIComponent(instanceName)}`,
      headers: h,
      body: {
        number: recipient,
        mediatype: 'document',
        fileName: 'test.txt',
        caption: 'Test document',
        url: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf',
      },
    }),
  ]);

  return {
    title: 'Messaging',
    tests: [
      mkResult('send text', text, 'high'),
      mkResult('send image', image, 'high'),
      mkResult('send document', document, 'high'),
    ],
  };
}
