/**
 * GroupsStep — Step 7 of the Chatbot Builder.
 *
 * Configure how the chatbot behaves in specific WhatsApp groups.
 */
import React from 'react';
import { MessageSquare, Users } from 'lucide-react';

export default function GroupsStep() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl">
        <MessageSquare className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-white">WhatsApp Groups</p>
          <p className="text-xs text-[#8f834a] mt-0.5">
            Choose which WhatsApp groups this chatbot should be active in. Group settings are configured in the Audience step.
          </p>
        </div>
      </div>
      <div className="text-center py-10 border-2 border-dashed border-[#2d2813] rounded-2xl">
        <Users className="w-10 h-10 mx-auto mb-3 text-[#3d3823]" />
        <p className="text-sm font-semibold text-[#6e684a]">Group configuration</p>
        <p className="text-xs text-[#5a554a] mt-1">Set group behavior in the Audience step above.</p>
      </div>
    </div>
  );
}
