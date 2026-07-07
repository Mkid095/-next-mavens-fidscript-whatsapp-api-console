/**
 * Chatbot Publish Pipeline — implementation.
 * Orchestrates all pipeline stages in sequence.
 */
import db from '../../database.js';
import { validatePublish } from './validation/index.js';
import type { ChatbotDraft } from '../../types/chatbotDraft.js';
import { publishJobEmitter } from '../../utils/publishJobEmitter.js';
import { setRuntimeConfig } from './chatbotRuntimeCache.js';
import { PIPELINE_STEPS, updateJob, failJob } from './publishPipelineStages.js';

export async function runPublishPipelineImpl(
  chatbotId: string,
  workspaceId: string,
  draft: ChatbotDraft,
  jobId: string
): Promise<void> {
  const workerId = `worker_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    // Step 1: Validate
    updateJob(jobId, PIPELINE_STEPS[0], undefined, workerId);
    const validation = validatePublish(draft);
    if (!validation.valid) {
      failJob(jobId, `Validation failed: ${validation.errors.map(e => e.message).join('; ')}`);
      return;
    }

    // Step 2: Save full config
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

    // Step 2b: Sync AI config
    try {
      const aiCfg = draft.aiBrain;
      const connId = aiCfg.llmConnectionId || null;
      let resolvedProvider = aiCfg.provider || 'fidscript';

      if (aiCfg.provider === 'fidscript' && connId) {
        const reg = db.prepare(
          'SELECT provider_type FROM llm_provider_registry WHERE id = ? AND is_shared = 1 AND enabled = 1'
        ).get(connId) as { provider_type: string } | undefined;
        if (reg) resolvedProvider = reg.provider_type;
      }

      db.prepare(`
        UPDATE chatbot_ai_configs
        SET provider = ?, model = ?, llm_connection_id = ?, system_prompt = ?, updated_at = CURRENT_TIMESTAMP
        WHERE chatbot_id = ?
      `).run(resolvedProvider, aiCfg.model || '', connId, aiCfg.systemPrompt || '', chatbotId);
    } catch (e) {
      console.warn(`[publishPipeline] Failed to sync chatbot_ai_configs: ${String(e)}`);
    }

    // Step 3: Index knowledge sources
    updateJob(jobId, PIPELINE_STEPS[2], undefined, workerId);
    const { sources } = draft.knowledge;

    const currentActiveVer = db.prepare(
      'SELECT active_index_version FROM chatbot_configs WHERE id = ?'
    ).get(chatbotId) as { active_index_version: number | null } | undefined;
    const newActiveVersion = (currentActiveVer?.active_index_version ?? 0) + 1;

    for (const src of sources) {
      if (src.status === 'indexing') {
        try {
          db.prepare(`UPDATE chatbot_knowledge SET status = 'active', index_version = ?, updated_at = CURRENT_TIMESTAMP WHERE chatbot_id = ? AND name = ?`)
            .run(newActiveVersion, chatbotId, src.name);
        } catch (_) { /* source may not exist in DB yet */ }
      }
    }

    db.prepare(`UPDATE chatbot_configs SET active_index_version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .run(newActiveVersion, chatbotId);

    // Step 4: Build compiled prompt (imported from pipelineStages)
    const { buildCompiledPrompt, buildCompiledCapabilities } = await import('./publishPipelineStages.js');
    updateJob(jobId, PIPELINE_STEPS[3], undefined, workerId);
    const compiledPrompt = buildCompiledPrompt(draft);

    // Step 5: Compile tools
    updateJob(jobId, PIPELINE_STEPS[4], undefined, workerId);
    const compiledTools = JSON.stringify(
      draft.tools.tools.filter(t => t.enabled).map(t => ({
        id: t.id, name: t.name, type: t.type, config: t.config,
      }))
    );

    // Step 6: Save version snapshot
    updateJob(jobId, PIPELINE_STEPS[5], undefined, workerId);
    const compiledCapabilities = JSON.stringify(buildCompiledCapabilities(draft));

    const latestVersion = db.prepare(
      'SELECT MAX(version) as mv FROM chatbot_versions WHERE chatbot_id = ?'
    ).get(chatbotId) as { mv: number | null } | undefined;
    const nextVersion = (latestVersion?.mv ?? 0) + 1;

    const snapshotId = `ver_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db.prepare(`INSERT INTO chatbot_versions
      (id, chatbot_id, version, config_snapshot_json, compiled_prompt, compiled_tools, compiled_capabilities, is_published, published_at, published_by, change_summary)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP, ?, ?)`
    ).run(snapshotId, chatbotId, nextVersion, configJson, compiledPrompt, compiledTools, compiledCapabilities, workspaceId, `Published v${nextVersion}`);

    // Step 6b: Populate runtime cache
    setRuntimeConfig(chatbotId, { compiledPrompt, compiledTools, compiledCaps: compiledCapabilities, compiledVersion: nextVersion });

    // Step 7: Enable triggers
    updateJob(jobId, PIPELINE_STEPS[6], undefined, workerId);
    db.prepare(`UPDATE chatbot_triggers SET enabled = 1 WHERE chatbot_id = ?`).run(chatbotId);

    const triggerCount = db.prepare(
      `SELECT COUNT(*) as cnt FROM chatbot_triggers WHERE chatbot_id = ?`
    ).get(chatbotId) as { cnt: number };
    if (triggerCount.cnt === 0) {
      db.prepare(`INSERT INTO chatbot_triggers (id, chatbot_id, trigger_type, trigger_value, enabled, priority) VALUES (?, ?, 'always', '', 1, 0)`)
        .run(`trg_${chatbotId}_always_${Date.now()}`, chatbotId);
    }

    // Step 8: Enable the chatbot
    updateJob(jobId, PIPELINE_STEPS[7], { result_json: JSON.stringify({ version: nextVersion, snapshotId }) }, workerId);
    db.prepare(`UPDATE chatbot_configs SET enabled = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(chatbotId);

  } catch (err) {
    failJob(jobId, `Pipeline error: ${err instanceof Error ? err.message : String(err)}`);
  }
}
