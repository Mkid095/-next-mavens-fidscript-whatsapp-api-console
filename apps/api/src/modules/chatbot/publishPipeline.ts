/**
 * Chatbot Publish Pipeline
 *
 * Async pipeline that runs after a publish request is accepted.
 * Each step updates the job row so the frontend can poll for progress.
 *
 * Run via Promise.resolve().then() — does not block the HTTP response.
 */
import db from '../../database.js';
import { validatePublish } from './validation/index.js';
import type { ChatbotDraft, PublishJob } from '../../types/chatbotDraft.js';
import { saveDatabase } from '../../database.js';
import { publishJobEmitter } from '../../utils/publishJobEmitter.js';
import { setRuntimeConfig } from './chatbotRuntimeCache.js';

type JobStatus = PublishJob['status'];

interface PipelineStep {
  status: JobStatus;
  progress: number;
  currentStep: string;
  message: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  { status: 'building',   progress: 10,  currentStep: 'validate',       message: 'Validating configuration…'          },
  { status: 'building',   progress: 20,  currentStep: 'save-config',   message: 'Saving chatbot configuration…'        },
  { status: 'indexing',   progress: 35,  currentStep: 'index-knowledge', message: 'Indexing knowledge sources…'       },
  { status: 'building',   progress: 50,  currentStep: 'build-prompt',  message: 'Building compiled system prompt…'    },
  { status: 'compiling',  progress: 65,  currentStep: 'compile-tools', message: 'Compiling tools…'                  },
  { status: 'compiling',  progress: 75,  currentStep: 'save-version',  message: 'Saving version snapshot…'           },
  { status: 'activating', progress: 88,  currentStep: 'enable-triggers', message: 'Activating triggers…'              },
  { status: 'done',       progress: 100, currentStep: 'complete',     message: 'Chatbot is live!'                  },
];

function updateJob(
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
    step.status,
    step.progress,
    step.currentStep,
    step.message,
    extra?.error ?? null,
    extra?.result_json ?? null,
    workerId ?? null,
    jobId
  );
  saveDatabase();

  // Emit SSE update so connected frontends get real-time progress
  const row = db.prepare('SELECT * FROM chatbot_publish_jobs WHERE id = ?').get(jobId) as PublishJob | undefined;
  if (row) {
    publishJobEmitter.emit('jobUpdated', jobId, row);
  }
}

function failJob(jobId: string, error: string): void {
  updateJob(jobId, {
    status: 'failed',
    progress: 0,
    currentStep: 'error',
    message: error,
  }, { error });
}

function buildCompiledPrompt(draft: ChatbotDraft): string {
  const { systemPrompt, model, provider, hallucinationPolicy } = draft.aiBrain;
  const { sources } = draft.knowledge;

  const knowledgeList = sources
    .filter(s => s.status === 'active')
    .map(s => `- [${s.name}] (${s.type}): ${s.ref || s.content.slice(0, 100)}`)
    .join('\n');

  const memoryEnabled = (draft.aiBrain.memorySettings ?? [])
    .filter(m => m.enabled)
    .map(m => m.label);

  const parts: string[] = [
    `You are an AI assistant powered by ${provider}/${model}.`,
    systemPrompt ? `---\nSystem Instructions:\n${systemPrompt}\n---` : '',
    knowledgeList ? `---\nKnowledge Base:\n${knowledgeList}\n---` : '',
    `Hallucination Policy: ${hallucinationPolicy ?? 'balanced'}.`,
    memoryEnabled.length > 0 ? `Active Memory: ${memoryEnabled.join(', ')}.` : '',
  ].filter(Boolean);

  return parts.join('\n\n');
}

function buildCompiledCapabilities(draft: ChatbotDraft): Record<string, boolean> {
  return {
    memory:        (draft.aiBrain.memorySettings ?? []).some(m => m.enabled),
    knowledge:     draft.knowledge.sources.some(s => s.status === 'active'),
    tools:         draft.tools.tools.some(t => t.enabled),
    datasets:      draft.dataConnections.connections.some(c => c.status === 'connected'),
    handoff:       (draft.handoff.triggers ?? []).length > 0,
  };
}

