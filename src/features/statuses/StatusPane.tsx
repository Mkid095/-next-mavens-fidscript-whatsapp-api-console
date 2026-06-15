import { useState, useCallback } from 'react';
import { useStatusPosts } from '../../data/hooks/index.js';
import type { CreateStatusPostInput, StatusPost } from '../../data/api/platform.js';
import type { Instance } from '../../services/api';
import StatusComposer from './StatusComposer.js';
import StatusList from './StatusList.js';

interface StatusPaneProps {
  instances: Instance[];
}

/**
 * Phase 5 Slice E — Statuses tab content. Owns the composer + list and
 * threads the submit/delete/cancel callbacks between them. Sits inside
 * MarketingCenter as one of the 4 tabs.
 */
export default function StatusPane({ instances }: StatusPaneProps) {
  const { posts, loading, error: listError, create, postNow, cancel, remove } = useStatusPosts();
  const [composerError, setComposerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleSubmit = async (body: CreateStatusPostInput) => {
    setComposerError(null);
    setSubmitting(true);
    try {
      await create(body);
    } catch (e) {
      setComposerError(e instanceof Error ? e.message : 'Failed to create status post');
    } finally {
      setSubmitting(false);
    }
  };

  const runWithId = useCallback(
    (fn: (id: string) => Promise<StatusPost | void>) => async (id: string) => {
      setBusyId(id);
      try { await fn(id); }
      catch (e) { setComposerError(e instanceof Error ? e.message : 'Action failed'); }
      finally { setBusyId(null); }
    },
    []
  );

  return (
    <div className="space-y-4">
      <StatusComposer
        instances={instances}
        onSubmit={handleSubmit}
        submitting={submitting}
        error={composerError}
      />
      <div>
        <p className="text-[10px] font-bold text-graphite uppercase mb-1.5">Recent status posts</p>
        {loading ? (
          <p className="text-[10px] text-stone-500 p-3">Loading…</p>
        ) : listError ? (
          <p className="text-[10px] text-red-600 p-3 bg-red-50 border border-red-200 rounded-lg">{listError}</p>
        ) : (
          <StatusList
            posts={posts}
            instances={instances}
            onPostNow={runWithId(postNow)}
            onCancel={runWithId(cancel)}
            onDelete={runWithId(remove)}
            busyId={busyId}
          />
        )}
      </div>
    </div>
  );
}
