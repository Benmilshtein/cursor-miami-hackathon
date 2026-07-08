import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { team } from "@/db/schema/auth";
import { project } from "@/db/schema/projects";
import { AppError, jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import { getScoreByJudgeAndTeam, upsertScore, type ScoreCriteria } from "@/lib/scoring/service";
import { isRankingFinalized } from "@/lib/scoring/finalization";
import { notifyRankingUpdate } from "@/lib/scoring/events";

type Ctx = { params: Promise<{ teamId: string }> };

async function resolveTeamId(ctx: Ctx) {
  const { teamId } = await ctx.params;
  const id = Number(teamId);
  if (!Number.isFinite(id) || id <= 0) {
    throw new AppError(400, "INVALID_INPUT", "Invalid team ID.");
  }
  const [t] = await db
    .select({ id: team.id, screeningStatus: team.screeningStatus })
    .from(team)
    .where(eq(team.id, id))
    .limit(1);
  if (!t) throw new AppError(404, "NOT_FOUND", "Team not found.");
  if (t.screeningStatus !== "approved") {
    throw new AppError(400, "NOT_APPROVED", "Can only evaluate approved teams.");
  }
  const [proj] = await db
    .select({ id: project.id })
    .from(project)
    .where(eq(project.teamId, id))
    .limit(1);
  if (!proj) {
    throw new AppError(400, "NO_PROJECT", "Cannot evaluate a team that has not submitted a project.");
  }
  return id;
}

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const actor = await requireSessionUser(request);
    if (actor.role !== "judge") {
      throw new AppError(403, "FORBIDDEN", "Only judges can access scores.");
    }
    const teamId = await resolveTeamId(ctx);
    const score = await getScoreByJudgeAndTeam(actor.id, teamId);
    return jsonSuccess(score);
  } catch (error) {
    return toErrorResponse(error);
  }
}

function clamp(val: unknown, max: number): number {
  const n = Number(val);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(max, Math.round(n)));
}

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const actor = await requireSessionUser(request);
    if (actor.role !== "judge") {
      throw new AppError(403, "FORBIDDEN", "Only judges can submit scores.");
    }
    if (await isRankingFinalized()) {
      throw new AppError(403, "RANKING_FINALIZED", "Ranking has been finalized. Scores can no longer be changed.");
    }
    const teamId = await resolveTeamId(ctx);
    const body = await parseJsonBody<Record<string, unknown>>(request);
    const scores: ScoreCriteria = {
      innovation: clamp(body.innovation, 25),
      technicalExecution: clamp(body.technicalExecution, 25),
      aiUsage: clamp(body.aiUsage, 20),
      uxUi: clamp(body.uxUi, 15),
      businessPotential: clamp(body.businessPotential, 15),
    };
    const comment =
      typeof body.comment === "string" ? body.comment.trim().slice(0, 2000) || null : null;
    const saved = await upsertScore(actor.id, teamId, scores, comment);
    notifyRankingUpdate();
    return jsonSuccess(saved);
  } catch (error) {
    return toErrorResponse(error);
  }
}
