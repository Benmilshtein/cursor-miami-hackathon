import { db } from "@/db";
import { creditAuditLog } from "@/db/schema/partners";

export async function logCreditAudit(
  creditPoolId: number,
  actorUserId: string,
  action: string,
  details?: Record<string, unknown>,
) {
  await db.insert(creditAuditLog).values({
    creditPoolId,
    actorUserId,
    action,
    details: details ? JSON.stringify(details) : null,
  });
}
