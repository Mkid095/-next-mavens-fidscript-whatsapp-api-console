// Core emit helper used by all dispatch functions.
import { bus } from './bus.js';
import { logDomainEvent } from './log.js';
import type { DomainEventType, DomainEventPayload } from './catalog.js';

export interface DispatchContext {
  workspaceId: string | null;
  actorUserId?: string | null;
  roleId?: string;
  perms?: string[];
}

export async function emit<T extends DomainEventType>(
  type: T,
  payload: DomainEventPayload,
  ctx: DispatchContext
): Promise<void> {
  const enriched = {
    ...(payload as unknown as Record<string, unknown>),
    workspaceId: ctx.workspaceId,
    actorUserId: ctx.actorUserId ?? null,
  } as unknown as DomainEventPayload;

  await bus().emit(type, enriched);
  logDomainEvent(ctx.workspaceId, type, payload, ctx.actorUserId ?? null);
}
