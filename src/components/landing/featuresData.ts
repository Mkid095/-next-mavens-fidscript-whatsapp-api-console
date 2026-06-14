import { Zap, QrCode, Webhook, BarChart3, Users } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  code: string;
}

export interface HowItWorksStep {
  step: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export const features: Feature[] = [
  {
    icon: Zap,
    title: 'Instant API Integration',
    description: 'Send WhatsApp messages with a single HTTP request. Full REST API with comprehensive documentation and SDKs.',
    code: `curl -X POST https://api.evolution.io/send \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"to": "+254712345678", "message": "Hello!"}'`,
  },
  {
    icon: QrCode,
    title: 'QR Code Connection',
    description: 'Connect WhatsApp instances in seconds. No complex setup — just scan and start sending.',
    code: `// Generate QR code for connection
const qr = await evolution.instances.connect('my-instance');
// Display qr.qrCodeImage to user`,
  },
  {
    icon: Webhook,
    title: 'Real-time Webhooks',
    description: 'Receive incoming messages and connection events instantly via webhooks. Build responsive chatbots and automation flows.',
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
    code: `// Fetch analytics
const stats = await evolution.analytics.get({
  period: '7d',
  groupBy: 'instance'
});`,
  },
];

export const howItWorksSteps: HowItWorksStep[] = [
  {
    step: '01',
    title: 'Create an Account',
    description: 'Sign up and choose a plan that fits your business needs. Start with a free trial.',
    icon: Users,
  },
  {
    step: '02',
    title: 'Connect via QR Code',
    description: 'Link your WhatsApp number by scanning a QR code. No technical knowledge required.',
    icon: QrCode,
  },
  {
    step: '03',
    title: 'Start Sending',
    description: 'Use our REST API to send messages instantly. Full documentation and SDK support.',
    icon: Zap,
  },
];
