import type { HttpClient, ApiResponse } from '../client/http.js';
import type { TestCollection, Severity } from '../types.js';

interface WhatsAppContext {
  instanceName?: string;
}

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
    category: 'whatsapp',
    latency: res.latency,
    error: res.error,
    detail: res.errorBody !== undefined ? JSON.stringify(res.errorBody) : undefined,
  };
}

export async function whatsAppTests(
  whatsapp: HttpClient,
  authKey: string,
  ctx: WhatsAppContext,
): Promise<TestCollection> {
  const h = { apikey: authKey };
  const name = `e2e-${Date.now()}`;
  ctx.instanceName = name;

  const [
    create,
    connect,
    state,
    qrResult,
    logout,
    del,
  ] = await Promise.all([
    whatsapp.request({ method: 'POST', path: `/instance/create?instanceName=${encodeURIComponent(name)}`, headers: h }),
    whatsapp.request({ method: 'POST', path: `/instance/connect/${encodeURIComponent(name)}`, headers: h }),
    whatsapp.request({ method: 'GET', path: `/instance/connectionState/${encodeURIComponent(name)}`, headers: h }),
    whatsapp.request({ method: 'GET', path: `/instance/qrcode/${encodeURIComponent(name)}`, headers: h }),
    whatsapp.request({ method: 'DELETE', path: `/instance/logout/${encodeURIComponent(name)}`, headers: h }),
    whatsapp.request({ method: 'DELETE', path: `/instance/delete/${encodeURIComponent(name)}`, headers: h }),
  ]);

  ctx.instanceName = undefined;

  const tests = [
    mkResult('instance create', create, 'critical'),
    mkResult('instance connect (pairing)', connect),
    mkResult('connection state', state),
    (() => {
      const dataStr = String(qrResult.data ?? '');
      const hasQR = dataStr.includes('base64') || dataStr.includes('qrcode') || dataStr.includes('code');
      const isOk = hasQR && qrResult.error === undefined;
      return {
        name: 'qr code generation',
        status: (isOk ? 'pass' : 'fail') as 'pass' | 'fail',
        severity: isOk ? undefined : 'high' as Severity,
        category: 'whatsapp',
        latency: qrResult.latency,
        error: qrResult.error,
        detail: qrResult.errorBody !== undefined ? JSON.stringify(qrResult.errorBody) : undefined,
      };
    })(),
    mkResult('instance logout', logout),
    mkResult('instance delete', del, 'high'),
  ];

  return { title: 'WhatsApp', tests };
}
