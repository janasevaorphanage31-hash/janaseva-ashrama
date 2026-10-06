import "server-only";
import { db } from "@/db";
import { auditLogs } from "@/db/schema";

export async function writeAudit(input: {
  actorAdminUserId?: number | null;
  action: string;
  entity: string;
  entityId?: string | number | null;
  beforeState?: unknown;
  afterState?: unknown;
  ipAddress?: string | null;
}) {
  await db.insert(auditLogs).values({
    actorAdminUserId: input.actorAdminUserId ?? null,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId == null ? null : String(input.entityId),
    beforeState: input.beforeState ?? null,
    afterState: input.afterState ?? null,
    ipAddress: input.ipAddress ?? null,
  });
}
