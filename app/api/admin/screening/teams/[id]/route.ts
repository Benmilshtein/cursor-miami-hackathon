import type { NextRequest } from "next/server";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { team, user } from "@/db/schema/auth";
import { teamMember } from "@/db/schema/teams";
import { screeningQuestion, screeningAnswer } from "@/db/schema/screening";
import { AppError, jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";

type Params = { params: Promise<{ id: string }> };

function parseId(id: string): number {
  const n = parseInt(id, 10);
  if (!Number.isInteger(n) || n < 1) throw new AppError(400, "INVALID_ID", "Invalid team id.");
  return n;
}

type ScreeningStatus = "draft" | "submitted" | "approved" | "rejected";

function isScreeningStatus(value: string): value is ScreeningStatus {
  switch (value) {
    case "draft":
    case "submitted":
    case "approved":
    case "rejected":
      return true;
    default:
      return false;
  }
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requireSuperAdminUser(request);
    const teamId = parseId((await params).id);
    const [t] = await db.select().from(team).where(eq(team.id, teamId)).limit(1);
    if (!t) throw new AppError(404, "NOT_FOUND", "Team not found.");

    const members = await db
      .select({
        userId: teamMember.userId,
        role: teamMember.role,
        name: user.name,
        email: user.email,
      })
      .from(teamMember)
      .innerJoin(user, eq(user.id, teamMember.userId))
      .where(and(eq(teamMember.teamId, teamId), isNull(teamMember.leftAt)));

    const questions = await db
      .select()
      .from(screeningQuestion)
      .orderBy(screeningQuestion.sortOrder, screeningQuestion.id);

    const userIds = members.map((m) => m.userId);
    const allAnswers =
      userIds.length > 0
        ? await db
            .select()
            .from(screeningAnswer)
            .where(inArray(screeningAnswer.userId, userIds))
        : [];
    const answersByUser = new Map<string, typeof allAnswers>();
    for (const a of allAnswers) {
      if (!answersByUser.has(a.userId)) answersByUser.set(a.userId, []);
      answersByUser.get(a.userId)!.push(a);
    }

    return jsonSuccess({
      team: {
        id: t.id,
        name: t.name,
        description: t.description,
        screeningStatus: t.screeningStatus,
        screeningVideoUrl: t.screeningVideoUrl,
        screeningVideoStoragePath: t.screeningVideoStoragePath,
        screeningSubmittedAt: t.screeningSubmittedAt,
        screeningRejectedAt: t.screeningRejectedAt,
        screeningRejectedReason: t.screeningRejectedReason,
        screeningApprovedAt: t.screeningApprovedAt,
      },
      members: members.map((m) => ({
        userId: m.userId,
        role: m.role,
        name: m.name,
        email: m.email,
        answers: (answersByUser.get(m.userId) ?? []).map((a) => ({
          questionId: a.questionId,
          selectedIndex: a.selectedIndex,
          isCorrect: a.isCorrect,
        })),
      })),
      questions: questions.map((q) => ({
        id: q.id,
        title: q.title,
        options: q.options,
        correctIndex: q.correctIndex,
      })),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const actor = await requireSuperAdminUser(request);
    const teamId = parseId((await params).id);
    const body = await parseJsonBody<{ status?: string; reason?: string }>(request);
    const rawStatus = typeof body.status === "string" ? body.status : "";
    if (!isScreeningStatus(rawStatus)) {
      throw new AppError(400, "INVALID_STATUS", "Invalid screening status.");
    }

    const reason = typeof body.reason === "string" ? body.reason.trim() || null : null;
    const [t] = await db.select().from(team).where(eq(team.id, teamId)).limit(1);
    if (!t) throw new AppError(404, "NOT_FOUND", "Team not found.");

    const now = new Date();
    const updates: Record<string, unknown> = {
      screeningStatus: rawStatus,
      updatedAt: now,
    };

    switch (rawStatus) {
      case "draft":
        updates.screeningSubmittedAt = null;
        updates.screeningRejectedAt = null;
        updates.screeningRejectedReason = null;
        updates.screeningApprovedAt = null;
        updates.screeningApprovedByUserId = null;
        break;
      case "submitted":
        updates.screeningSubmittedAt = now;
        updates.screeningRejectedAt = null;
        updates.screeningRejectedReason = null;
        updates.screeningApprovedAt = null;
        updates.screeningApprovedByUserId = null;
        break;
      case "approved":
        updates.screeningApprovedAt = now;
        updates.screeningApprovedByUserId = actor.id;
        updates.screeningRejectedAt = null;
        updates.screeningRejectedReason = null;
        break;
      case "rejected":
        updates.screeningRejectedAt = now;
        updates.screeningRejectedReason = reason;
        updates.screeningApprovedAt = null;
        updates.screeningApprovedByUserId = null;
        break;
      default:
        throw new AppError(400, "INVALID_STATUS", "Invalid screening status.");
    }

    await db.update(team).set(updates).where(eq(team.id, teamId));

    return jsonSuccess({ ok: true, screeningStatus: rawStatus });
  } catch (error) {
    return toErrorResponse(error);
  }
}
