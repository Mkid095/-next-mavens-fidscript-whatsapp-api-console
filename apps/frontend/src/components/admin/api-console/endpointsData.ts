export type RouteId = 'sendText' | 'connectionState' | 'mpesaCallback';

export interface RouteConfig {
  id: RouteId;
  label: string;
  desc: string;
  method: 'POST' | 'GET';
}

export const routes: RouteConfig[] = [
  { id: 'sendText', label: 'POST /message/sendText', desc: 'Dispatch active text message', method: 'POST' },
  { id: 'connectionState', label: 'GET /instance/connectionState', desc: 'Fetch container details', method: 'GET' },
  { id: 'mpesaCallback', label: 'POST /webhook/mpesa-callback', desc: 'Mock automated M-Pesa receipt', method: 'POST' },
];
