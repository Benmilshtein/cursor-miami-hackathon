import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { team } from "@/db/schema/auth";
import { pitchScore } from "@/db/schema/scoring";
import { AppError } from "@/lib/api/http";
import { notifyRankingUpdate } from "@/lib/scoring/events";
import { compareBuildScore } from "@/lib/scoring/placement";
import { getRanking, type RankedTeam } from "@/lib/scoring/service";

/**
 * Step 3 roster management: who gets on stage to pitch.
 *
 * Selection is a plain flag on `team`, not a separate table - a team is either in
 * the finals or it isn't, and there is only ever one finals.
 */

export type FinalistRow = {
  teamId: number;
  teamName: string;
  /** Overnight build score that earned the spot. */
  totalAvg: number;
  pitchAvg: number;
  pitchJudgeCount: number;
};

function toFinalistRow(r: RankedTeam): FinalistRow {
  return {
    teamId: r.teamId,
    teamName: r.teamName,
    totalAvg: r.totalAvg,
    pitchAvg: r.pitchAvg,
    pitchJudgeCount: r.pitchJudgeCount,
  };
}

export async function listFinalists(): Promise<FinalistRow[]> {
  const ranking = await getRanking();
  return ranking.filter((r) => r.isFinalist).map(toFinalistRow);
}

/** The full ranked field, so admin can add a team the auto-selection missed. */
export async function listRankingForFinalistPicker(): Promise<
  Array<FinalistRow & { isFinalist: boolean }>
> {
  const ranking = await getRanking();
  return ranking.map((r) => ({ ...toFinalistRow(r), isFinalist: r.isFinalist }));
}

/**
 * Promote the top `n` teams by build score. Clears the existing roster first, so
 * re-running is idempotent rather than additive. Both writes share a transaction:
 * a failure halfway would otherwise leave the event with no finalists at all.
 */
export async function selectTopFinalists(n: number): Promise<FinalistRow[]> {
  if (!Number.isInteger(n) || n < 1 || n > 50) {
    throw new AppError(400, "INVALID_INPUT", "Finalist count must be between 1 and 50.");
  }

  // Read the ranking outside the transaction - it is a read-only aggregate and
  // getRanking() opens its own connections.
  //
  // Re-sort by build score rather than trusting getRanking()'s order: that order
  // already floats the CURRENT finalists to the top, so reusing it would just
  // re-pick whoever is already selected instead of the actual top N.
  const ranking = await getRanking();
  const topIds = [...ranking].sort(compareBuildScore).slice(0, n).map((r) => r.teamId);

  await db.transaction(async (tx) => {
    await tx
      .update(team)
      .set({ isFinalist: false, updatedAt: new Date() })
      .where(eq(team.isFinalist, true));

    if (topIds.length > 0) {
      await tx
        .update(team)
        .set({ isFinalist: true, updatedAt: new Date() })
        .where(inArray(team.id, topIds));
    }
  });

  notifyRankingUpdate();
  return listFinalists();
}

/** Add or remove one team from the finals roster. */
export async function setTeamFinalist(
  teamId: number,
  isFinalist: boolean,
): Promise<void> {
  const [existing] = await db
    .select({ id: team.id })
    .from(team)
    .where(eq(team.id, teamId))
    .limit(1);

  if (!existing) {
    throw new AppError(404, "TEAM_NOT_FOUND", "Team not found.");
  }

  await db
    .update(team)
    .set({ isFinalist, updatedAt: new Date() })
    .where(eq(team.id, teamId));

  notifyRankingUpdate();
}

/** Guard for the pitch-scoring route: only finalists are pitched. */
export async function assertIsFinalist(teamId: number): Promise<void> {
  const [row] = await db
    .select({ isFinalist: team.isFinalist })
    .from(team)
    .where(eq(team.id, teamId))
    .limit(1);

  if (!row) {
    throw new AppError(404, "NOT_FOUND", "Team not found.");
  }
  if (!row.isFinalist) {
    throw new AppError(
      400,
      "NOT_A_FINALIST",
      "This team is not in the finals, so it has no pitch to score.",
    );
  }
}

/** How many judges have scored at least one pitch (admin progress display). */
export async function getPitchJudgeCount(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(distinct ${pitchScore.judgeUserId})::int` })
    .from(pitchScore);
  return row?.count ?? 0;
}
