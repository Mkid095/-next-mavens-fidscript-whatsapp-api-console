import { Inbox } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="flex h-full min-h-0 flex-1 items-center justify-center bg-[#181711] text-[#6e684a]">
      <div className="text-center">
        <Inbox size={32} className="mx-auto mb-2" />
        <p className="text-sm">No WhatsApp instances yet</p>
        <p className="text-xs">Create and connect one to start chatting.</p>
      </div>
    </div>
  );
}
