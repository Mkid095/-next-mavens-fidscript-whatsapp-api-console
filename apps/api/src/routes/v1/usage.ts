import { Router, Request, Response } from 'express';
import db from '../../database.js';

/**
 * GET /api/v1/usage - aggregate API usage for the authenticated client.
 * Backed by api_logs (requests + failures) and token_transactions (sends + spend).
 * Coverage grows as management ops begin logging in later phases.
 */
const router = Router();

const count = (sql: string, clientId: string): number =>
  (db.prepare(sql).get(clientId) as { c: number } | undefined)?.c ?? 0;

router.get('/', (req: Request, res: Response) => {
  const id = req.client!.id;
  const data = {
    requestsToday: count(`SELECT COUNT(*) c FROM api_logs WHERE client_id=? AND date(timestamp)=date('now')`, id),
    requestsMonth: count(`SELECT COUNT(*) c FROM api_logs WHERE client_id=? AND strftime('%Y-%m',timestamp)=strftime('%Y-%m','now')`, id),
    sendsMonth: count(`SELECT COUNT(*) c FROM token_transactions WHERE client_id=? AND type='sent' AND strftime('%Y-%m',created_at)=strftime('%Y-%m','now')`, id),
    tokenSpendMonth: count(`SELECT COALESCE(SUM(-amount),0) c FROM token_transactions WHERE client_id=? AND type='sent' AND amount<0 AND strftime('%Y-%m',created_at)=strftime('%Y-%m','now')`, id),
    failedRequestsMonth: count(`SELECT COUNT(*) c FROM api_logs WHERE client_id=? AND response_status>=400 AND strftime('%Y-%m',timestamp)=strftime('%Y-%m','now')`, id),
  };
  res.json({ success: true, data });
});

export default router;
