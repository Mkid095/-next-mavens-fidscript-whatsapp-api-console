/**
 * CliInstallSection.tsx — landing-page section promoting the FIDScript CLI.
 *
 * Renders a large install command with a copy button, followed by a quickstart
 * grid of common commands (login, whoami, instance create, chatbot setup).
 *
 * Visual style: same dark palette as the rest of LandingPage.tsx
 *   - page bg `#0c0b06`, card `#1a1915`, border `#262413`
 *   - text `#a8a99e`, accent `#f97316`
 */
import React from 'react';
import { Terminal, Sparkles } from 'lucide-react';
import { DocsCodeBlock } from '../shared/DocsCodeBlock.js';
import { CopyButton } from '../shared/CopyButton.js';

interface QuickstartItem {
  title: string;
  command: string;
  description: string;
}

const QUICKSTART: QuickstartItem[] = [
  {
    title: 'Sign in',
    command: 'fidscript login --email you@example.com',
    description: 'Magic-code auth. Stores a JWT in ~/.fidscript/credentials.',
  },
  {
    title: 'Verify auth',
    command: 'fidscript whoami',
    description: 'Prints your account name, plan, and token balance.',
  },
  {
    title: 'Create an instance',
    command: 'fidscript instance create my-bot\nfidscript instance qr my-bot',
    description: 'Provision a new WhatsApp instance and scan the QR code.',
  },
  {
    title: 'Set up a chatbot',
    command: 'fidscript chatbot setup --instance my-bot',
    description: 'Guided wizard for an end-to-end chatbot in your terminal.',
  },
];

export function CliInstallSection(): React.ReactElement {
  const installCmd = '# Recommended (Node 18+, picks the latest stable):\nnpm install -g @fidscript/cli\nfidscript --version\n\n# Or the SDK — the CLI is bundled as a dependency:\nnpm install @fidscript/sdk\n# → ./node_modules/.bin/fidscript is ready to use\n\n# Or the one-liner bootstrap (auto-installs Node if missing):\ncurl -Ls https://whatsapp.fidscript.com/cli/install.sh | sh';

  return (
    <section className="bg-[#0c0b06] py-16 md:py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-[11px] font-bold uppercase tracking-wider">
            <Terminal size={12} />
            CLI
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold font-selecta text-[#cbd3cf] tracking-tight">
            Or just install the CLI
          </h2>
          <p className="text-sm sm:text-base text-[#8a886a] max-w-2xl mx-auto leading-relaxed">
            Every <code className="font-mono text-[#f97316]">/api/v1</code> endpoint,
            chatbot, and instance lifecycle is one command away. The CLI is built
            for both humans and AI agents — every command supports
            <code className="font-mono text-[#f97316] mx-1">--json</code> and
            <code className="font-mono text-[#f97316] mx-1">--yaml</code> output.
          </p>
        </div>

        {/* Install command */}
        <div className="max-w-3xl mx-auto">
          <DocsCodeBlock code={installCmd} lang="bash" className="shadow-xl" />
          <p className="text-center text-xs text-[#6a6c5d] mt-3">
            Requires Node.js 18+ — the installer will bootstrap it for you.
          </p>
        </div>

        {/* Quickstart grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {QUICKSTART.map((item) => (
            <div
              key={item.title}
              className="bg-[#1a1915] border border-[#262413] rounded-2xl p-5 hover:border-[#3d3a1e] transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-bold text-[#cbd3cf] flex items-center gap-2">
                    <Sparkles size={14} className="text-yellow-500" />
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#6a6c5d] mt-1 leading-relaxed">{item.description}</p>
                </div>
              </div>
              <div className="relative">
                <pre className="bg-[#13120d] border border-[#262413] rounded-xl p-3 pr-12 text-xs font-mono text-[#c9d1d9] overflow-x-auto whitespace-pre-wrap break-all">
{item.command}
                </pre>
                <div className="absolute top-2 right-2">
                  <CopyButton text={item.command} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CliInstallSection;