import type { HttpClient } from '../client/http.js';
import type { TestCollection } from '../types.js';

export async function messagingTests(
  whatsapp: HttpClient,
  authKey: string,
  instanceName: string,
): Promise<TestCollection> {
  const headers = { apikey: authKey };
  const recipient = process.env.TEST_WHATSAPP_NUMBER ?? '+254700000000';

  const results = [];

  // --- Send text message ---
  try {
    const start = Date.now();
    const res = await whatsapp.request({
      method: 'POST',
      path: `/message/sendText/${encodeURIComponent(instanceName)}`,
      headers,
      body: {
        number: recipient,
        text: 'E2E test message from FIDScript validation suite',
      },
    });
    results.push({
      name: 'send text',
      status: res.latency > 0 ? ('pass' as const) : ('fail' as const),
      latency: res.latency,
      data: String(res.data).slice(0, 80),
    });
  } catch (err) {
    results.push({ name: 'send text', status: 'fail' as const, error: String(err), latency: 0 });
  }

  // --- Send image ---
  try {
    const start = Date.now();
    const res = await whatsapp.request({
      method: 'POST',
      path: `/message/sendMedia/${encodeURIComponent(instanceName)}`,
      headers,
      body: {
        number: recipient,
        mediatype: 'image',
        caption: 'Test image from E2E suite',
        // Use a public placeholder image
        url: 'https://www.w3.org/WAI/WCAG21/Techniques/img/top.png',
      },
    });
    results.push({
      name: 'send image',
      status: res.latency > 0 ? ('pass' as const) : ('fail' as const),
      latency: res.latency,
      data: String(res.data).slice(0, 80),
    });
  } catch (err) {
    results.push({ name: 'send image', status: 'fail' as const, error: String(err), latency: 0 });
  }

  // --- Send document ---
  try {
    const start = Date.now();
    const res = await whatsapp.request({
      method: 'POST',
      path: `/message/sendMedia/${encodeURIComponent(instanceName)}`,
      headers,
      body: {
        number: recipient,
        mediatype: 'document',
        fileName: 'test.txt',
        caption: 'Test document',
        url: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf',
      },
    });
    results.push({
      name: 'send document',
      status: res.latency > 0 ? ('pass' as const) : ('fail' as const),
      latency: res.latency,
      data: String(res.data).slice(0, 80),
    });
  } catch (err) {
    results.push({ name: 'send document', status: 'fail' as const, error: String(err), latency: 0 });
  }

  return { title: 'Messaging', tests: results };
}
