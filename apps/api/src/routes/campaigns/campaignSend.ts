import { Router, Request, Response } from 'express';
import db from '../../database.js';
import { clientJwtAuth } from '../../middleware/auth.js';
import { emitDashboardRefresh } from '../../utils/dashboardEmitter.js';
import { dispatchCampaignMessage, emitCampaignStarted, emitCampaignCompleted, type CampaignMessageKind } from '../../modules/campaigns/index.js';
import { getInstanceForClient } from '../../services/whatsapp/shared.js';
import { SendPacer, getSendThroughputMps } from '../../services/whatsapp/sendThroughput.js';
import { getOutboundUsage, newInitiationsInBatch } from '../../services/whatsapp/outboundUsage.js';
import { getCost } from '../../services/pricingService.js';

// =============================================================================
// Phase 5 Slice A — Campaign send handler.
// POST /:id/send routes through modules/campaigns/dispatch.ts which calls the
// SHARED /api/v1 senders (sendText/sendMedia/sendLocation/sendContact). 1:1
// chat and campaigns never drift. Per-recipient idempotency. Failed sends
// refund automatically. message.sent event fires per send.
//
// Upfront token deduction is replaced with a pre-flight balance check; the
// shared senders charge per-send so a campaign with 90/100 failures only costs
// 10 sends' worth of tokens.
// =============================================================================

const router = Router();

function tokenCostFor(kind: CampaignMessageKind): number {
  const actionMap: Record<CampaignMessageKind, string> = {
    text:    'whatsapp.text',
    media:   'whatsapp.media',
    location:'whatsapp.location',
    contact: 'whatsapp.contact',
  };
  return getCost(actionMap[kind] ?? 'whatsapp.text');
}

