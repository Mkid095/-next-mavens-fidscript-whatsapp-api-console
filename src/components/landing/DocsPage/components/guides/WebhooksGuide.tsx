import { motion } from 'framer-motion';
import { DocsCodeBlock } from '../../../../shared/DocsCodeBlock';

export function WebhooksGuide() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-white mb-2">Webhooks</h1>
      <p className="text-sm text-[#8a886a] mb-8">
        Configure a webhook URL in your instance settings. FIDScript will POST event
        payloads to your endpoint as they occur.
      </p>

      <h2 className="text-lg font-bold text-white mb-4">Supported Events</h2>
      <div className="grid grid-cols-2 gap-2 mb-8">
        {['messages.upsert', 'messages.update', 'connection.update', 'qrcode.updated'].map(e => (
          <div
            key={e}
            className="bg-[#1a1910] border border-[#262413] rounded-xl px-3 py-2.5 font-mono text-xs text-[#8a886a]"
          >
            {e}
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold text-white mb-4">Payload — messages.upsert</h2>
      <DocsCodeBlock
        code={`{\n  "event": "messages.upsert",\n  "instanceName": "my-instance",\n  "data": {\n    "key": {\n      "id": "BAE5F1234567890",\n      "remoteJid": "254712345678@s.whatsapp.net",\n      "fromMe": false\n    },\n    "message": { "conversation": "Hello!" },\n    "messageType": "conversation",\n    "timestamp": 1718123456\n  }\n}`}
        lang="json"
      />
    </motion.div>
  );
}
