/**
 * wizardHelpers.ts — TTY prompts and input helpers for the chatbot setup wizard.
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stderr } from 'node:process';
import pc from 'picocolors';

export interface InstanceRow { id: string; name: string; status: string; }
export interface CreateResp { id: string; }
export interface ProviderList { providers: Array<{ name: string; models: string[] }> | unknown; }

export interface WizardDraft {
  name: string; instanceId: string; instanceName: string;
  systemPrompt: string; provider: string; triggerType: string; triggerValue: string;
  confidenceThreshold: number; fallbackReply: string;
  handoffMode: 'auto' | 'always' | 'manual';
}

export interface SetupConfig {
  name: string; instance: string;
  system_prompt?: string; prompt?: string;
  provider?: string; model?: string; llm_connection?: string;
  hallucination_policy?: 'strict' | 'balanced' | 'creative' | 'disabled';
  max_tokens?: number; temperature?: number; top_p?: number; max_history_messages?: number;
  trigger?: { type: 'always' | 'keyword' | 'regex' | 'mention'; value?: string; };
  policies?: { confidence_threshold?: number; fallback_reply?: string; };
  handoff?: 'auto' | 'always' | 'manual';
  publish?: boolean;
}

export function isInteractive(): boolean {
  return Boolean(stdin.isTTY);
}

export async function prompt(question: string, defaultValue = ''): Promise<string> {
  if (!isInteractive()) throw new Error('chatbot setup requires an interactive TTY.');
  const rl = createInterface({ input: stdin, output: stderr });
  try {
    const suffix = defaultValue ? ` [${defaultValue}]` : '';
    const ans = await rl.question(`${pc.cyan(question)}${suffix}: `);
    return (ans.trim() || defaultValue).trim();
  } finally { rl.close(); }
}

export async function promptMultiline(label: string): Promise<string> {
  if (!isInteractive()) throw new Error('multi-line prompt requires TTY');
  const rl = createInterface({ input: stdin, output: stderr });
  console.error(pc.dim(`\n${label}\n(end with a line containing only "EOF")`));
  try {
    const lines: string[] = [];
    while (true) {
      const line = await rl.question(pc.dim('  > '));
      if (line.trim() === 'EOF') break;
      lines.push(line);
    }
    return lines.join('\n').trim();
  } finally { rl.close(); }
}

export async function choose<T extends string>(question: string, options: T[]): Promise<T> {
  console.error('');
  options.forEach((opt, i) => console.error(`  ${pc.cyan(String(i + 1) + ')')} ${opt}`));
  const ans = await prompt(question, '1');
  const idx = Math.max(0, Math.min(options.length - 1, Number(ans) - 1));
  return options[Number.isFinite(idx) ? idx : 0] as T;
}

export async function chooseFromList<T>(
  question: string, list: T[], label: (x: T) => string, defaultIdx = 0,
): Promise<T> {
  if (list.length === 0) throw new Error('No items to choose from');
  console.error('');
  list.forEach((item, i) => console.error(`  ${pc.cyan(String(i + 1) + ')')} ${label(item)}`));
  const ans = await prompt(question, String(defaultIdx + 1));
  const idx = Math.max(0, Math.min(list.length - 1, Number(ans) - 1));
  return list[Number.isFinite(idx) ? idx : 0] as T;
}