router.post('/send', clientJwtAuth, async (req: Request, res: Response) => {
  try {
    const campaign = db.prepare(
      'SELECT * FROM campaigns WHERE id = ? AND client_id = ?'
    ).get(req.params.id, req.client!.id) as { id: string; instance_name: string; message_type: string; content: string | null; media_url: string | null; caption: string | null; status: string } | undefined;
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }
    if (campaign.status === 'sending' || campaign.status === 'completed') {
      return res.status(400).json({ success: false, error: 'Campaign already sent or sending' });
    }

    const instance = getInstanceForClient(campaign.instance_name, req.client!.id);
    if (!instance) {
      return res.status(400).json({ success: false, error: 'Instance not found' });
    }
    if (instance.status !== 'connected') {
      return res.status(400).json({ success: false, error: 'Instance is not connected' });
    }

    const recipients = (db.prepare(
      'SELECT * FROM campaign_recipients WHERE campaign_id = ? ORDER BY created_at ASC'
    ).all(req.params.id) as unknown as { id: string; phone: string }[]);

    if (recipients.length === 0) {
      return res.status(400).json({ success: false, error: 'No recipients' });
    }

    const kind = (campaign.message_type as CampaignMessageKind) || 'text';
    const perSendCost = tokenCostFor(kind);
    const totalCost = perSendCost * recipients.length;
    const client = db.prepare('SELECT token_balance FROM clients WHERE id = ?').get(req.client!.id) as { token_balance: number };
    if (!client || client.token_balance < perSendCost) {
      return res.status(402).json({ success: false, error: `Insufficient tokens. Need at least ${perSendCost}, have ${client?.token_balance ?? 0}` });
    }

    db.prepare("UPDATE campaigns SET status = 'sending', started_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.id);
    db.prepare("UPDATE campaign_recipients SET status = 'queued' WHERE campaign_id = ?").run(req.params.id);

    const ctx = { instance: { ...instance, client_id: req.client!.id }, client: req.client!, req };

    emitCampaignStarted(
      { workspaceId: req.client!.id, actorUserId: req.client!.id, roleId: 'role_0', perms: ['*'] },
      { campaignId: campaign.id, stats: { totalRecipients: recipients.length } }
    ).catch(err => console.error('[campaigns] emit started failed:', err));

    const sendAll = async () => {
      let sentCount = 0;
      let failedCount = 0;
      let skippedTierLimit = 0;
      const now = new Date().toISOString();

      // Compute throughput from queue size + volume headroom against the
      // tier limit so we drain large queues fast (30 MPS) without exceeding
      // WhatsApp's unique-customer-per-day cap.
      const usage = getOutboundUsage(instance.id, req.client!.id);
      const candidatePhones = recipients.map((r) => r.phone);
      const wouldBeNew = newInitiationsInBatch(instance.id, req.client!.id, candidatePhones);
      const remainingTierHeadroom = usage.tier === 4
        ? Number.POSITIVE_INFINITY
        : Math.max(0, usage.tierLimit - usage.uniqueInitiationsToday);
      const safeNew = Math.min(wouldBeNew, remainingTierHeadroom);

      const mps = getSendThroughputMps(recipients.length);
      const pacer = new SendPacer(mps);
      console.log(`[campaigns] ${campaign.id}: queue=${recipients.length} new=${wouldBeNew} safeNew=${safeNew} tier=${usage.tier} mps=${mps}`);

      let newSentSoFar = 0;
      for (const recipient of recipients) {
        // Volume gate: if this recipient would be a NEW initiation and we've
        // hit the daily tier headroom, skip it. Already-initiated contacts
        // still get through (they don't count toward the daily unique cap).
        const isNewInitiation = !db.prepare(`
          SELECT 1 FROM inbox_messages
          WHERE instance_id = ? AND chat_id = ? AND direction = 'outgoing'
            AND timestamp >= datetime('now', '-24 hours')
          LIMIT 1
        `).get(String(instance.id), recipient.phone);

        if (isNewInitiation && newSentSoFar >= safeNew) {
          db.prepare("UPDATE campaign_recipients SET status = 'skipped_tier_limit', error_message = ? WHERE id = ?")
            .run(`Daily tier-${usage.tier} unique-customer limit (${usage.tierLimit}) reached`, recipient.id);
          skippedTierLimit++;
          continue;
        }

        const result = await dispatchCampaignMessage(ctx, {
          recipientId: recipient.id,
          to: recipient.phone,
          kind,
          text: campaign.content || undefined,
          mediaUrl: campaign.media_url || undefined,
          caption: campaign.caption || undefined,
        });
        if (result.ok) {
          db.prepare("UPDATE campaign_recipients SET status = 'sent', sent_at = ?, error_message = NULL WHERE id = ?")
            .run(now, recipient.id);
          sentCount++;
          if (isNewInitiation) newSentSoFar++;
        } else {
          db.prepare("UPDATE campaign_recipients SET status = 'failed', failed_at = ?, error_message = ? WHERE id = ?")
            .run(now, result.error || 'unknown', recipient.id);
          failedCount++;
        }
        // Dynamic throughput: 10 MPS normally, 30 MPS for queues ≥ 5000.
        await pacer.waitForSlot();
      }

      db.prepare(`
        UPDATE campaigns
        SET status = 'completed', completed_at = ?, sent_count = ?, delivered_count = ?, failed_count = ?, updated_at = ?
        WHERE id = ?
      `).run(now, sentCount, sentCount, failedCount, now, campaign.id);

      emitCampaignCompleted(
        { workspaceId: req.client!.id, actorUserId: req.client!.id, roleId: 'role_0', perms: ['*'] },
        { campaignId: campaign.id, stats: { sent: sentCount, delivered: sentCount, failed: failedCount } }
      ).catch(err => console.error('[campaigns] emit completed failed:', err));

      emitDashboardRefresh(req.client!.id);
    };

    sendAll().catch(err => console.error('[campaigns] sendAll failed:', err));

    res.json({
      success: true,
      data: {
        campaign_id: campaign.id,
        recipients: recipients.length,
        estimated_tokens: totalCost,
        mode: 'per_send_charged',
        throughput_mps: getSendThroughputMps(recipients.length),
        tier: getOutboundUsage(instance.id, req.client!.id).tier,
        would_be_new_initiations: newInitiationsInBatch(instance.id, req.client!.id, recipients.map((r) => r.phone)),
      },
    });
  } catch (err: unknown) {
    res.status(500).json({ success: false, error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
