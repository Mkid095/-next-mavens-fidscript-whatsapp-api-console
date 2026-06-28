import { Zap, QrCode, Webhook, BarChart3, Users, Bot } from 'lucide-react';
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
    icon: Bot,
    title: 'AI Chatbot Builder',
    description: 'Build WhatsApp chatbots with natural language AI. Connect to OpenAI, Anthropic, Gemini, and 6+ other LLM providers. Automate FAQ responses, lead capture, and customer support 24/7.',
    code: `// Create a chatbot that responds with AI
POST /api/platform/chatbots
{
  "name": "sales-bot",
  "instanceName": "my-instance",
  "config": { "model": "gpt-4o", "temperature": 0.7 }
}

// Add AI-powered triggers
POST /api/platform/chatbots/:id/triggers
{ "keyword": "prices", "response": "Our prices are..." }

// Test your chatbot instantly
POST /api/platform/chatbots/:id/test-trigger
{ "message": "what are your prices?" }`,
  },
  {
    icon: Zap,
    title: 'Instant API Integration',
    description: 'Send WhatsApp messages with a single HTTP request. Full REST API with comprehensive documentation and SDKs.',
    code: `curl -X POST https://whatsapp.fidscript.com/api/v1/sendText \\
  -H "X-API-Key: fidscript_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"instanceName": "my-instance", "number": "254712345678", "text": "Hello from FIDScript!"}'`,
  },
  {
    icon: QrCode,
    title: 'QR Code Connection',
    description: 'Connect WhatsApp instances in seconds. No complex setup — just scan and start sending.',
    code: `// Connect instance via QR code
GET /api/instance/connect/my-instance
// Returns base64 QR code image — render in your UI`,
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
    code: `// Track usage and analytics
GET /api/v1/usage
// Returns message counts, delivery rates, and daily breakdowns`,
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
    title: 'Build AI Chatbots or Send Messages',
    description: 'Create AI-powered chatbots or send messages via our REST API. Full documentation and SDK support.',
    icon: Bot,
  },
];
