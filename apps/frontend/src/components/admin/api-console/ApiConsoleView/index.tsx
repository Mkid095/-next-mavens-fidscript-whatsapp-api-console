import { useState, useEffect, useCallback } from 'react';
import { API_CATEGORIES, API_ENDPOINTS, type ApiEndpoint } from '../../../../data/apiEndpoints/index';
import { fetchApi } from '../../../../data/api/client';
import type { Instance } from '../../../../services/types';
import { CategorySidebar } from './CategorySidebar';
import { EndpointList } from './EndpointList';
import { RequestPanel } from './RequestPanel';

function buildBody(endpoint: ApiEndpoint, values: Record<string, string>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  for (const field of endpoint.bodyFields) {
    if (field.type === 'boolean') {
      body[field.key] = values[field.key] === 'true';
    } else if (field.type === 'number') {
      body[field.key] = values[field.key] ? parseFloat(values[field.key]) : undefined;
    } else if (values[field.key] !== '' && values[field.key] !== undefined) {
      body[field.key] = values[field.key];
    }
  }
  return body;
}

export default function ApiConsoleView() {
  const [activeCategory, setActiveCategory] = useState('Messaging');
  const [selectedId, setSelectedId] = useState<string>('');
  const [instanceName, setInstanceName] = useState<string>('');
  const [instances, setInstances] = useState<{ name: string }[]>([]);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [responseCode, setResponseCode] = useState<number | null>(null);
  const [responseBody, setResponseBody] = useState<string>('');
  const [adminToken, setAdminToken] = useState<string>('');

  const allEndpoints = API_ENDPOINTS;
  const filteredEndpoints = allEndpoints.filter((e) => e.category === activeCategory);
  const selectedEndpoint = allEndpoints.find((e) => e.id === selectedId);

  useEffect(() => {
    const token = localStorage.getItem('fidscript_admin_token') || '';
    setAdminToken(token);
    fetchApi<Instance[]>('/api/admin/instances').then((r) => {
      if (r.success && r.data) setInstances(r.data.map((i) => ({ name: i.name })));
    });
  }, []);

  useEffect(() => {
    if (!selectedEndpoint) return;
    const defaults: Record<string, string> = {};
    for (const f of selectedEndpoint.bodyFields) {
      if (f.default !== undefined) defaults[f.key] = String(f.default);
      else if (f.type === 'boolean') defaults[f.key] = 'false';
      else defaults[f.key] = '';
    }
    setParamValues(defaults);
  }, [selectedId, selectedEndpoint]);

  const handleParamChange = useCallback((key: string, val: string) => {
    setParamValues((prev) => ({ ...prev, [key]: val }));
  }, []);

  const getResolvedPath = useCallback((): string => {
    if (!selectedEndpoint) return '';
    return selectedEndpoint.path.replace(':instance', instanceName);
  }, [selectedEndpoint, instanceName]);

  const handleRunRequest = async () => {
    if (!selectedEndpoint || !adminToken) return;
    setIsRunning(true);
    setResponseCode(null);
    setResponseBody('');

    const resolvedPath = getResolvedPath();
    const reqBody = buildBody(selectedEndpoint, paramValues);

    try {
      const res = await fetch('/api/admin/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
        body: JSON.stringify({
          method: selectedEndpoint.method,
          path: resolvedPath,
          body: Object.keys(reqBody).length > 0 ? reqBody : undefined,
        }),
      });
      setResponseCode(res.status);
      const text = await res.text();
      try { setResponseBody(JSON.stringify(JSON.parse(text), null, 2)); }
      catch { setResponseBody(text); }
    } catch (err) {
      setResponseCode(0);
      setResponseBody(`Connection error: ${err instanceof Error ? err.message : String(err)}`);
    }
    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-[#cbd3cf]">FIDScript REST Sandbox</h1>
        <p className="text-xs text-[#a8a99e] mt-1">
          Execute live requests against the FIDScript WhatsApp API. All requests use your admin session.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <CategorySidebar
          categories={API_CATEGORIES}
          activeCategory={activeCategory}
          onSelect={(cat) => { setActiveCategory(cat); setSelectedId(''); }}
        />

        <EndpointList
          endpoints={filteredEndpoints}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        <div className="flex-1 min-w-0">
          {!selectedEndpoint ? (
            <div className="flex items-center justify-center h-48 text-[#5a554a] text-xs">
              Select an endpoint from the list to build a request
            </div>
          ) : (
            <RequestPanel
              endpoint={selectedEndpoint}
              resolvedPath={getResolvedPath()}
              instanceName={instanceName}
              instances={instances}
              paramValues={paramValues}
              isRunning={isRunning}
              responseCode={responseCode}
              responseBody={responseBody}
              onInstanceChange={setInstanceName}
              onParamChange={handleParamChange}
              onRun={handleRunRequest}
            />
          )}
        </div>
      </div>
    </div>
  );
}
