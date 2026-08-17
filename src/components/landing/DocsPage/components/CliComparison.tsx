import { DocsCodeBlock } from '../../../shared/DocsCodeBlock.tsx';

export function CliComparison({ op, curl, cli }: { op: string; curl: string; cli: string }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-[#1a1a1a]">{op}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] font-mono text-[#a0a0a0] uppercase tracking-wider mb-1.5">
            cURL
          </div>
          <DocsCodeBlock code={curl} lang="bash" />
        </div>
        <div>
          <div className="text-[10px] font-mono text-[#f97316] uppercase tracking-wider mb-1.5">
            fidscript CLI
          </div>
          <DocsCodeBlock code={cli} lang="bash" />
        </div>
      </div>
    </div>
  );
}
