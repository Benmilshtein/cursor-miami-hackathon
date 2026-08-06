import { db } from "@/db";
import { team, user } from "@/db/schema/auth";
import { judgeScore, pitchScore, repoCheck } from "@/db/schema/scoring";
import { project } from "@/db/schema/projects";
import { teamMember } from "@/db/schema/teams";
import { eq, and, sql, asc, inArray, isNull } from "drizzle-orm";
import { AppError } from "@/lib/api/http";
import { notifyRankingUpdate } from "@/lib/scoring/events";
import { EVENT_JUDGE_TARGET } from "@/lib/scoring/constants";
import { comparePlacement } from "@/lib/scoring/placement";

export type ScoreCriteria = {
  innovation: number;
  technicalExecution: number;
  aiUsage: number;
  uxUi: number;
  businessPotential: number;
};

export type RankedTeam = {
  teamId: number;
  teamName: string;
  avgInnovation: number;
  avgTechnicalExecution: number;
  avgAiUsage: number;
  avgUxUi: number;
  avgBusinessPotential: number;
  /** Sum of criterion averages (0–100) before late penalty */
  grossTotalAvg: number;
  /** Final total after subtracting late submission penalty, or manual final score */
  totalAvg: number;
  lateSubmissionPenaltyPoints: number;
  judgeCount: number;
  /** Target judge count for completion (override or global distinct judges) */
  expectedJudgeCount: number;
  judgeCountOverride: number | null;
  /** True when totalAvg comes from super-admin manual override (not computed from judges). */
  usesFinalScoreOverride: boolean;
  /** Stored manual override (null = use average from judges − late penalty). */
  manualScoreOverride: number | null;
  /** Selected for the staged finals (step 3). */
  isFinalist: boolean;
  /** Mean of the finals pitch totals (0–100). 0 when no judge has scored the pitch. */
  pitchAvg: number;
  /** How many judges have scored this team's pitch. */
  pitchJudgeCount: number;
};

