/**
 * Tool Circuit Breaker
 *
 * Prevents cascading failures when a tool endpoint goes down.
 *
 * States:
 *   closed  — normal operation, requests pass through
 *   open    — tool is failing, requests are rejected immediately
 *   half-open — after COOL_DOWN_MS, allow one test request through
 *
 * After FAILURE_THRESHOLD failures within the last hour, the circuit opens.
 * After COOL_DOWN_MS, one test request is allowed (half-open).
 * If it succeeds → circuit closes. If it fails → circuit opens again.
 */
import db from '../database.js';

const FAILURE_THRESHOLD = 5;
const COOL_DOWN_MS = 60_000; // 1 minute

type CircuitState = 'closed' | 'open' | 'half-open';

interface Circuit {
  state: CircuitState;
  failures: number;
  lastFailure: number;
  halfOpenAttempted: boolean;
}

const circuits = new Map<string, Circuit>();

export class CircuitOpenError extends Error {
  constructor(toolId: string) {
    super(`Circuit open: tool ${toolId} is temporarily disabled`);
    this.name = 'CircuitOpenError';
  }
}

function getCircuit(toolId: string): Circuit {
  if (!circuits.has(toolId)) {
    circuits.set(toolId, { state: 'closed', failures: 0, lastFailure: 0, halfOpenAttempted: false });
  }
  return circuits.get(toolId)!;
}

/**
 * Returns true if the circuit is open (requests should be rejected).
 */
export function isCircuitOpen(toolId: string): boolean {
  const circuit = getCircuit(toolId);

  if (circuit.state === 'closed') return false;

  if (circuit.state === 'open') {
    // Check cool-down
    if (Date.now() - circuit.lastFailure >= COOL_DOWN_MS) {
      circuit.state = 'half-open';
      circuit.halfOpenAttempted = false;
      return false;
    }
    return true;
  }

  // half-open: allow exactly one request through
  return circuit.halfOpenAttempted;
}

/**
 * Record a successful tool call — reset the circuit.
 */
export function recordSuccess(toolId: string): void {
  const circuit = getCircuit(toolId);
  circuit.failures = 0;
  circuit.state = 'closed';
  circuit.halfOpenAttempted = false;
}

/**
 * Record a failed tool call — increment failures, potentially open circuit.
 */
export function recordFailure(toolId: string): void {
  const circuit = getCircuit(toolId);
  circuit.failures += 1;
  circuit.lastFailure = Date.now();
  circuit.halfOpenAttempted = true;

  if (circuit.failures >= FAILURE_THRESHOLD) {
    circuit.state = 'open';
  }
}

/**
 * Log tool failure to the database for observability.
 */
export function logToolFailure(toolId: string, chatbotId: string, error: string): void {
  try {
    const id = `tf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    db.prepare(`INSERT INTO chatbot_tool_failures (id, tool_id, chatbot_id, error) VALUES (?, ?, ?, ?)`)
      .run(id, toolId, chatbotId, error);
    // Prune old failures (> 1 hour) to keep the table bounded
    db.prepare(`DELETE FROM chatbot_tool_failures WHERE failed_at < datetime('now', '-1 hour')`).run();
  } catch (_) { /* non-fatal */ }
}

/**
 * Execute a tool call with circuit breaker protection.
 * If the circuit is open, throws CircuitOpenError immediately.
 * On failure, records the failure and may open the circuit.
 * On success, resets the circuit.
 */
export async function withCircuitBreak<T>(
  toolId: string,
  chatbotId: string,
  fn: () => Promise<T>
): Promise<T> {
  if (isCircuitOpen(toolId)) {
    throw new CircuitOpenError(toolId);
  }

  try {
    const result = await fn();
    recordSuccess(toolId);
    return result;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    recordFailure(toolId);
    logToolFailure(toolId, chatbotId, errorMsg);
    throw err;
  }
}
