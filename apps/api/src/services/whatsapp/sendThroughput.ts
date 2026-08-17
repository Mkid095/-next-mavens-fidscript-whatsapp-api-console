/**
 * Send throughput pacer for bulk campaigns.
 *
 * The send rate scales with queue depth so large campaigns drain efficiently
 * while staying well under WhatsApp's ~80 MPS per-account limit:
 *
 *   queue <  HIGH_QUEUE_THRESHOLD  →  NORMAL_MPS  (default 10 MPS)
 *   queue >= HIGH_QUEUE_THRESHOLD  →  HIGH_QUEUE_MPS (default 30 MPS)
 *
 * Tunables via env (BULK_NORMAL_MPS / BULK_HIGH_QUEUE_MPS /
 * BULK_HIGH_QUEUE_THRESHOLD) - default 10 / 30 / 5000.
 *
 * The pacer maintains a steady target rate (sleeping as needed between
 * sends) rather than enforcing a fixed per-send delay, which is more
 * accurate under variable send latency.
 */

export function getSendThroughputMps(queueSize: number): number {
  const normal = Number(process.env.BULK_NORMAL_MPS ?? 10);
  const high = Number(process.env.BULK_HIGH_QUEUE_MPS ?? 30);
  const threshold = Number(process.env.BULK_HIGH_QUEUE_THRESHOLD ?? 5000);
  return queueSize >= threshold ? high : normal;
}

export class SendPacer {
  private lastTarget = 0;
  constructor(public mps: number) {}

  setMps(mps: number) {
    if (mps < 0) mps = 0;
    this.mps = mps;
    if (mps === 0) this.lastTarget = 0;
  }

  /** Sleep until the next send slot, then reserve it. Call once per send. */
  async waitForSlot(): Promise<void> {
    if (this.mps <= 0) return;
    const interval = 1000 / this.mps;
    const now = Date.now();
    const target = Math.max(this.lastTarget + interval, now);
    const delay = target - now;
    if (delay > 1) await new Promise((r) => setTimeout(r, delay));
    this.lastTarget = target;
  }
}