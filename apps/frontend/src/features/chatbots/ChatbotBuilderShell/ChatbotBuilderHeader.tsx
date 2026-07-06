import { ArrowLeft, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useChatbotBuilderStore } from '../store/chatbotBuilderStore';

interface ChatbotBuilderHeaderProps {
  isEditMode: boolean;
  onRequestLeave: () => void;
}

export default function ChatbotBuilderHeader({ isEditMode, onRequestLeave }: ChatbotBuilderHeaderProps) {
  const navigate = useNavigate();
  const getProgress = useChatbotBuilderStore(s => s.getProgress);
  const progress = getProgress();

  return (
    <div className="mb-6">
      <button
        onClick={onRequestLeave}
        className="flex items-center gap-2 text-[#8f834a] hover:text-white text-xs transition mb-2"
      >
        <ArrowLeft className="w-3 h-3" />
        All Chatbots
      </button>
      <h2 className="text-white font-bold text-sm flex items-center gap-2">
        <Bot className="w-4 h-4 text-yellow-400" />
        {isEditMode ? 'Edit Chatbot' : 'Create Chatbot'}
      </h2>
      <div className="mt-3">
        <div className="h-1.5 bg-[#1f1d0b] rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] text-[#6e684a] mt-1">{progress}% complete</p>
      </div>
    </div>
  );
}
