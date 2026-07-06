import { ShieldOff } from 'lucide-react';

export default function RestrictedBanner() {
  return (
    <div className="mb-2 flex items-center gap-2 rounded-lg border border-[#2d2813] bg-[#1a1915] px-3 py-2 text-xs text-[#6e684a]">
      <ShieldOff size={14} className="shrink-0 text-[#eab308]" />
      Only admins can send messages in this group
    </div>
  );
}
