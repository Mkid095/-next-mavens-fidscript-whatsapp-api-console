/**
 * Chatbot Publish Pipeline — helpers and constants.
 * Pipeline step definitions, job update/fail helpers, prompt/capabilities builders.
 */
import db, { saveDatabase } from '../../database.js';
import type { ChatbotDraft, PublishJob } from '../../types/chatbotDraft.js';
import { publishJobEmitter } from '../../utils/publishJobEmitter.js';

type JobStatus = PublishJob['status'];

export interface PipelineStep {
  status: JobStatus;
  progress: number;
  currentStep: string;
  message: string;
}

export const PIPELINE_STEPS: PipelineStep[] = [
  { status: 'building',    progress: 10,  currentStep: 'validate',        message: 'Validating configuration…'         },
  { status: 'building',    progress: 20,  currentStep: 'save-config',    message: 'Saving chatbot configuration…'     },
  { status: 'indexing',    progress: 35,  currentStep: 'index-knowledge', message: 'Indexing knowledge sources…'      },
  { status: 'building',    progress: 50,  currentStep: 'build-prompt',   message: 'Building compiled system prompt…' },
  { status: 'compiling',  progress: 65,  currentStep: 'compile-tools',   message: 'Compiling tools…'                },
  { status: 'compiling',  progress: 75,  currentStep: 'save-version',    message: 'Saving version snapshot…'          },
  { status: 'activating', progress: 88,  currentStep: 'enable-triggers',message: 'Activating triggers…'             },
  { status: 'done',       progress: 100, currentStep: 'complete',      message: 'Chatbot is live!'                },
];

export function updateJob(
  jobId: string,
  step: PipelineStep,
  extra?: { error?: string; result_json?: string },
  workerId?: string
): void {
  db.prepare(`UPDATE chatbot_publish_jobs SET
    status = ?,
    progress = ?,
    current_step = ?,
    message = ?,
    error = COALESCE(?, error),
    result_json = COALESCE(?, result_json),
    last_heartbeat_at = CURRENT_TIMESTAMP,
    worker_id = COALESCE(?, worker_id),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = ?`
  ).run(
    step.status, step.progress, step.currentStep, step.message,
    extra?.error ?? null, extra?.result_json ?? null,
    workerId ?? null, jobId
  );
  saveDatabase();

  const row = db.prepare('SELECT * FROM chatbot_publish_jobs WHERE id = ?').get(jobId) as PublishJob | undefined;
  if (row) {
    publishJobEmitter.emit('jobUpdated', jobId, row);
  }
}

export function failJob(jobId: string, error: string): void {
  updateJob(jobId, {
    status: 'failed',
    progress: 0,
    currentStep: 'error',
    message: error,
  }, { error });
}

export function buildCompiledPrompt(draft: ChatbotDraft): string {
  const { systemPrompt, model, provider, hallucinationPolicy } = draft.aiBrain;
  const { sources } = draft.knowledge;

  const knowledgeList = sources
    .filter(s => s.status === 'active')
    .map(s => `- [${s.name}] (${s.type}): ${s.ref || s.content.slice(0, 100)}`)
    .join('\n');

  const memoryEnabled = (draft.aiBrain.memorySettings ?? [])
    .filter(m => m.enabled)
    .map(m => m.label);

  return [
    `You are an AI assistant powered by ${provider}/${model}.`,
    systemPrompt ? `---\nSystem Instructions:\n${systemPrompt}\n---` : '',
    knowledgeList ? `---\nKnowledge Base:\n${knowledgeList}\n---` : '',
    `Hallucination Policy: ${hallucinationPolicy ?? 'balanced'}.`,
    memoryEnabled.length > 0 ? `Active Memory: ${memoryEnabled.join(', ')}.` : '',
  ].filter(Boolean).join('\n\n');
}

export function buildCompiledCapabilities(draft: ChatbotDraft): Record<string, boolean> {
  return {
    memory:   (draft.aiBrain.memorySettings ?? []).some(m => m.enabled),
    knowledge: draft.knowledge.sources.some(s => s.status === 'active'),
    tools:    draft.tools.tools.some(t => t.enabled),
    datasets: draft.dataConnections.connections.some(c => c.status === 'connected'),
    handoff:  (draft.handoff.triggers ?? []).length > 0,
  };
}
