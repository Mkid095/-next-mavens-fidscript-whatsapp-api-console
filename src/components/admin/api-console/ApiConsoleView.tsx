import React, { useState } from 'react';
import { Play, RefreshCw } from 'lucide-react';
import RequestBuilder from './RequestBuilder';
import ResponseViewer from './ResponseViewer';
import { RouteId, RouteConfig, routes } from './endpointsData';

export type { RouteId, RouteConfig } from './endpointsData';

export default function ApiConsoleView() {
  const [selectedRoute, setSelectedRoute] = useState<RouteId>('sendText');
  const [targetInstance, setTargetInstance] = useState('soostori');
  const [customApiKey, setCustomApiKey] = useState('NM_EVO_LIVE_df3c6...2e6');
  const [destinationPhone, setDestinationPhone] = useState('254732203353');
  const [messageBody, setMessageBody] = useState('Habari! Your Safaricom payment has been confirmed.');
  const [mpesaAmount, setMpesaAmount] = useState('1,500');
  const [mpesaRef, setMpesaRef] = useState('RHF4KT9XM1');
  const [isRunning, setIsRunning] = useState(false);
  const [responseCode, setResponseCode] = useState<number | null>(null);
  const [responseBody, setResponseBody] = useState<string>('');

  const selectedConfig = routes.find(r => r.id === selectedRoute)!;

  const getEndpointPath = () => {
    switch (selectedRoute) {
      case 'sendText': return `/message/sendText/${targetInstance}`;
      case 'connectionState': return `/instance/connectionState/${targetInstance}`;
      case 'mpesaCallback': return `/webhook/mpesa/daraja-callback`;
    }
  };

  const handleRunRequest = () => {
    setIsRunning(true);
    setResponseCode(null);
    setResponseBody('');

    setTimeout(() => {
      setIsRunning(false);
      setResponseCode(200);
      let payloadResult: Record<string, unknown> = {};

      if (selectedRoute === 'sendText') {
        payloadResult = {
          status: "success",
          messageId: `NM_EVO_MSG_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          timestamp: new Date().toISOString(),
          instance: targetInstance,
          payload: { phone: destinationPhone, message: messageBody, device_pacing_ms: 250, status: "PENDING_HANDSHAKE" },
          telemetry: { datacenter: "nairobi-node-01", latency: "14ms" },
        };
      } else if (selectedRoute === 'connectionState') {
        payloadResult = {
          name: targetInstance, status: "connected",
          owner: { phone: "254732203353", pushName: "Soostori Kenya" },
          handshake: { connected_at: new Date().toISOString(), uptime_seconds: 345000, device: "Android 13.0 (Evolution Native)" },
        };
      } else {
        payloadResult = {
          mpesa_service: "C2B_daraja_automated_hook", status: "PROCESSED",
          transaction_ref: mpesaRef, amount: parseFloat(mpesaAmount.replace(/,/g, '')),
          sender_phone: destinationPhone, whatsapp_receipt_dispatch: { status: "SENT", gateway_delay_ms: 18 },
        };
      }
      setResponseBody(JSON.stringify(payloadResult, null, 2));
    }, 700);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-forest-deep">FIDScript REST Sandbox</h1>
        <p className="text-xs text-graphite mt-1">
          Dry-run secure POST / GET requests to check WhatsApp payload parameters and Daraja callback events.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <RequestBuilder
          routes={routes}
          selectedRoute={selectedRoute}
          onSelectRoute={setSelectedRoute}
          targetInstance={targetInstance}
          onInstanceChange={setTargetInstance}
          customApiKey={customApiKey}
          onApiKeyChange={setCustomApiKey}
          destinationPhone={destinationPhone}
          onDestinationPhoneChange={setDestinationPhone}
          messageBody={messageBody}
          onMessageBodyChange={setMessageBody}
          mpesaAmount={mpesaAmount}
          onMpesaAmountChange={setMpesaAmount}
          mpesaRef={mpesaRef}
          onMpesaRefChange={setMpesaRef}
          isRunning={isRunning}
          onRunRequest={handleRunRequest}
        />
        <ResponseViewer
          isRunning={isRunning}
          responseCode={responseCode}
          responseBody={responseBody}
          endpointPath={getEndpointPath()}
        />
      </div>
    </div>
  );
}