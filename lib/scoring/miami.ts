import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { team, user } from "@/db/schema/auth";
import { miamiScore, repoCheck, teamDisqualification } from "@/db/schema/scoring";
import { project } from "@/db/schema/projects";
import { teamMember } from "@/db/schema/teams";
import { AppError } from "@/lib/api/http";
import type { AppSessionUser } from "@/lib/auth/session";

/**
 * Miami Scoring System service.
 *
 * Visibility rules (enforced here, not in the UI):
 * - Participants/mentors never see any of this - the API layer only serves
 *   judges and super admins, and nothing here feeds the public ranking.
 * - A judge sees a team's scores only after submitting their own three pillars
 *   for that team. Before that the board carries no score data for the team.
 * - Scores are immutable once submitted (no update path exists).
 * - Super admins always see everything, plus the disqualification control.
 * - Nothing in this module emits notifications or events, by design.
 */

export type MiamiPillars = {
  problemIdentification: number;
  productMaturity: number;
  solutionViability: number;
};

export type MiamiScoreView = MiamiPillars & {
  judgeUserId: string;
  judgeName: string;
  total: number;
  submittedAt: string;
};

export type MiamiBoardMember = {
  name: string | null;
  email: string;
  isLead: boolean;
};

export type MiamiResultRow = {
  /** Competition ranking: tied totals share a rank. */
  rank: number;
  teamId: number;
  avgProblemIdentification: number;
  avgProductMaturity: number;
  avgSolutionViability: number;
  avgTotal: number;
  judgeCount: number;
};

export type MiamiProgress = {
  /** Distinct judges who have submitted at least one Miami score. */
  activeJudgeCount: number;
  /** Active teams that are not disqualified (the ones that need full scores). */
  scorableTeams: number;
  /** Scorable teams already scored by every active judge. */
  completeTeams: number;
  disqualifiedTeams: number;
  /** True once every scorable team is fully scored - unlocks the winners reveal. */
  allComplete: boolean;
};

export type MiamiBoard = {
  teams: MiamiBoardTeam[];
  progress: MiamiProgress;
  /**
   * Ranked standings (disqualified teams excluded). Null for judges until
   * allComplete so standings can never bias scoring; super admins always get
   * them (they already see every score) for a live preview.
   */
  results: MiamiResultRow[] | null;
};

export type MiamiBoardTeam = {
  id: number;
  name: string;
  description: string | null;
  memberCount: number;
  screeningStatus: string;
  isFinalist: boolean;
  members: MiamiBoardMember[];
  project: {
    name: string;
    description: string | null;
    githubUrl: string | null;
    demoUrl: string | null;
    prdUrl: string | null;
    techStack: string | null;
    slidesUrl: string | null;
    videoUrl: string | null;
  } | null;
  /** Live deployed app URL (project.demoUrl). */
  appUrl: string | null;
  prdUrl: string | null;
  repoCheck: {
    hasPrd: boolean;
    hasCursorRules: boolean;
    hasAppUrl: boolean;
    onTime: boolean;
  } | null;
  /** Platform PRD link or PRD found in the repo check. False = flag the team. */
  hasPrd: boolean;
  disqualified: {
    reason: string;
    byName: string | null;
    at: string;
  } | null;
  /** The viewing judge's own submitted score (null for admins / not submitted). */
  myScore: (MiamiPillars & { total: number; submittedAt: string }) | null;
  /** True when the viewer may see this team's scores (admin, or judge who submitted). */
  scoresVisible: boolean;
  /** All submitted scores for the team; empty until scoresVisible. */
  scores: MiamiScoreView[];
  averages: (MiamiPillars & { total: number; judgeCount: number }) | null;
  /** How many judges have submitted for this team (count only - never the values). */
  submittedCount: number;
};

function assertPillar(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 10) {
    throw new AppError(400, "INVALID_SCORE", `${label} must be an integer between 0 and 10.`);
  }
  return value;
}

