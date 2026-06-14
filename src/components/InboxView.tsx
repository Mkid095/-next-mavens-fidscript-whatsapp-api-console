import React, { useState } from 'react';
import { InboxMessage } from '../types';
import MessageList from './admin/inbox/MessageList';
import MessageDetail from './admin/inbox/MessageDetail';

interface InboxViewProps {
  messages: InboxMessage[];
  onMarkRead: (id: string) => void;
}

export default function InboxView({ messages, onMarkRead }: InboxViewProps) {
  const [selectedMsg, setSelectedMsg] = useState<InboxMessage | null>(null);

  const handleSelectMessage = (msg: InboxMessage) => {
    setSelectedMsg(msg);
    onMarkRead(msg.id);
  };

  return (
    <div className="space-y-6 flex flex-col">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-forest-deep">
          Evolution Alerts Inbox
        </h1>
        <p className="text-xs text-graphite mt-1">
          Stay synchronized with cluster core updates, Safaricom Daraja maintenance notices, and developer support logs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <MessageList
            messages={messages}
            selectedMsg={selectedMsg}
            onSelect={handleSelectMessage}
          />
        </div>

        <div className="lg:col-span-2">
          <MessageDetail message={selectedMsg} />
        </div>
      </div>
    </div>
  );
}
