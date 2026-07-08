import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";

/** Any participant is eligible (no screening / team requirement for this hackathon). */
export async function getEligibleParticipantUserIds(): Promise<string[]> {
  const rows = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.role, "participant"));
  return rows.map((r) => r.id);
}

/** Eligible participants with email, for building the bulk-upload template. */
export async function getEligibleParticipants(): Promise<
  { id: string; email: string }[]
> {
  return db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(eq(user.role, "participant"));
}

/** Participant members of the given teams (role = participant). */
export async function getParticipantUserIdsForTeams(
  teamIds: number[],
): Promise<string[]> {
  if (teamIds.length === 0) return [];
  const rows = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.role, "participant"), inArray(user.teamId, teamIds)));
  return rows.map((r) => r.id);
}

/** Of the given user ids, the ones that are participants. */
export async function getParticipantsByIds(userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return [];
  const rows = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.role, "participant"), inArray(user.id, userIds)));
  return rows.map((r) => r.id);
}

export async function isUserEligibleForCredits(userId: string): Promise<boolean> {
  const rows = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.id, userId), eq(user.role, "participant")))
    .limit(1);
  return rows.length > 0;
}