export function parseMiamiPillars(body: Record<string, unknown>): MiamiPillars {
  return {
    problemIdentification: assertPillar(body.problemIdentification, "Problem Identification"),
    productMaturity: assertPillar(body.productMaturity, "Product Maturity"),
    solutionViability: assertPillar(body.solutionViability, "Solution Viability"),
  };
}

/** Submit a judge's three pillars for a team. One shot - immutable afterwards. */
export async function submitMiamiScore(
  judgeUserId: string,
  teamId: number,
  pillars: MiamiPillars,
) {
  const [teamRow] = await db
    .select({ id: team.id, status: team.status })
    .from(team)
    .where(eq(team.id, teamId))
    .limit(1);
  if (!teamRow || teamRow.status !== "active") {
    throw new AppError(404, "NOT_FOUND", "Team not found.");
  }

  const [inserted] = await db
    .insert(miamiScore)
    .values({
      teamId,
      judgeUserId,
      problemIdentification: pillars.problemIdentification,
      productMaturity: pillars.productMaturity,
      solutionViability: pillars.solutionViability,
    })
    .onConflictDoNothing()
    .returning();

  if (!inserted) {
    throw new AppError(
      409,
      "ALREADY_SCORED",
      "You already submitted scores for this team. Scores are final and cannot be changed.",
    );
  }

  return {
    teamId,
    problemIdentification: inserted.problemIdentification,
    productMaturity: inserted.productMaturity,
    solutionViability: inserted.solutionViability,
    total:
      inserted.problemIdentification + inserted.productMaturity + inserted.solutionViability,
    submittedAt: inserted.submittedAt.toISOString(),
  };
}

/** Disqualify (with mandatory reason) or reinstate a team. Super admin only. */
export async function setTeamDisqualification(
  adminUserId: string,
  teamId: number,
  disqualified: boolean,
  reason?: string,
) {
  const [teamRow] = await db
    .select({ id: team.id })
    .from(team)
    .where(eq(team.id, teamId))
    .limit(1);
  if (!teamRow) {
    throw new AppError(404, "NOT_FOUND", "Team not found.");
  }

  if (!disqualified) {
    await db.delete(teamDisqualification).where(eq(teamDisqualification.teamId, teamId));
    return { teamId, disqualified: false as const };
  }

  const trimmed = reason?.trim() ?? "";
  if (!trimmed) {
    throw new AppError(
      400,
      "REASON_REQUIRED",
      "A reason note is required to disqualify a team.",
    );
  }

  await db
    .insert(teamDisqualification)
    .values({ teamId, reason: trimmed, disqualifiedByUserId: adminUserId })
    .onConflictDoUpdate({
      target: teamDisqualification.teamId,
      set: { reason: trimmed, disqualifiedByUserId: adminUserId, createdAt: new Date() },
    });

  return { teamId, disqualified: true as const, reason: trimmed };
}

