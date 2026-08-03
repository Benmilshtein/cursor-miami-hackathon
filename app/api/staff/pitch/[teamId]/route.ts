import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { team } from "@/db/schema/auth";
import { AppError, jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import { assertIsFinalist } from "@/lib/scoring/finalists";
import {
  getPitchScoreByJudgeAndTeam,
  upsertPitchScore,
  type PitchCriteria,
} from "@/lib/scoring/service";
import { isRankingFinalized } from "@/lib/scoring/finalization";
import { notifyRankingUpdate } from "@/lib/scoring/events";

/**
 * Step 3: a judge's score for one finalist's staged pitch. Mirrors the build
 * scoring route (`/api/staff/evaluate/[teamId]`), with the extra rule that only
 * finalists have a pitch to score.
 */

type Ctx = { params: Promise<{ teamId: string }> };

async function resolveFinalistTeamId(ctx: Ctx) {
  const { teamId } = await ctx.params;
  const id = Number(teamId);
  if (!Number.isFinite(id) || id <= 0) {
    throw new AppError(400, "INVALID_INPUT", "Invalid team ID.");
  }
  const [t] = await db.select({ id: team.id }).from(team).where(eq(team.id, id)).limit(1);
  if (!t) throw new AppError(404, "NOT_FOUND", "Team not found.");
  await assertIsFinalist(id);
  return id;
}

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const actor = await requireSessionUser(request);
    if (actor.role !== "judge") {
      throw new AppError(403, "FORBIDDEN", "Only judges can access pitch scores.");
    }
    const teamId = await resolveFinalistTeamId(ctx);
    const score = await getPitchScoreByJudgeAndTeam(actor.id, teamId);
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
      throw new AppError(403, "FORBIDDEN", "Only judges can submit pitch scores.");
    }
    if (await isRankingFinalized()) {
      throw new AppError(
        403,
        "RANKING_FINALIZED",
        "Ranking has been finalized. Scores can no longer be changed.",
      );
    }
    const teamId = await resolveFinalistTeamId(ctx);
    const body = await parseJsonBody<Record<string, unknown>>(request);
    const scores: PitchCriteria = {
      delivery: clamp(body.delivery, 30),
      clarity: clamp(body.clarity, 30),
      impact: clamp(body.impact, 40),
    };
    const comment =
      typeof body.comment === "string" ? body.comment.trim().slice(0, 2000) || null : null;
    const saved = await upsertPitchScore(actor.id, teamId, scores, comment);
    notifyRankingUpdate();
    return jsonSuccess(saved);
  } catch (error) {
    return toErrorResponse(error);
  }
}
