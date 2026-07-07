import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { ExternalLink } from 'lucide-react';
import { API_ENDPOINTS, API_CATEGORIES, type ApiEndpoint, type BodyField } from '../../data/apiEndpoints/index';
import EndpointSidebar, { type DocGroup, type DocEndpoint } from './EndpointSidebar.js';
import EndpointDetail from './EndpointDetail.js';
import SdkModal from './SdkModal.js';
import type { Lang } from './docsHelpers.js';

interface ParamRow { name: string; type: string; required: boolean; desc: string; }

function flattenFields(fields: BodyField[], prefix = ''): ParamRow[] {
  return fields.flatMap(f => {
    const name = prefix ? `${prefix}.${f.key}` : f.key;
    if (f.fields) return flattenFields(f.fields, name);
    return [{ name, type: f.type, required: !!f.required, desc: f.desc || '' }];
  });
}

function displayPath(path: string): string {
  return path.replace('/api/v1', '').replace(':instance', ':instanceName');
}

const DOC_GROUPS: DocGroup[] =
  API_CATEGORIES
    .filter(cat => cat.name !== 'Receiving')
    .map(cat => ({
      name: cat.name,
      icon: cat.icon,
      endpoints: API_ENDPOINTS
        .filter((ep: ApiEndpoint) => ep.category === cat.name && ep.path.startsWith('/api/v1'))
        .map((ep: ApiEndpoint) => ({
          method: ep.method,
          path: displayPath(ep.path),
          name: ep.name,
          desc: ep.desc,
          params: flattenFields(ep.bodyFields),
          cost: ep.cost,
          category: ep.category,
        })),
    }))
    .filter(g => g.endpoints.length > 0);

export default function DocsSection({ client }: { client?: { api_key?: string } }) {
  const [selectedEndpoint, setSelectedEndpoint] = useState<DocEndpoint | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(DOC_GROUPS[0]?.name || '');
  const [activeLang, setActiveLang] = useState<Lang>('curl');
  const [showSdkModal, setShowSdkModal] = useState(false);

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">API Reference</h2>
        <a
          href="/api/reference"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ExternalLink size={14} />
          Open full API Reference
        </a>
      </div>

      {/* Main content */}
    <div className="flex gap-6" style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}>
      <EndpointSidebar
        groups={DOC_GROUPS}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        selectedEndpoint={selectedEndpoint}
        setSelectedEndpoint={setSelectedEndpoint}
        apiKey={client?.api_key}
        onSdkClick={() => setShowSdkModal(true)}
      />
      <EndpointDetail
        endpoint={selectedEndpoint}
        activeLang={activeLang}
        setActiveLang={setActiveLang}
        apiKey={client?.api_key}
      />
      <AnimatePresence>
        {showSdkModal && <SdkModal onClose={() => setShowSdkModal(false)} />}
      </AnimatePresence>
    </div>
    </div>
  );
}
