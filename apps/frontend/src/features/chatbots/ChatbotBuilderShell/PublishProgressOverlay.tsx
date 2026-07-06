import PublishProgressScreen from '../components/PublishProgressScreen';
import type { PublishJob } from '../types';

interface PublishProgressOverlayProps {
  publishJob: PublishJob | null;
  onClose: () => void;
  onViewChatbot: () => void;
  onRetry: () => void;
}

export default function PublishProgressOverlay({
  publishJob,
  onClose,
  onViewChatbot,
  onRetry,
}: PublishProgressOverlayProps) {
  if (!publishJob) return null;

  return (
    <PublishProgressScreen
      job={publishJob}
      onClose={onClose}
      onViewChatbot={onViewChatbot}
      onRetry={onRetry}
    />
  );
}
