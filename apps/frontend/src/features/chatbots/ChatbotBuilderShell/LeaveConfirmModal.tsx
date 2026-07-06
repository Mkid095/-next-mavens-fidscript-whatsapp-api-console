import { AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clearDraft } from '../store/chatbotBuilderStore';

interface LeaveConfirmModalProps {
  isEditMode: boolean;
  botId: string | undefined;
  onClose: () => void;
}

export default function LeaveConfirmModal({ isEditMode, botId, onClose }: LeaveConfirmModalProps) {
  const navigate = useNavigate();

  const handleDiscard = () => {
    clearDraft(botId);
    navigate('/client/chatbots');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1a1915] border border-[#2d2813] rounded-2xl p-6 max-w-sm w-full space-y-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-yellow-400 shrink-0" />
          <h3 className="text-white font-bold">Unsaved Changes</h3>
        </div>
        <p className="text-[#8f834a] text-sm">
          You have unsaved changes. Are you sure you want to leave? Your progress has been autosaved as a draft.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-[#2d2813] hover:bg-[#3d3823] text-white rounded-xl text-xs font-semibold transition"
          >
            Keep Editing
          </button>
          <button
            onClick={handleDiscard}
            className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-xs font-semibold transition"
          >
            Discard & Leave
          </button>
        </div>
      </div>
    </div>
  );
}
