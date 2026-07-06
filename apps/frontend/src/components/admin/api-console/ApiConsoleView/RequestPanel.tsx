import { Play, RefreshCw } from 'lucide-react';
import type { ApiEndpoint, BodyField } from '../../../../data/apiEndpoints/index';
import { FieldInput } from './FieldInput';
import ResponseViewer from '../ResponseViewer';

interface RequestPanelProps {
  endpoint: ApiEndpoint;
  resolvedPath: string;
  instanceName: string;
  instances: { name: string }[];
  paramValues: Record<string, string>;
  isRunning: boolean;
  responseCode: number | null;
  responseBody: string;
  onInstanceChange: (v: string) => void;
  onParamChange: (key: string, val: string) => void;
  onRun: () => void;
}

function methodBadge(m: string) {
  if (m === 'GET') return 'text-blue-400 bg-blue-900/40 border-blue-900/50';
  if (m === 'POST') return 'text-emerald-400 bg-emerald-900/40 border-emerald-900/50';
  if (m === 'PATCH') return 'text-yellow-400 bg-yellow-900/40 border-yellow-900/50';
  return 'text-[#6e684a] bg-[#181711] border-[#2d2813]';
}

export function RequestPanel({
  endpoint, resolvedPath, instanceName, instances, paramValues, isRunning,
  responseCode, responseBody, onInstanceChange, onParamChange, onRun,
}: RequestPanelProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#2d2813] bg-[#1a1915] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${methodBadge(endpoint.method)}`}>
            {endpoint.method}
          </span>
          <code className="font-mono text-xs text-[#a8a99e] bg-[#181711] px-2 py-1 rounded">
            {resolvedPath || endpoint.path}
          </code>
        </div>

        {endpoint.path.includes(':instance') && (
          <div>
            <label className="block text-[9px] font-bold text-[#6e684a] uppercase tracking-wider mb-1">Container *</label>
            <select
              value={instanceName}
              onChange={(e) => onInstanceChange(e.target.value)}
              className="w-full px-2.5 py-2 border border-[#2d2813] bg-[#181711] rounded-lg text-xs text-[#a8a99e] focus:outline-none"
            >
              <option value="">Select container…</option>
              {instances.map((i) => (
                <option key={i.name} value={i.name}>{i.name}</option>
              ))}
            </select>
          </div>
        )}

        {endpoint.bodyFields.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {endpoint.bodyFields.map((field: BodyField) => (
              <FieldInput
                key={field.key}
                field={field}
                value={paramValues[field.key] ?? ''}
                onChange={(v) => onParamChange(field.key, v)}
              />
            ))}
          </div>
        )}

        {endpoint.bodyFields.length === 0 && (
          <p className="text-[10px] text-[#5a554a] italic">No request body</p>
        )}

        <button
          onClick={onRun}
          disabled={isRunning || (endpoint.path.includes(':instance') && !instanceName)}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-[#181711] rounded-xl text-xs font-bold disabled:opacity-50 transition-opacity"
        >
          {isRunning
            ? <><RefreshCw size={13} className="animate-spin" /> Running…</>
            : <><Play size={13} /> Run Request</>}
        </button>
      </div>

      <ResponseViewer
        isRunning={isRunning}
        responseCode={responseCode}
        responseBody={responseBody}
        endpointPath={resolvedPath || endpoint.path}
      />
    </div>
  );
}
