import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { eq } from "drizzle-orm";

/**
 * Load participant record by auth user id. Use after OAuth callback to get
 * or create platform user. New users are created by Better Auth; we only
 * read or enrich here. Extension point: create team, join via code, set lead.
 */
export async function getParticipantByUserId(authUserId: string) {
  const [participant] = await db
    .select()
    .from(user)
    .where(eq(user.id, authUserId))
    .limit(1);
  return participant ?? null;
}

/**
 * Ensure participant has profile fields set. Called from post-login flow
 * when we want to sync firstName/lastName from account or other sources.
 * Extension: validate team membership, assign default team, etc.
 */
export async function updateParticipantProfile(
  authUserId: string,
  data: { firstName?: string | null; lastName?: string | null }
) {
  const [updated] = await db
    .update(user)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(user.id, authUserId))
    .returning();
  return updated ?? null;
}
