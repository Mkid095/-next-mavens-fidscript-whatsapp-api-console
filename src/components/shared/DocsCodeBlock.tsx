/**
 * DocsCodeBlock.tsx - shared dark-mode code snippet block.
 *
 * Renders a header bar (language label + CopyButton) and a pre-formatted
 * <pre> body. Used by DocsPage, CliInstallSection, and any dark-themed
 * docs surface.
 */
import React from 'react';
import { CopyButton } from './CopyButton.js';

interface DocsCodeBlockProps {
  code: string;
  lang?: string;
  className?: string;
  /** Hide the language label (useful when the block is the only one on screen). */
  hideLang?: boolean;
}

export function DocsCodeBlock({
  code,
  lang = 'bash',
  className = '',
  hideLang = false,
}: DocsCodeBlockProps): React.ReactElement {
  return (
    <div className={`rounded-xl overflow-hidden border border-[#262413] ${className}`}>
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#1e1c10] border-b border-[#262413]">
        {!hideLang && (
          <span className="text-xs font-mono text-[#8a886a] uppercase tracking-wider">{lang}</span>
        )}
        <div className={hideLang ? 'ml-auto' : ''}>
          <CopyButton text={code} />
        </div>
      </div>
      <pre className="p-5 text-xs sm:text-sm font-mono text-[#c9d1d9] overflow-x-auto leading-relaxed whitespace-pre" style={{ background: '#13120d' }}>
        {code}
      </pre>
    </div>
  );
}

export default DocsCodeBlock;