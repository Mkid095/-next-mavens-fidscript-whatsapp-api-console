import { Zap, QrCode, Webhook, BarChart3, Users, Bot, Terminal, Key, Cpu, ShieldCheck } from 'lucide-react';
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
  {
    icon: Terminal,
    title: 'One-line CLI',
    description: 'Install with one curl. Manage instances, send all 10 message types, build and publish chatbots, and stream live events — from any shell, cron job, or AI agent.',
    code: `# Install
curl -Ls https://whatsapp.fidscript.com/cli/install.sh | sh

# Sign in (magic-code email)
fidscript login --email you@example.com

# Create instance + scan QR
fidscript instance create my-bot
fidscript instance qr my-bot

# Send any of the 10 message types
fidscript send text my-bot --to +254700000000 --text "Hello!"

# Watch live state via SSE
fidscript instance watch my-bot`,
  },
  {
    icon: Key,
    title: 'Open npm SDK',
    description: 'Official TypeScript SDK on npm. Type-safe wrappers for every endpoint, retry logic, and a clean DX — for Node 18+ services and AI agents.',
    code: `npm install @fidscript/sdk

import { Fidscript } from '@fidscript/sdk';

const fs = new Fidscript({ apiKey: process.env.FIDSCRIPT_API_KEY });
await fs.sends.text('my-bot', {
  number: '+254700000000',
  message: 'Hello from the SDK!',
});

// Logged-in flow (chatbots, BYO LLM):
await fs.auth.requestCode('me@example.com');
await fs.auth.verifyCode('me@example.com', '123456');
await fs.chatbots.list();`,
  },
  {
    icon: Cpu,
    title: 'Bring Your Own LLM',
    description: 'Connect any OpenAI-compatible endpoint — OpenAI, Anthropic, Gemini, OpenRouter, Ollama, vLLM, Azure — with your API key. Encrypted at rest, failover chains supported.',
    code: `# Register your own connection
fidscript llm create openai-prod \\
  --provider openai \\
  --model gpt-4o-mini \\
  --api-key "$OPENAI_API_KEY" \\
  --default

# Self-hosted Ollama
fidscript llm create ollama \\
  --provider custom \\
  --model llama3.1 \\
  --endpoint http://localhost:11434

# Attach to a chatbot
fidscript chatbot ai-config <bot-id> \\
  --llm-connection llmc_abc \\
  --hallucination-policy strict`,
  },
  {
    icon: ShieldCheck,
    title: 'WhatsApp Meta-Compliant',
    description: 'Paced through tier limits (250→∞ unique customers/day), hallucination policy modes, confidence-threshold handoff, and 24h session windows. Your account stays in good standing.',
    code: `// Bot auto-hands-off when confidence is low
{
  "policies": {
    "confidence_threshold": 0.7,
    "fallback_reply": "Let me connect you with a human."
  },
  "hallucination_policy": "strict"
}

// Tier-aware send pacing handled server-side
// Daily unique-customer cap enforced per workspace`,
  },
];

export const howItWorksSteps: HowItWorksStep[] = [
  {
    step: '01',
    title: 'Sign up + sign in',
    description: 'Free account, no credit card. Magic-code email sign-in, or use the CLI for headless onboarding.',
    icon: Users,
  },
  {
    step: '02',
    title: 'Connect your number',
    description: 'Run fidscript instance create + scan a QR with WhatsApp. Or link multiple numbers for multi-region operations.',
    icon: QrCode,
  },
  {
    step: '03',
    title: 'Build, send, automate',
    description: 'Use the CLI, SDK, REST API, or sandbox. Build BYO-LLM chatbots, send any of 10 message types, stream live events into your CRM.',
    icon: Bot,
  },
];
