import React, { useState } from 'react';
import { Play, RefreshCw } from 'lucide-react';
import RequestBuilder from './RequestBuilder';
import ResponseViewer from './ResponseViewer';
import { RouteId, RouteConfig, routes } from './endpointsData';

export type { RouteId, RouteConfig } from './endpointsData';

// Evolution API base — admin console talks directly to the gateway
const EVO_BASE = 'http://localhost:8080';
const EVO_API_KEY = '94977bc1fcb107c79d0687caea800bdb74edd67b5022771fc85c22ee389ca7e8';

export default function ApiConsoleView() {
  const [selectedRoute, setSelectedRoute] = useState<RouteId>('sendText');
  const [targetInstance, setTargetInstance] = useState('soostori');
  const [customApiKey, setCustomApiKey] = useState(EVO_API_KEY);
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

  const handleRunRequest = async () => {
    setIsRunning(true);
    setResponseCode(null);
    setResponseBody('');

    const apiKey = customApiKey || EVO_API_KEY;
    const path = getEndpointPath();
    const url = `${EVO_BASE}${path}`;

    let body: string | undefined;
    let method = selectedConfig.method;

    if (selectedRoute === 'sendText') {
      body = JSON.stringify({ number: destinationPhone, text: messageBody });
    } else if (selectedRoute === 'mpesaCallback') {
      body = JSON.stringify({
        Body: {
          stkCallback: {
            MerchantRequestID: `test_${Date.now()}`,
            CheckoutRequestID: mpesaRef,
            ResultCode: 0,
            ResultDesc: 'The service request is processed successfully.',
            CallbackMetadata: {
              Item: [
                { Name: 'Amount', Value: parseFloat(mpesaAmount.replace(/,/g, '')) },
                { Name: 'MpesaReceiptNumber', Value: `TEST${mpesaRef}` },
                { Name: 'PhoneNumber', Value: destinationPhone },
              ],
            },
          },
        },
      });
    }

    try {
      const opts: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
        },
      };
      if (body) opts.body = body;

      const res = await fetch(url, opts);
      setResponseCode(res.status);
      const text = await res.text();
      // Try to pretty-print JSON
      try { setResponseBody(JSON.stringify(JSON.parse(text), null, 2)); }
      catch { setResponseBody(text); }
    } catch (err) {
      setResponseCode(0);
      setResponseBody(`Connection error: ${err instanceof Error ? err.message : String(err)}\n\nIs the Evolution API gateway running on localhost:8080?`);
    }

    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-forest-deep">FIDScript REST Sandbox</h1>
        <p className="text-xs text-graphite mt-1">
          Dry-run secure POST / GET requests against the Evolution API gateway to test WhatsApp payload parameters and Daraja callback events.
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