/** Unified board for the Miami Scoring System page and the judge dashboard columns. */
export async function getMiamiScoringBoard(viewer: AppSessionUser): Promise<MiamiBoard> {
  if (viewer.role !== "judge" && viewer.role !== "super_admin") {
    throw new AppError(403, "FORBIDDEN", "Only judges and super admins can view scoring.");
  }
  const isAdmin = viewer.role === "super_admin";

  const teams = await db
    .select({
      id: team.id,
      name: team.name,
      description: team.description,
      memberCount: team.memberCount,
      screeningStatus: team.screeningStatus,
      isFinalist: team.isFinalist,
      projectName: project.name,
      projectDescription: project.description,
      projectGithubUrl: project.githubUrl,
      projectDemoUrl: project.demoUrl,
      projectPrdUrl: project.prdUrl,
      projectTechStack: project.techStack,
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

  const teamIds = teams.map((t) => t.id);
  if (teamIds.length === 0) {
    return {
      teams: [],
      progress: {
        activeJudgeCount: 0,
        scorableTeams: 0,
        completeTeams: 0,
        disqualifiedTeams: 0,
        allComplete: false,
      },
      results: isAdmin ? [] : null,
    };
  }

  const [memberRows, scoreRows, dqRows] = await Promise.all([
    db
      .select({
        teamId: teamMember.teamId,
        role: teamMember.role,
        name: user.name,
        email: user.email,
      })
      .from(teamMember)
      .innerJoin(user, eq(teamMember.userId, user.id))
      .where(and(inArray(teamMember.teamId, teamIds), isNull(teamMember.leftAt))),
    db
      .select({
        teamId: miamiScore.teamId,
        judgeUserId: miamiScore.judgeUserId,
        judgeName: user.name,
        problemIdentification: miamiScore.problemIdentification,
        productMaturity: miamiScore.productMaturity,
        solutionViability: miamiScore.solutionViability,
        submittedAt: miamiScore.submittedAt,
      })
      .from(miamiScore)
      .innerJoin(user, eq(miamiScore.judgeUserId, user.id))
      .where(inArray(miamiScore.teamId, teamIds)),
    db
      .select({
        teamId: teamDisqualification.teamId,
        reason: teamDisqualification.reason,
        byName: user.name,
        createdAt: teamDisqualification.createdAt,
      })
      .from(teamDisqualification)
      .leftJoin(user, eq(teamDisqualification.disqualifiedByUserId, user.id))
      .where(inArray(teamDisqualification.teamId, teamIds)),
  ]);

  const membersByTeam = new Map<number, MiamiBoardMember[]>();
  for (const row of memberRows) {
    const list = membersByTeam.get(row.teamId) ?? [];
    list.push({ name: row.name?.trim() || null, email: row.email, isLead: row.role === "lead" });
    membersByTeam.set(row.teamId, list);
  }
  for (const list of membersByTeam.values()) {
    list.sort((a, b) => {
      if (a.isLead !== b.isLead) return a.isLead ? -1 : 1;
      return (a.name ?? a.email).localeCompare(b.name ?? b.email);
    });
  }

  const scoresByTeam = new Map<number, MiamiScoreView[]>();
  for (const row of scoreRows) {
    const list = scoresByTeam.get(row.teamId) ?? [];
    list.push({
      judgeUserId: row.judgeUserId,
      judgeName: row.judgeName?.trim() || "Judge",
      problemIdentification: row.problemIdentification,
      productMaturity: row.productMaturity,
      solutionViability: row.solutionViability,
      total: row.problemIdentification + row.productMaturity + row.solutionViability,
      submittedAt: row.submittedAt.toISOString(),
    });
    scoresByTeam.set(row.teamId, list);
  }
  for (const list of scoresByTeam.values()) {
    list.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  }

  const dqByTeam = new Map(dqRows.map((d) => [d.teamId, d]));

  const boardTeams: MiamiBoardTeam[] = teams.map((t) => {
    const all = scoresByTeam.get(t.id) ?? [];
    const mine = isAdmin ? undefined : all.find((s) => s.judgeUserId === viewer.id);
    const scoresVisible = isAdmin || Boolean(mine);
    const visibleScores = scoresVisible ? all : [];
    const round1 = (n: number) => Math.round(n * 10) / 10;
    const averages =
      scoresVisible && all.length > 0
        ? {
            problemIdentification: round1(
              all.reduce((sum, s) => sum + s.problemIdentification, 0) / all.length,
            ),
            productMaturity: round1(
              all.reduce((sum, s) => sum + s.productMaturity, 0) / all.length,
            ),
            solutionViability: round1(
              all.reduce((sum, s) => sum + s.solutionViability, 0) / all.length,
            ),
            total: round1(all.reduce((sum, s) => sum + s.total, 0) / all.length),
            judgeCount: all.length,
          }
        : null;
    const dq = dqByTeam.get(t.id);

    return {
      id: t.id,
      name: t.name,
      description: t.description,
      memberCount: t.memberCount,
      screeningStatus: t.screeningStatus,
      isFinalist: Boolean(t.isFinalist),
      members: membersByTeam.get(t.id) ?? [],
      project: t.projectName
        ? {
            name: t.projectName,
            description: t.projectDescription,
            githubUrl: t.projectGithubUrl,
            demoUrl: t.projectDemoUrl,
            prdUrl: t.projectPrdUrl,
            techStack: t.projectTechStack,
            slidesUrl: t.projectSlidesUrl,
            videoUrl: t.projectVideoUrl,
          }
        : null,
      appUrl: t.projectDemoUrl,
      prdUrl: t.projectPrdUrl,
      repoCheck: t.checkedAt
        ? {
            hasPrd: !!t.checkHasPrd || !!t.projectPrdUrl,
            hasCursorRules: !!t.checkHasCursorRules,
            hasAppUrl: !!t.checkHasAppUrl,
            onTime: !!t.checkOnTime,
          }
        : null,
      hasPrd: !!t.projectPrdUrl || !!t.checkHasPrd,
      disqualified: dq
        ? {
            reason: dq.reason,
            byName: dq.byName?.trim() || null,
            at: dq.createdAt.toISOString(),
          }
        : null,
      myScore: mine
        ? {
            problemIdentification: mine.problemIdentification,
            productMaturity: mine.productMaturity,
            solutionViability: mine.solutionViability,
            total: mine.total,
            submittedAt: mine.submittedAt,
          }
        : null,
      scoresVisible,
      scores: visibleScores,
      averages,
      submittedCount: all.length,
    };
  });

  // Winners readiness: every non-disqualified team scored by every active
  // judge (distinct judges who submitted anywhere - mirrors how the legacy
  // ranking counts its judge total).
  const activeJudgeCount = new Set(scoreRows.map((s) => s.judgeUserId)).size;
  const scorable = boardTeams.filter((t) => !t.disqualified);
  const completeTeams =
    activeJudgeCount === 0
      ? 0
      : scorable.filter((t) => t.submittedCount >= activeJudgeCount).length;
  const allComplete =
    activeJudgeCount > 0 && scorable.length > 0 && completeTeams === scorable.length;

  const progress: MiamiProgress = {
    activeJudgeCount,
    scorableTeams: scorable.length,
    completeTeams,
    disqualifiedTeams: boardTeams.length - scorable.length,
    allComplete,
  };

  // Standings: server-gated so judges can never see them before the reveal.
  let results: MiamiResultRow[] | null = null;
  if (isAdmin || allComplete) {
    const round1 = (n: number) => Math.round(n * 10) / 10;
    const sorted = scorable
      .filter((t) => t.submittedCount > 0)
      .map((t) => {
        const all = scoresByTeam.get(t.id) ?? [];
        const count = all.length;
        return {
          teamId: t.id,
          avgProblemIdentification: round1(
            all.reduce((sum, s) => sum + s.problemIdentification, 0) / count,
          ),
          avgProductMaturity: round1(
            all.reduce((sum, s) => sum + s.productMaturity, 0) / count,
          ),
          avgSolutionViability: round1(
            all.reduce((sum, s) => sum + s.solutionViability, 0) / count,
          ),
          avgTotal: round1(all.reduce((sum, s) => sum + s.total, 0) / count),
          judgeCount: count,
        };
      })
      .sort(
        (a, b) =>
          b.avgTotal - a.avgTotal ||
          b.judgeCount - a.judgeCount ||
          a.teamId - b.teamId,
      );

    let lastTotal: number | null = null;
    let lastRank = 0;
    results = sorted.map((row, index) => {
      const rank = row.avgTotal === lastTotal ? lastRank : index + 1;
      lastTotal = row.avgTotal;
      lastRank = rank;
      return { rank, ...row };
    });
  }

  return { teams: boardTeams, progress, results };
}
