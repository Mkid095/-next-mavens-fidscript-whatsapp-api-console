import React from 'react';

interface PerClient {
  client_id: string;
  client_name: string;
  email: string;
  plan_id: string | null;
  chatbot_count: number;
  enabled_count: number;
  tokens_this_week: number;
}

interface AdminChatbotCardProps {
  client: PerClient;
  formatTokens: (n: number) => string;
}

export default function AdminChatbotCard({ client, formatTokens }: AdminChatbotCardProps) {
  return (
    <tr key={client.client_id} className="border-b border-[#2d2813]/50">
      <td className="py-2">
        <div className="font-bold text-[#cbd3cf]">{client.client_name}</div>
        <div className="text-[10px] text-[#6a6c5d] font-mono">{client.email}</div>
      </td>
      <td className="text-[#a8a99e]">{client.plan_id ?? <span className="text-[#6a6c5d]">—</span>}</td>
      <td className="text-right text-[#a8a99e]">{client.chatbot_count}</td>
      <td className="text-right text-green-400">{client.enabled_count}</td>
      <td className="text-right text-yellow-500">{formatTokens(client.tokens_this_week)}</td>
    </tr>
  );
}
