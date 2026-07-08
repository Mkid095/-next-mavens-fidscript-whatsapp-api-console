import type { HttpClient } from '../client/http.js';
import type { TestCollection } from '../types.js';

interface WhatsAppContext {
  instanceName?: string;
}

export async function whatsAppTests(
  whatsapp: HttpClient,
  authKey: string,
  ctx: WhatsAppContext,
): Promise<TestCollection> {
  const headers = { apikey: authKey };
  const results = [];

  // --- Instance creation ---
  const instanceName = `e2e-${Date.now()}`;
  ctx.instanceName = instanceName;

  try {
    const start = Date.now();
    const res = await whatsapp.request({
      method: 'POST',
      path: `/instance/create?instanceName=${encodeURIComponent(instanceName)}`,
      headers,
    });
    const ok = !String(res.data).includes('error');
    results.push({
      name: 'instance create',
      status: ok ? ('pass' as const) : ('fail' as const),
      latency: res.latency,
      data: String(res.data).slice(0, 80),
    });
  } catch (err) {
    results.push({ name: 'instance create', status: 'fail' as const, error: String(err), latency: 0 });
  }

  // --- Connect (initiate pairing) ---
  if (ctx.instanceName) {
    try {
      const start = Date.now();
      const res = await whatsapp.request({
        method: 'POST',
        path: `/instance/connect/${encodeURIComponent(ctx.instanceName)}`,
        headers,
      });
      results.push({
        name: 'instance connect (pairing)',
        status: res.latency > 0 ? ('pass' as const) : ('fail' as const),
        latency: res.latency,
        data: String(res.data).slice(0, 80),
      });
    } catch (err) {
      results.push({ name: 'instance connect (pairing)', status: 'fail' as const, error: String(err), latency: 0 });
    }
  } else {
    results.push({ name: 'instance connect (pairing)', status: 'skip' as const });
  }

  // --- Connection state ---
  if (ctx.instanceName) {
    try {
      const start = Date.now();
      const res = await whatsapp.request({
        method: 'GET',
        path: `/instance/connectionState/${encodeURIComponent(ctx.instanceName)}`,
        headers,
      });
      results.push({
        name: 'connection state',
        status: res.latency > 0 ? ('pass' as const) : ('fail' as const),
        latency: res.latency,
        data: String(res.data).slice(0, 80),
      });
    } catch (err) {
      results.push({ name: 'connection state', status: 'fail' as const, error: String(err), latency: 0 });
    }
  }

  // --- QR Code generation ---
  if (ctx.instanceName) {
    try {
      const start = Date.now();
      const res = await whatsapp.request({
        method: 'GET',
        path: `/instance/qrcode/${encodeURIComponent(ctx.instanceName)}`,
        headers,
      });
      // QR endpoint returns base64 image or QR data
      const dataStr = String(res.data);
      const hasQR = dataStr.includes('base64') || dataStr.includes('qr') || dataStr.includes('code');
      results.push({
        name: 'qr code generation',
        status: hasQR ? ('pass' as const) : ('fail' as const),
        latency: res.latency,
        data: dataStr.slice(0, 80),
      });
    } catch (err) {
      results.push({ name: 'qr code generation', status: 'fail' as const, error: String(err), latency: 0 });
    }
  }

  // --- Logout ---
  if (ctx.instanceName) {
    try {
      const start = Date.now();
      const res = await whatsapp.request({
        method: 'DELETE',
        path: `/instance/logout/${encodeURIComponent(ctx.instanceName)}`,
        headers,
      });
      results.push({
        name: 'instance logout',
        status: res.latency > 0 ? ('pass' as const) : ('fail' as const),
        latency: res.latency,
      });
    } catch (err) {
      results.push({ name: 'instance logout', status: 'fail' as const, error: String(err), latency: 0 });
    }
  }

  // --- Delete instance ---
  if (ctx.instanceName) {
    const savedName = ctx.instanceName;
    try {
      const start = Date.now();
      const res = await whatsapp.request({
        method: 'DELETE',
        path: `/instance/delete/${encodeURIComponent(savedName)}`,
        headers,
      });
      results.push({
        name: 'instance delete',
        status: res.latency > 0 ? ('pass' as const) : ('fail' as const),
        latency: res.latency,
      });
      ctx.instanceName = undefined; // clear after use
    } catch (err) {
      results.push({ name: 'instance delete', status: 'fail' as const, error: String(err), latency: 0 });
    }
  }

  return { title: 'WhatsApp', tests: results };
}