export type JudgeScoreRow = ScoreCriteria & {
  id: string;
  teamId: number;
  judgeUserId: string;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function getTotalJudgeCount(): Promise<number> {
  const [row] = await db
    .select({ count: sql<number>`count(distinct ${judgeScore.judgeUserId})::int` })
    .from(judgeScore);
  return row?.count ?? 0;
}

export async function deleteScoresByJudge(judgeUserId: string): Promise<number> {
  const deleted = await db
    .delete(judgeScore)
    .where(eq(judgeScore.judgeUserId, judgeUserId))
    .returning({ id: judgeScore.id });
  return deleted.length;
}

/**
 * Public ranking across all three judging steps:
 * - Build score: average of each judge’s row total (5 criteria, max 100 per judge), minus late penalty.
 * - Optional manual `final_score_override` replaces that computed total for the leaderboard.
 * - Finalists rank above everyone else and are ordered by their finals pitch average.
 *
 * Ordering rules live in `lib/scoring/placement.ts`.
 */
export async function getRanking(): Promise<RankedTeam[]> {
  const rows = await buildRankingRows();
  return rows.sort(comparePlacement);
}

/** One judge’s scores for a team (public leaderboard detail). */
export type PublicJudgeScoreCell = {
  innovation: number;
  technicalExecution: number;
  aiUsage: number;
  uxUi: number;
  businessPotential: number;
  total: number;
};

export type PublicRankingJudgeSlot = {
  displayName: string;
};

/** Published ranking row with per-judge breakdown (same six judge columns as admin). */
export type PublicRankingEntry = {
  teamId: number;
  teamName: string;
  totalAvg: number;
  grossTotalAvg: number;
  lateSubmissionPenaltyPoints: number;
  usesFinalScoreOverride: boolean;
  avgInnovation: number;
  avgTechnicalExecution: number;
  avgAiUsage: number;
  avgUxUi: number;
  avgBusinessPotential: number;
  judgeCount: number;
  judgeScores: (PublicJudgeScoreCell | null)[];
  /** Step 3: selected for the staged finals. */
  isFinalist: boolean;
  /** Mean finals pitch total (0–100); 0 until a judge scores the pitch. */
  pitchAvg: number;
  pitchJudgeCount: number;
};

/**
 * Public ranking with per-judge criteria (first six judges globally, by name).
 */
export async function getPublicRankingDetail(): Promise<{
  ranking: PublicRankingEntry[];
  judgeSlots: (PublicRankingJudgeSlot | null)[];
  criteria: typeof ADMIN_SCORE_CRITERIA;
  totalJudges: number;
}> {
  const [ranking, totalJudges] = await Promise.all([getRanking(), getTotalJudgeCount()]);

  const judgeRows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(judgeScore)
    .innerJoin(user, eq(judgeScore.judgeUserId, user.id))
    .groupBy(user.id, user.name, user.email)
    .orderBy(asc(user.name), asc(user.email))
    .limit(EVENT_JUDGE_TARGET);

  type SlotWithId = { judgeUserId: string; displayName: string } | null;
  const judgeSlotsWithIds: SlotWithId[] = judgeRows.map((j) => ({
    judgeUserId: j.id,
    displayName: (j.name?.trim() ? j.name.trim() : j.email) ?? "Judge",
  }));
  while (judgeSlotsWithIds.length < EVENT_JUDGE_TARGET) {
    judgeSlotsWithIds.push(null);
  }

  const judgeSlots: (PublicRankingJudgeSlot | null)[] = judgeSlotsWithIds.map((s) =>
    s ? { displayName: s.displayName } : null,
  );

  const realJudgeIds = judgeSlotsWithIds
    .filter((s): s is NonNullable<SlotWithId> => s !== null)
    .map((s) => s.judgeUserId);

  const teamIds = ranking.map((r) => r.teamId);

  const scoreRows =
    teamIds.length === 0 || realJudgeIds.length === 0
      ? []
      : await db
          .select({
            teamId: judgeScore.teamId,
            judgeUserId: judgeScore.judgeUserId,
            innovation: judgeScore.innovation,
            technicalExecution: judgeScore.technicalExecution,
            aiUsage: judgeScore.aiUsage,
            uxUi: judgeScore.uxUi,
            businessPotential: judgeScore.businessPotential,
          })
          .from(judgeScore)
          .where(
            and(inArray(judgeScore.teamId, teamIds), inArray(judgeScore.judgeUserId, realJudgeIds)),
          );

  const byTeamJudge = new Map<string, PublicJudgeScoreCell>();
  for (const r of scoreRows) {
    const total =
      r.innovation +
      r.technicalExecution +
      r.aiUsage +
      r.uxUi +
      r.businessPotential;
    byTeamJudge.set(`${r.teamId}:${r.judgeUserId}`, {
      innovation: r.innovation,
      technicalExecution: r.technicalExecution,
      aiUsage: r.aiUsage,
      uxUi: r.uxUi,
      businessPotential: r.businessPotential,
      total,
    });
  }

  const enriched: PublicRankingEntry[] = ranking.map((r) => ({
    teamId: r.teamId,
    teamName: r.teamName,
    isFinalist: r.isFinalist,
    pitchAvg: r.pitchAvg,
    pitchJudgeCount: r.pitchJudgeCount,
    totalAvg: r.totalAvg,
    grossTotalAvg: r.grossTotalAvg,
    lateSubmissionPenaltyPoints: r.lateSubmissionPenaltyPoints,
    usesFinalScoreOverride: r.usesFinalScoreOverride,
    avgInnovation: r.avgInnovation,
    avgTechnicalExecution: r.avgTechnicalExecution,
    avgAiUsage: r.avgAiUsage,
    avgUxUi: r.avgUxUi,
    avgBusinessPotential: r.avgBusinessPotential,
    judgeCount: r.judgeCount,
    judgeScores: judgeSlotsWithIds.map((slot) => {
      if (slot === null) return null;
      return byTeamJudge.get(`${r.teamId}:${slot.judgeUserId}`) ?? null;
    }),
  }));

  return {
    ranking: enriched,
    judgeSlots,
    criteria: ADMIN_SCORE_CRITERIA,
    totalJudges,
  };
}

/** Same math as public ranking; sort by team name (for admin table). */
export async function listAdminOfficialScores(): Promise<RankedTeam[]> {
  const rows = await buildRankingRows();
  return rows.sort((a, b) => a.teamName.localeCompare(b.teamName));
}

export const ADMIN_SCORE_CRITERIA = [
  { key: "innovation" as const, label: "Innovation", shortLabel: "Innov.", max: 25 },
  { key: "technicalExecution" as const, label: "Technical", shortLabel: "Tech.", max: 25 },
  { key: "aiUsage" as const, label: "AI", shortLabel: "AI", max: 20 },
  { key: "uxUi" as const, label: "UX/UI", shortLabel: "UX", max: 15 },
  { key: "businessPotential" as const, label: "Business", shortLabel: "Bus.", max: 15 },
] as const;

export type AdminJudgeColumn = {
  judgeUserId: string;
  displayName: string;
};

/** Per-judge breakdown; sums to `total` (max 100). `scoreId` for PATCH; null cell = no score yet. */
export type AdminTeamJudgeCell = {
  scoreId: string;
  innovation: number;
  technicalExecution: number;
  aiUsage: number;
  uxUi: number;
  businessPotential: number;
  total: number;
} | null;

/** Step-1 requirements at a glance. Null when the check has never been run. */
export type AdminTeamRepoCheck = {
  hasPrd: boolean;
  hasCursorRules: boolean;
  hasAppUrl: boolean;
  onTime: boolean;
} | null;

export type AdminOfficialScoresTeamRow = {
  teamId: number;
  teamName: string;
  judgeCount: number;
  judgeTarget: number;
  averageFromJudges: number;
  lateSubmissionPenaltyPoints: number;
  manualOverride: number | null;
  effectiveTotal: number;
  repoCheck: AdminTeamRepoCheck;
  /** Length = EVENT_JUDGE_TARGET; aligns with `judgeSlots` */
  judgeCells: AdminTeamJudgeCell[];
};

/**
 * Final scores admin: up to six judges (by name), padded with empty slots;
 * per team, per-slot scores for the matrix UI.
 */
export async function getAdminOfficialScoresPageData(): Promise<{
  judgeSlots: (AdminJudgeColumn | null)[];
  criteria: typeof ADMIN_SCORE_CRITERIA;
  teams: AdminOfficialScoresTeamRow[];
}> {
  const base = await listAdminOfficialScores();

  const judgeRows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(judgeScore)
    .innerJoin(user, eq(judgeScore.judgeUserId, user.id))
    .groupBy(user.id, user.name, user.email)
    .orderBy(asc(user.name), asc(user.email))
    .limit(EVENT_JUDGE_TARGET);

  const judgeSlots: (AdminJudgeColumn | null)[] = judgeRows.map((j) => ({
    judgeUserId: j.id,
    displayName: (j.name?.trim() ? j.name.trim() : j.email) ?? j.id,
  }));
  while (judgeSlots.length < EVENT_JUDGE_TARGET) {
    judgeSlots.push(null);
  }

  const realJudgeIds = judgeSlots
    .filter((s): s is AdminJudgeColumn => s !== null)
    .map((s) => s.judgeUserId);

  const approvedTeamIds = base.map((t) => t.teamId);

  const scoreRows =
    approvedTeamIds.length === 0 || realJudgeIds.length === 0
      ? []
      : await db
          .select({
            scoreId: judgeScore.id,
            teamId: judgeScore.teamId,
            judgeUserId: judgeScore.judgeUserId,
            innovation: judgeScore.innovation,
            technicalExecution: judgeScore.technicalExecution,
            aiUsage: judgeScore.aiUsage,
            uxUi: judgeScore.uxUi,
            businessPotential: judgeScore.businessPotential,
          })
          .from(judgeScore)
          .where(
            and(inArray(judgeScore.teamId, approvedTeamIds), inArray(judgeScore.judgeUserId, realJudgeIds)),
          );

  const byTeamJudge = new Map<string, AdminTeamJudgeCell>();
  for (const r of scoreRows) {
    const total =
      r.innovation +
      r.technicalExecution +
      r.aiUsage +
      r.uxUi +
      r.businessPotential;
    byTeamJudge.set(`${r.teamId}:${r.judgeUserId}`, {
      scoreId: r.scoreId,
      innovation: r.innovation,
      technicalExecution: r.technicalExecution,
      aiUsage: r.aiUsage,
      uxUi: r.uxUi,
      businessPotential: r.businessPotential,
      total,
    });
  }

  // Separate query, merged by teamId - never a second leftJoin alongside the
  // judgeScore join, which would cartesian-multiply the build averages.
  const checkRows = await db
    .select({
      teamId: repoCheck.teamId,
      hasPrd: repoCheck.hasPrd,
      hasCursorRules: repoCheck.hasCursorRules,
      hasAppUrl: repoCheck.hasAppUrl,
      onTime: repoCheck.onTime,
    })
    .from(repoCheck);

  const checksByTeam = new Map<number, AdminTeamRepoCheck>(
    checkRows.map((c) => [
      c.teamId,
      {
        hasPrd: c.hasPrd,
        hasCursorRules: c.hasCursorRules,
        hasAppUrl: c.hasAppUrl,
        onTime: c.onTime,
      },
    ]),
  );

  const teams: AdminOfficialScoresTeamRow[] = base.map((r) => ({
    teamId: r.teamId,
    teamName: r.teamName,
    repoCheck: checksByTeam.get(r.teamId) ?? null,
    judgeCount: r.judgeCount,
    judgeTarget: EVENT_JUDGE_TARGET,
    averageFromJudges: r.grossTotalAvg,
    lateSubmissionPenaltyPoints: r.lateSubmissionPenaltyPoints,
    manualOverride: r.manualScoreOverride,
    effectiveTotal: r.totalAvg,
    judgeCells: judgeSlots.map((slot) => {
      if (slot === null) return null;
      return byTeamJudge.get(`${r.teamId}:${slot.judgeUserId}`) ?? null;
    }),
  }));

  return { judgeSlots, criteria: ADMIN_SCORE_CRITERIA, teams };
}

/**
 * Mean pitch total per team, keyed by teamId.
 *
 * Deliberately its own query rather than a second leftJoin on the ranking query:
 * two one-to-many joins under one groupBy multiply each other's rows, which would
 * silently corrupt every build average on the leaderboard.
 */
async function getPitchAverages(): Promise<Map<number, { avg: number; count: number }>> {
  const rows = await db
    .select({
      teamId: pitchScore.teamId,
      avg: sql<number>`coalesce(avg(${pitchScore.delivery} + ${pitchScore.clarity} + ${pitchScore.impact}), 0)`,
      count: sql<number>`count(${pitchScore.id})::int`,
    })
    .from(pitchScore)
    .groupBy(pitchScore.teamId);

  return new Map(rows.map((r) => [r.teamId, { avg: Number(r.avg), count: Number(r.count) }]));
}

async function buildRankingRows(): Promise<RankedTeam[]> {
  const [totalJudgesGlobal, pitchAverages] = await Promise.all([
    getTotalJudgeCount(),
    getPitchAverages(),
  ]);

  const rows = await db
    .select({
      teamId: team.id,
      teamName: team.name,
      isFinalist: team.isFinalist,
      judgeCountOverride: team.judgeCountOverride,
      lateSubmissionPenaltyPoints: team.lateSubmissionPenaltyPoints,
      manualOverride: team.finalScoreOverride,
      avgInnovation: sql<number>`coalesce(avg(${judgeScore.innovation}), 0)`,
      avgTechnicalExecution: sql<number>`coalesce(avg(${judgeScore.technicalExecution}), 0)`,
      avgAiUsage: sql<number>`coalesce(avg(${judgeScore.aiUsage}), 0)`,
      avgUxUi: sql<number>`coalesce(avg(${judgeScore.uxUi}), 0)`,
      avgBusinessPotential: sql<number>`coalesce(avg(${judgeScore.businessPotential}), 0)`,
      judgeCount: sql<number>`count(${judgeScore.id})::int`,
    })
    .from(team)
    .leftJoin(judgeScore, eq(team.id, judgeScore.teamId))
    .where(eq(team.screeningStatus, "approved"))
    .groupBy(
      team.id,
      team.name,
      team.isFinalist,
      team.judgeCountOverride,
      team.lateSubmissionPenaltyPoints,
      team.finalScoreOverride,
    );

  return rows.map((r) => {
    const avgInnovation = Number(r.avgInnovation);
    const avgTechnicalExecution = Number(r.avgTechnicalExecution);
    const avgAiUsage = Number(r.avgAiUsage);
    const avgUxUi = Number(r.avgUxUi);
    const avgBusinessPotential = Number(r.avgBusinessPotential);
    const grossTotalAvg =
      avgInnovation +
      avgTechnicalExecution +
      avgAiUsage +
      avgUxUi +
      avgBusinessPotential;
    const penalty = Number(r.lateSubmissionPenaltyPoints);
    const afterPenalty = Math.max(0, grossTotalAvg - penalty);
    const manualRaw = r.manualOverride;
    const hasManual =
      manualRaw !== null && manualRaw !== undefined && !Number.isNaN(Number(manualRaw));
    const manualScoreOverride = hasManual ? Math.max(0, Math.min(100, Number(manualRaw))) : null;
    const totalAvg = manualScoreOverride !== null ? manualScoreOverride : afterPenalty;
    const override = r.judgeCountOverride;
    const expectedJudgeCount = override ?? Math.max(EVENT_JUDGE_TARGET, totalJudgesGlobal);

    return {
      teamId: r.teamId,
      teamName: r.teamName,
      avgInnovation,
      avgTechnicalExecution,
      avgAiUsage,
      avgUxUi,
      avgBusinessPotential,
      grossTotalAvg,
      totalAvg,
      lateSubmissionPenaltyPoints: penalty,
      judgeCount: Number(r.judgeCount),
      expectedJudgeCount,
      judgeCountOverride: override,
      usesFinalScoreOverride: manualScoreOverride !== null,
      manualScoreOverride,
      isFinalist: Boolean(r.isFinalist),
      pitchAvg: pitchAverages.get(r.teamId)?.avg ?? 0,
      pitchJudgeCount: pitchAverages.get(r.teamId)?.count ?? 0,
    };
  });
}

export async function getScoreByJudgeAndTeam(
  judgeUserId: string,
  teamId: number,
): Promise<JudgeScoreRow | null> {
  const [row] = await db
    .select()
    .from(judgeScore)
    .where(and(eq(judgeScore.judgeUserId, judgeUserId), eq(judgeScore.teamId, teamId)))
    .limit(1);
  return (row as JudgeScoreRow) ?? null;
}

export async function upsertScore(
  judgeUserId: string,
  teamId: number,
  scores: ScoreCriteria,
  comment: string | null,
): Promise<JudgeScoreRow> {
  const existing = await getScoreByJudgeAndTeam(judgeUserId, teamId);
  if (existing) {
    const [updated] = await db
      .update(judgeScore)
      .set({ ...scores, comment, updatedAt: new Date() })
      .where(eq(judgeScore.id, existing.id))
      .returning();
    return updated as JudgeScoreRow;
  }
  const [inserted] = await db
    .insert(judgeScore)
    .values({ teamId, judgeUserId, ...scores, comment })
    .returning();
  return inserted as JudgeScoreRow;
}

/* -------------------------------------------------------------------------- */
/* Step 3: finals pitch scoring. Mirrors the build-score pair above.           */
/* -------------------------------------------------------------------------- */

export type PitchCriteria = {
  delivery: number;
  clarity: number;
  impact: number;
};

export type PitchScoreRow = PitchCriteria & {
  id: string;
  teamId: number;
  judgeUserId: string;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function getPitchScoreByJudgeAndTeam(
  judgeUserId: string,
  teamId: number,
): Promise<PitchScoreRow | null> {
  const [row] = await db
    .select()
    .from(pitchScore)
    .where(and(eq(pitchScore.judgeUserId, judgeUserId), eq(pitchScore.teamId, teamId)))
    .limit(1);
  return (row as PitchScoreRow) ?? null;
}

export async function upsertPitchScore(
  judgeUserId: string,
  teamId: number,
  scores: PitchCriteria,
  comment: string | null,
): Promise<PitchScoreRow> {
  const existing = await getPitchScoreByJudgeAndTeam(judgeUserId, teamId);
  if (existing) {
    const [updated] = await db
      .update(pitchScore)
      .set({ ...scores, comment, updatedAt: new Date() })
      .where(eq(pitchScore.id, existing.id))
      .returning();
    return updated as PitchScoreRow;
  }
  const [inserted] = await db
    .insert(pitchScore)
    .values({ teamId, judgeUserId, ...scores, comment })
    .returning();
  return inserted as PitchScoreRow;
}

/** Teams this judge has already pitch-scored (judge dashboard badges). */
export async function getPitchScoredTeamIds(judgeUserId: string): Promise<Set<number>> {
  const rows = await db
    .select({ teamId: pitchScore.teamId })
    .from(pitchScore)
    .where(eq(pitchScore.judgeUserId, judgeUserId));
  return new Set(rows.map((r) => r.teamId));
}

export type DetailedScore = {
  scoreId: string;
  teamId: number;
  teamName: string;
  judgeUserId: string;
  judgeName: string;
  judgeEmail: string;
  innovation: number;
  technicalExecution: number;
  aiUsage: number;
  uxUi: number;
  businessPotential: number;
  total: number;
  comment: string | null;
};

export type TeamScoringAdjustment = {
  teamId: number;
  teamName: string;
  judgeCountOverride: number | null;
  lateSubmissionPenaltyPoints: number;
  /** Super-admin manual final score (0–100); null = derive from judges + penalties. */
  finalScoreOverride: number | null;
};

export async function listApprovedTeamsScoringAdjustments(): Promise<TeamScoringAdjustment[]> {
  const rows = await db
    .select({
      teamId: team.id,
      teamName: team.name,
      judgeCountOverride: team.judgeCountOverride,
      lateSubmissionPenaltyPoints: team.lateSubmissionPenaltyPoints,
      finalScoreOverride: team.finalScoreOverride,
    })
    .from(team)
    .where(eq(team.screeningStatus, "approved"))
    .orderBy(asc(team.name));

  return rows.map((r) => ({
    teamId: r.teamId,
    teamName: r.teamName,
    judgeCountOverride: r.judgeCountOverride,
    lateSubmissionPenaltyPoints: r.lateSubmissionPenaltyPoints,
    finalScoreOverride:
      r.finalScoreOverride !== null && r.finalScoreOverride !== undefined
        ? Number(r.finalScoreOverride)
        : null,
  }));
}

export async function updateTeamScoringAdjustments(
  teamId: number,
  input: {
    judgeCountOverride: number | null;
    lateSubmissionPenaltyPoints: number;
    finalScoreOverride: number | null;
  },
): Promise<void> {
  if (input.lateSubmissionPenaltyPoints < 0 || input.lateSubmissionPenaltyPoints > 100) {
    throw new AppError(400, "INVALID_PENALTY", "Late penalty must be between 0 and 100.");
  }
  if (
    input.judgeCountOverride !== null &&
    (input.judgeCountOverride < 1 || input.judgeCountOverride > 100)
  ) {
    throw new AppError(400, "INVALID_OVERRIDE", "Judge count override must be between 1 and 100, or null.");
  }
  if (
    input.finalScoreOverride !== null &&
    (input.finalScoreOverride < 0 || input.finalScoreOverride > 100)
  ) {
    throw new AppError(400, "INVALID_FINAL_SCORE", "Final score must be between 0 and 100, or null.");
  }

  const [existing] = await db
    .select({ id: team.id })
    .from(team)
    .where(and(eq(team.id, teamId), eq(team.screeningStatus, "approved")))
    .limit(1);

  if (!existing) {
    throw new AppError(404, "TEAM_NOT_FOUND", "Approved team not found.");
  }

  await db
    .update(team)
    .set({
      judgeCountOverride: input.judgeCountOverride,
      lateSubmissionPenaltyPoints: input.lateSubmissionPenaltyPoints,
      finalScoreOverride: input.finalScoreOverride,
      updatedAt: new Date(),
    })
    .where(eq(team.id, teamId));

  notifyRankingUpdate();
}

/** Manual leaderboard score and/or late penalty (e.g. −10 for missing deadline). */
export async function updateTeamRankingPresentation(
  teamId: number,
  input: {
    finalScoreOverride: number | null;
    lateSubmissionPenaltyPoints: number;
  },
): Promise<void> {
  if (input.finalScoreOverride !== null && (input.finalScoreOverride < 0 || input.finalScoreOverride > 100)) {
    throw new AppError(400, "INVALID_FINAL_SCORE", "Manual score must be between 0 and 100, or null.");
  }
  if (input.lateSubmissionPenaltyPoints < 0 || input.lateSubmissionPenaltyPoints > 100) {
    throw new AppError(400, "INVALID_PENALTY", "Late penalty must be between 0 and 100.");
  }

  const [existing] = await db
    .select({ id: team.id })
    .from(team)
    .where(and(eq(team.id, teamId), eq(team.screeningStatus, "approved")))
    .limit(1);

  if (!existing) {
    throw new AppError(404, "TEAM_NOT_FOUND", "Approved team not found.");
  }

  await db
    .update(team)
    .set({
      finalScoreOverride: input.finalScoreOverride,
      lateSubmissionPenaltyPoints: input.lateSubmissionPenaltyPoints,
      updatedAt: new Date(),
    })
    .where(eq(team.id, teamId));

  notifyRankingUpdate();
}

function assertCriteriaRanges(s: ScoreCriteria) {
  if (s.innovation < 0 || s.innovation > 25) {
    throw new AppError(400, "INVALID_SCORE", "Innovation must be 0–25.");
  }
  if (s.technicalExecution < 0 || s.technicalExecution > 25) {
    throw new AppError(400, "INVALID_SCORE", "Technical execution must be 0–25.");
  }
  if (s.aiUsage < 0 || s.aiUsage > 20) {
    throw new AppError(400, "INVALID_SCORE", "AI usage must be 0–20.");
  }
  if (s.uxUi < 0 || s.uxUi > 15) {
    throw new AppError(400, "INVALID_SCORE", "UX/UI must be 0–15.");
  }
  if (s.businessPotential < 0 || s.businessPotential > 15) {
    throw new AppError(400, "INVALID_SCORE", "Business potential must be 0–15.");
  }
}

export async function updateJudgeScoreByAdmin(
  scoreId: string,
  scores: ScoreCriteria,
  comment: string | null | undefined,
): Promise<JudgeScoreRow> {
  assertCriteriaRanges(scores);

  const [existing] = await db.select().from(judgeScore).where(eq(judgeScore.id, scoreId)).limit(1);
  if (!existing) {
    throw new AppError(404, "SCORE_NOT_FOUND", "Score not found.");
  }

  const [updated] = await db
    .update(judgeScore)
    .set({
      ...scores,
      ...(comment !== undefined ? { comment } : {}),
      updatedAt: new Date(),
    })
    .where(eq(judgeScore.id, scoreId))
    .returning();

  notifyRankingUpdate();
  return updated as JudgeScoreRow;
}

/** Super-admin: create or replace a judge row for a team (same as staff evaluate, with validation). */
export async function upsertJudgeScoreByAdmin(
  teamId: number,
  judgeUserId: string,
  scores: ScoreCriteria,
  comment: string | null,
): Promise<JudgeScoreRow> {
  assertCriteriaRanges(scores);

  const [approved] = await db
    .select({ id: team.id })
    .from(team)
    .where(and(eq(team.id, teamId), eq(team.screeningStatus, "approved")))
    .limit(1);
  if (!approved) {
    throw new AppError(404, "TEAM_NOT_FOUND", "Approved team not found.");
  }

  const [judgeUser] = await db
    .select({ id: user.id })
    .from(user)
    .where(and(eq(user.id, judgeUserId), eq(user.role, "judge")))
    .limit(1);
  if (!judgeUser) {
    throw new AppError(404, "JUDGE_NOT_FOUND", "No judge account found for that user id.");
  }

  const row = await upsertScore(judgeUserId, teamId, scores, comment);
  notifyRankingUpdate();
  return row;
}

export async function getAllDetailedScores(): Promise<DetailedScore[]> {
  const rows = await db
    .select({
      scoreId: judgeScore.id,
      teamId: team.id,
      teamName: team.name,
      judgeUserId: judgeScore.judgeUserId,
      judgeName: user.name,
      judgeEmail: user.email,
      innovation: judgeScore.innovation,
      technicalExecution: judgeScore.technicalExecution,
      aiUsage: judgeScore.aiUsage,
      uxUi: judgeScore.uxUi,
      businessPotential: judgeScore.businessPotential,
      comment: judgeScore.comment,
    })
    .from(judgeScore)
    .innerJoin(team, eq(judgeScore.teamId, team.id))
    .innerJoin(user, eq(judgeScore.judgeUserId, user.id))
    .orderBy(team.name, user.name);

  return rows.map((r) => ({
    scoreId: r.scoreId,
    teamId: r.teamId,
    teamName: r.teamName,
    judgeUserId: r.judgeUserId,
    judgeName: r.judgeName ?? r.judgeEmail,
    judgeEmail: r.judgeEmail,
    innovation: r.innovation,
    technicalExecution: r.technicalExecution,
    aiUsage: r.aiUsage,
    uxUi: r.uxUi,
    businessPotential: r.businessPotential,
    comment: r.comment,
    total: r.innovation + r.technicalExecution + r.aiUsage + r.uxUi + r.businessPotential,
  }));
}

export async function getApprovedTeamsForMentor() {
  const teams = await db
    .select({
      id: team.id,
      name: team.name,
      description: team.description,
      memberCount: team.memberCount,
      projectName: project.name,
      projectGithubUrl: project.githubUrl,
      projectDemoUrl: project.demoUrl,
      projectTechStack: project.techStack,
      projectDescription: project.description,
      projectSlidesUrl: project.slidesUrl,
      projectVideoUrl: project.videoUrl,
    })
    .from(team)
    .leftJoin(project, eq(team.id, project.teamId))
    .where(eq(team.screeningStatus, "approved"))
    .orderBy(team.name);

  return teams.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    memberCount: t.memberCount,
    project: t.projectName
      ? {
          name: t.projectName,
          description: t.projectDescription,
          githubUrl: t.projectGithubUrl,
          demoUrl: t.projectDemoUrl,
          techStack: t.projectTechStack,
          slidesUrl: t.projectSlidesUrl,
          videoUrl: t.projectVideoUrl,
        }
      : null,
  }));
}