export async function runPublishPipeline(
  chatbotId: string,
  workspaceId: string,
  draft: ChatbotDraft,
  jobId: string
): Promise<void> {
  Promise.resolve().then(async () => {
    // Stable worker ID for this pipeline run (used for heartbeat tracking)
    const workerId = `worker_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    try {
      // Step 1: Validate
      updateJob(jobId, PIPELINE_STEPS[0], undefined, workerId);
      const validation = validatePublish(draft);
      if (!validation.valid) {
        const msg = validation.errors.map(e => e.message).join('; ');
        failJob(jobId, `Validation failed: ${msg}`);
        return;
      }

      // Step 2: Save full config to chatbot_configs.config_json
      updateJob(jobId, PIPELINE_STEPS[1], undefined, workerId);
      const configJson = JSON.stringify({
        template: draft.general.template,
        audience: draft.audience,
        aiBrain: draft.aiBrain,
        knowledge: draft.knowledge,
        dataConnections: draft.dataConnections,
        tools: draft.tools,
        groups: draft.groups,
        handoff: draft.handoff,
      });
      db.prepare(`UPDATE chatbot_configs SET config_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .run(configJson, chatbotId);

      // Step 3: Index knowledge sources (mark as active, bump index version)
      updateJob(jobId, PIPELINE_STEPS[2], undefined, workerId);
      const { sources } = draft.knowledge;

      // Get current active version and bump it — all sources indexed in this publish
      // share the same version, ensuring atomic switch to the new knowledge base
      const currentActiveVer = db.prepare(
        'SELECT active_index_version FROM chatbot_configs WHERE id = ?'
      ).get(chatbotId) as { active_index_version: number | null } | undefined;
      const newActiveVersion = (currentActiveVer?.active_index_version ?? 0) + 1;

      for (const src of sources) {
        if (src.status === 'indexing') {
          try {
            db.prepare(`UPDATE chatbot_knowledge
              SET status = 'active', index_version = ?, updated_at = CURRENT_TIMESTAMP
              WHERE chatbot_id = ? AND name = ?`)
              .run(newActiveVersion, chatbotId, src.name);
          } catch (_) {
            // Source may not exist in DB yet — that's ok for new bots
          }
        }
      }

      // Atomically switch the chatbot to the new knowledge index version
      db.prepare(`UPDATE chatbot_configs
        SET active_index_version = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`).run(newActiveVersion, chatbotId);

      // Step 4: Build compiled prompt (uses newActiveVersion for knowledge filtering)
      updateJob(jobId, PIPELINE_STEPS[3], undefined, workerId);
      const compiledPrompt = buildCompiledPrompt(draft);

      // Step 5: Compile tools
      updateJob(jobId, PIPELINE_STEPS[4], undefined, workerId);
      const compiledTools = JSON.stringify(
        draft.tools.tools.filter(t => t.enabled).map(t => ({
          id: t.id,
          name: t.name,
          type: t.type,
          config: t.config,
        }))
      );

      // Step 6: Save version snapshot
      updateJob(jobId, PIPELINE_STEPS[5], undefined, workerId);
      const compiledCapabilities = JSON.stringify(buildCompiledCapabilities(draft));

      // Get next version number
      const latestVersion = db.prepare(
        'SELECT MAX(version) as mv FROM chatbot_versions WHERE chatbot_id = ?'
      ).get(chatbotId) as { mv: number | null } | undefined;
      const nextVersion = (latestVersion?.mv ?? 0) + 1;

      const snapshotId = `ver_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const changeSummary = `Published v${nextVersion}`;

      db.prepare(`INSERT INTO chatbot_versions
        (id, chatbot_id, version, config_snapshot_json, compiled_prompt, compiled_tools, compiled_capabilities, is_published, published_at, published_by, change_summary)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, ?, ?)`
      ).run(
        snapshotId,
        chatbotId,
        nextVersion,
        configJson,
        compiledPrompt,
        compiledTools,
        compiledCapabilities,
        workspaceId,
        changeSummary
      );

      // Step 6b: Populate write-through runtime cache so the worker doesn't hit
      // chatbot_versions on every message — the cache is the fast path; versions are fallback
      setRuntimeConfig(chatbotId, {
        compiledPrompt,
        compiledTools,
        compiledCaps: compiledCapabilities,
        compiledVersion: nextVersion,
      });

      // Step 7: Enable triggers
      updateJob(jobId, PIPELINE_STEPS[6], undefined, workerId);
      db.prepare(`UPDATE chatbot_triggers SET enabled = 1 WHERE chatbot_id = ?`)
        .run(chatbotId);

      // Step 8: Enable the chatbot
      updateJob(jobId, PIPELINE_STEPS[7], {
        result_json: JSON.stringify({ version: nextVersion, snapshotId }),
      }, workerId);
      db.prepare(`UPDATE chatbot_configs SET enabled = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .run(chatbotId);

    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failJob(jobId, `Pipeline error: ${message}`);
    }
  });
}
