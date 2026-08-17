import { motion } from 'framer-motion';
import { DocsCodeBlock } from '../../../../shared/DocsCodeBlock';
import { Callout } from '../Callout';
import { PUBLIC_API_BASE } from '../../../../../data/apiEndpoints/index';

export function QuickstartGuide() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">Quick Start</h1>
      <p className="text-sm text-[#525252] mb-8">
        Get up and running with FIDScript in 5 minutes.
      </p>

      <Callout type="info">
        <p>
          <strong className="text-[#1a1a1a]">New to FIDScript?</strong> You'll need an account
          (free signup), an API key, and a WhatsApp instance to start sending.
        </p>
      </Callout>

      <h2 className="text-lg font-bold text-[#1a1a1a] mt-8 mb-4">Getting Started</h2>
      {[
        {
          n: 1,
          title: 'Create an account',
          items: [
            'Sign up at whatsapp.fidscript.com/register',
            'Check your email for a magic login code',
            '500 free welcome tokens are credited automatically',
          ],
        },
        {
          n: 2,
          title: 'Get your API Key',
          items: [
            'Go to Settings → API Keys',
            'Copy your key - format: fidscript_live_...',
            'Keep this secret - regenerate if lost',
          ],
        },
        {
          n: 3,
          title: 'Create a WhatsApp Instance',
          items: [
            'Go to WhatsApp Containers → New Instance',
            'Name your instance (e.g. my-business)',
            'Click Connect → scan the QR code with your WhatsApp app',
          ],
        },
        {
          n: 4,
          title: 'Send your First Message',
          items: [
            'Use the API reference or the built-in sandbox',
            'Try sending a text message to your own number',
            'Check delivery status in real-time on your dashboard',
          ],
        },
      ].map(({ n, title, items }) => (
        <div key={n} className="flex gap-4 mb-6">
          <div className="w-7 h-7 rounded-full bg-[#f97316] text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
            {n}
          </div>
          <div>
            <div className="text-sm font-semibold text-[#1a1a1a] mb-2">{title}</div>
            <ul className="space-y-1.5">
              {items.map(i => (
                <li
                  key={i}
                  className="text-xs text-[#525252] pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-[#a0a0a0]"
                >
                  {i}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}

      <h2 className="text-lg font-bold text-[#1a1a1a] mt-10 mb-4">Base URL</h2>
      <DocsCodeBlock code={PUBLIC_API_BASE} lang="bash" />
    </motion.div>
  );
}