/**
 * Every active team, with its live app URL and cached step-1 requirements check.
 *
 * Deliberately not filtered to approved teams: judges follow builds live through
 * the night, and a team's deployed URL is worth watching before (and regardless
 * of) screening. Scoring is still gated separately - the evaluate route rejects
 * teams that are unapproved or have no project.
 */
export async function getApprovedTeamsForJudge(judgeUserId: string) {
  const teams = await db
    .select({
      id: team.id,
      name: team.name,
      description: team.description,
      memberCount: team.memberCount,
      screeningStatus: team.screeningStatus,
      isFinalist: team.isFinalist,
      projectName: project.name,
      projectGithubUrl: project.githubUrl,
      projectDemoUrl: project.demoUrl,
      projectTechStack: project.techStack,
      projectDescription: project.description,
      projectSlidesUrl: project.slidesUrl,
      projectVideoUrl: project.videoUrl,
      checkHasPrd: repoCheck.hasPrd,
      checkHasCursorRules: repoCheck.hasCursorRules,
      checkHasAppUrl: repoCheck.hasAppUrl,
      checkOnTime: repoCheck.onTime,
      checkedAt: repoCheck.checkedAt,
    })
    .from(team)
    .leftJoin(project, eq(team.id, project.teamId))
    .leftJoin(repoCheck, eq(team.id, repoCheck.teamId))
    .where(eq(team.status, "active"))
    .orderBy(team.name);

  const scores = await db
    .select({
      teamId: judgeScore.teamId,
      innovation: judgeScore.innovation,
      technicalExecution: judgeScore.technicalExecution,
      aiUsage: judgeScore.aiUsage,
      uxUi: judgeScore.uxUi,
      businessPotential: judgeScore.businessPotential,
    })
    .from(judgeScore)
    .where(eq(judgeScore.judgeUserId, judgeUserId));

  const scoreMap = new Map(scores.map((s) => [s.teamId, s]));
  const pitchScored = await getPitchScoredTeamIds(judgeUserId);

  const teamIds = teams.map((t) => t.id);
  const memberRows =
    teamIds.length === 0
      ? []
      : await db
          .select({
            teamId: teamMember.teamId,
            role: teamMember.role,
            name: user.name,
            email: user.email,
          })
          .from(teamMember)
          .innerJoin(user, eq(teamMember.userId, user.id))
          .where(and(inArray(teamMember.teamId, teamIds), isNull(teamMember.leftAt)));

  const membersByTeam = new Map<number, string[]>();
  const sortedMembers = [...memberRows].sort((a, b) => {
    if (a.teamId !== b.teamId) return a.teamId - b.teamId;
    if (a.role !== b.role) return a.role === "lead" ? -1 : 1;
    const aLabel = (a.name?.trim() || a.email || "").toLowerCase();
    const bLabel = (b.name?.trim() || b.email || "").toLowerCase();
    return aLabel.localeCompare(bLabel);
  });
  for (const row of sortedMembers) {
    const label = row.name?.trim() || row.email;
    if (!label) continue;
    const list = membersByTeam.get(row.teamId) ?? [];
    list.push(label);
    membersByTeam.set(row.teamId, list);
  }

  return teams.map((t) => {
    const s = scoreMap.get(t.id);
    const members = membersByTeam.get(t.id) ?? [];
    return {
      id: t.id,
      name: t.name,
      description: t.description,
      memberCount: t.memberCount,
      /** Active member display names (lead first). */
      members,
      approved: t.screeningStatus === "approved",
      /** Step 3: on stage for the finals pitch. */
      isFinalist: Boolean(t.isFinalist),
      /** Whether THIS judge has already scored this team's pitch. */
      pitchScored: pitchScored.has(t.id),
      /** Live deployed app, shown to judges all night even without a full submission. */
      appUrl: t.projectDemoUrl,
      project: t.projectName
        ? {
            name: t.projectName,
            description: t.projectDescription,
            githubUrl: t.projectGithubUrl,
            demoUrl: t.projectDemoUrl,
            techStack: t.projectTechStack,
            slidesUrl: t.projectSlidesUrl,
            videoUrl: t.projectVideoUrl,
          }
        : null,
      /** Step-1 requirements check. Null when it has never been run for this team. */
      repoCheck: t.checkedAt
        ? {
            hasPrd: !!t.checkHasPrd,
            hasCursorRules: !!t.checkHasCursorRules,
            hasAppUrl: !!t.checkHasAppUrl,
            onTime: !!t.checkOnTime,
          }
        : null,
      scored: !!s,
      total: s
        ? s.innovation + s.technicalExecution + s.aiUsage + s.uxUi + s.businessPotential
        : null,
    };
  });
}
