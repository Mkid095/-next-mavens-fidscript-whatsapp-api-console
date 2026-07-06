import { useNavigate } from 'react-router';
import { Link2Off } from 'lucide-react';
import type { Instance } from '../../../services/api';

export default function NotLinkedState({ instance }: { instance: Instance }) {
  const navigate = useNavigate();
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center bg-[#181711]">
      <div className="text-center max-w-xs">
        <Link2Off size={40} className="mx-auto mb-3 text-[#6e684a]" />
        <h2 className="text-base font-semibold text-[#a8a99e] mb-1">
          {instance.name} is not linked
        </h2>
        <p className="text-xs text-[#6e684a] mb-5">
          This container has no WhatsApp account connected. Scan a QR code to link it.
        </p>
        <button
          onClick={() => navigate('/client/whatsapp')}
          className="rounded-lg bg-[#eab308] px-4 py-2 text-sm font-medium text-black hover:bg-[#fde047] transition"
        >
          Go to Containers
        </button>
      </div>
    </div>
  );
}
