/**
 * sseDashboardStats.ts - dashboard stats SQL + formatting for SSE
 */
import db from '../database.js';

export function buildDashboardPayload(clientId: string): object {
  const today = new Date().toISOString().split('T')[0];

  const todayRow = db.prepare(`
    SELECT COUNT(*) as count FROM inbox_messages
    WHERE client_id = ? AND direction = 'outgoing' AND date(timestamp) = ?
  `).get(clientId, today) as { count: number };

  const dailyVolume = db.prepare(`
    SELECT
      date(timestamp) as date,
      SUM(CASE WHEN direction = 'outgoing' THEN 1 ELSE 0 END) as messages_sent,
      SUM(CASE WHEN direction = 'incoming' THEN 1 ELSE 0 END) as messages_received
    FROM inbox_messages
    WHERE client_id = ? AND timestamp >= datetime('now', '-7 days')
    GROUP BY date(timestamp)
    ORDER BY date ASC
  `).all(clientId) as { date: string; messages_sent: number; messages_received: number }[];

  const recentMessages = db.prepare(`
    SELECT im.id, im.from_number, im.from_name, im.message_type, im.content,
           im.media_url, im.is_read, im.timestamp, im.direction, i.name as instance_name
    FROM inbox_messages im
    JOIN instances i ON im.instance_id = i.id
    WHERE im.client_id = ?
    ORDER BY im.timestamp DESC
    LIMIT 10
  `).all(clientId);

  return {
    messagesToday: todayRow.count,
    dailyVolume: dailyVolume.map(d => ({
      date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      messages_sent: d.messages_sent,
      messages_delivered: d.messages_received,
    })),
    recentMessages,
  };
}
