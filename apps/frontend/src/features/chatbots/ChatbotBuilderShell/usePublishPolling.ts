import { useEffect } from 'react';
import { fetchApi } from '../../../services/api';
import type { PublishJob } from '../types';

export function usePublishPolling(
  publishJob: PublishJob | null,
  clientToken: string,
  setPublishJob: (job: PublishJob | null) => void,
) {
  useEffect(() => {
    if (!publishJob) return;
    if (publishJob.status === 'done' || publishJob.status === 'failed') return;

    const poll = async () => {
      try {
        const res = await fetchApi(
          `/api/platform/chatbot-drafts/publish-jobs/${publishJob.id}`,
          { headers: { Authorization: `Bearer ${clientToken}` } },
        ) as { success: boolean; data: PublishJob };
        if (res.success && res.data) setPublishJob(res.data);
      } catch { /* keep polling */ }
    };

    const interval = setInterval(poll, 1500);
    return () => clearInterval(interval);
  }, [publishJob, clientToken, setPublishJob]);
}
