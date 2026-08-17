import { Zap, QrCode, Webhook, BarChart3, Users, Terminal, Key, ShieldCheck, Phone } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  code: string;
}

export const features: Feature[] = [
  {
    icon: Zap,
    title: 'Instant API Integration',
    description: 'Send WhatsApp messages with a single HTTP request. Full REST API with comprehensive documentation and SDKs for Node.js.',
    code: `curl -X POST https://whatsapp.fidscript.com/api/v1/sendText \\
  -H "X-API-Key: fidscript_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"instanceName": "my-instance", "number": "254712345678", "text": "Hello from FIDScript!"}'`,
  },
  {
    icon: QrCode,
    title: 'QR Code Connection',
    description: 'Connect WhatsApp instances in seconds. No complex setup - just scan and start sending messages.',
    code: `// Connect instance via QR code
GET /api/instance/connect/my-instance
// Returns base64 QR code image - render in your UI`,
  },
  {
    icon: Webhook,
    title: 'Real-time Webhooks',
    description: 'Receive incoming messages and connection events instantly via webhooks. Build automation flows and notification systems.',
    code: `{
  "event": "message",
  "instance": "my-instance",
  "data": {
    "from": "+254712345678",
    "text": "Hello there!"
  }
}`,
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Track message delivery, open rates, and engagement. Full visibility into your WhatsApp operations.',
    code: `// Track usage and analytics
GET /api/v1/usage
// Returns message counts, delivery rates, and daily breakdowns`,
  },
  {
    icon: Phone,
    title: 'Multi-Instance Support',
    description: 'Manage multiple WhatsApp numbers from a single dashboard. Scale your business communication across regions.',
    code: `// Create multiple instances
POST /api/instance/create
{ "instanceName": "business-line-1" }

POST /api/instance/create
{ "instanceName": "business-line-2" }

// Send from specific instance
POST /api/v1/sendText
{ "instanceName": "business-line-1", "number": "...", "text": "..." }`,
  },
  {
    icon: Terminal,
    title: 'One-line CLI',
    description: 'Install with one curl. Manage instances, send all message types, and stream live events - from any shell, cron job, or automation script.',
    code: `# Install
curl -Ls https://whatsapp.fidscript.com/cli/install.sh | sh

# Sign in
fidscript login --email you@example.com

# Create instance + scan QR
fidscript instance create my-bot
fidscript instance qr my-bot

# Send any of the 10 message types
fidscript send text my-bot --to +254700000000 --text "Hello!"`,
  },
  {
    icon: Key,
    title: 'Open npm SDK',
    description: 'Official TypeScript SDK on npm. Type-safe wrappers for every endpoint, retry logic, and a clean DX - for Node 18+ services.',
    code: `npm install @fidscript/sdk

import { Fidscript } from '@fidscript/sdk';

const fs = new Fidscript({ apiKey: process.env.FIDSCRIPT_API_KEY });
await fs.sends.text('my-bot', {
  number: '+254700000000',
  message: 'Hello from the SDK!',
});`,
  },
  {
    icon: ShieldCheck,
    title: 'WhatsApp Meta-Compliant',
    description: 'Paced through tier limits (250 to unlimited unique customers/day). Our system handles throttling automatically so your account stays in good standing.',
    code: `// Rate limiting handled server-side
// Tier-aware send pacing
// Daily unique-customer cap enforced per workspace
// 10 MPS bulk send, ramping to 30 MPS at 5000+ queue`,
  },
];

export interface HowItWorksStep {
  step: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const howItWorksSteps: HowItWorksStep[] = [
  {
    step: '01',
    title: 'Sign up + create instance',
    description: 'Free account with welcome tokens. Create your first WhatsApp instance and connect in minutes.',
    icon: Users,
  },
  {
    step: '02',
    title: 'Scan QR code',
    description: 'Link your WhatsApp number by scanning a QR code. Or connect multiple numbers for multi-region operations.',
    icon: QrCode,
  },
  {
    step: '03',
    title: 'Start sending',
    description: 'Use the REST API, CLI, or SDK to send messages. Build webhooks to receive incoming messages in real-time.',
    icon: Zap,
  },
];
