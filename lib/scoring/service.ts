import { db } from "@/db";
import { team, user } from "@/db/schema/auth";
import { judgeScore } from "@/db/schema/scoring";
import { project } from "@/db/schema/projects";
import { eq, and, sql, asc, inArray } from "drizzle-orm";
import { AppError } from "@/lib/api/http";
import { notifyRankingUpdate } from "@/lib/scoring/events";
import { EVENT_JUDGE_TARGET } from "@/lib/scoring/constants";

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
 * Public ranking:
 * - Default: average of each judge’s row total (5 criteria, max 100 per judge), minus late penalty.
 * - Optional manual `final_score_override` replaces that computed total for the leaderboard.
 */
export async function getRanking(): Promise<RankedTeam[]> {
  const rows = await buildRankingRows();
  return rows.sort((a, b) => {
    if (b.totalAvg !== a.totalAvg) return b.totalAvg - a.totalAvg;
    return a.teamName.localeCompare(b.teamName);
  });
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

export type AdminOfficialScoresTeamRow = {
  teamId: number;
  teamName: string;
  judgeCount: number;
  judgeTarget: number;
  averageFromJudges: number;
  lateSubmissionPenaltyPoints: number;
  manualOverride: number | null;
  effectiveTotal: number;
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

  const teams: AdminOfficialScoresTeamRow[] = base.map((r) => ({
    teamId: r.teamId,
    teamName: r.teamName,
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

async function buildRankingRows(): Promise<RankedTeam[]> {
  const totalJudgesGlobal = await getTotalJudgeCount();

  const rows = await db
    .select({
      teamId: team.id,
      teamName: team.name,
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

export async function getApprovedTeamsForJudge(judgeUserId: string) {
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

  return teams.map((t) => {
    const s = scoreMap.get(t.id);
    return {
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
      scored: !!s,
      total: s
        ? s.innovation + s.technicalExecution + s.aiUsage + s.uxUi + s.businessPotential
        : null,
    };
  });
}
