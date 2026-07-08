import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { screeningQuestion } from "@/db/schema/screening";
import { AppError, jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";

type Params = { params: Promise<{ id: string }> };

function parseId(id: string): number {
  const n = parseInt(id, 10);
  if (!Number.isInteger(n) || n < 1) throw new AppError(400, "INVALID_ID", "Invalid question id.");
  return n;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requireSuperAdminUser(request);
    const questionId = parseId((await params).id);
    const [q] = await db
      .select()
      .from(screeningQuestion)
      .where(eq(screeningQuestion.id, questionId))
      .limit(1);
    if (!q) throw new AppError(404, "NOT_FOUND", "Question not found.");
    return jsonSuccess(q);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    await requireSuperAdminUser(request);
    const questionId = parseId((await params).id);
    const body = await parseJsonBody<{
      title?: string;
      description?: string;
      options?: string[];
      correctIndex?: number;
      sortOrder?: number;
    }>(request);
    const [existing] = await db
      .select()
      .from(screeningQuestion)
      .where(eq(screeningQuestion.id, questionId))
      .limit(1);
    if (!existing) throw new AppError(404, "NOT_FOUND", "Question not found.");
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof body.title === "string") {
      const t = body.title.trim();
      if (!t) throw new AppError(400, "INVALID_INPUT", "title cannot be empty.");
      updates.title = t;
    }
    if (body.description !== undefined) {
      updates.description = typeof body.description === "string" ? body.description.trim() || null : null;
    }
    if (Array.isArray(body.options) && body.options.length > 0) {
      updates.options = body.options;
      const correctIndex =
        typeof body.correctIndex === "number" && Number.isInteger(body.correctIndex)
          ? body.correctIndex
          : existing.correctIndex;
      if (correctIndex < 0 || correctIndex >= body.options.length) {
        throw new AppError(400, "INVALID_INPUT", "correctIndex must be within options range.");
      }
      updates.correctIndex = correctIndex;
    } else if (typeof body.correctIndex === "number" && Number.isInteger(body.correctIndex)) {
      const opts = (existing.options as string[]) ?? [];
      if (body.correctIndex >= 0 && body.correctIndex < opts.length) {
        updates.correctIndex = body.correctIndex;
      }
    }
    if (typeof body.sortOrder === "number" && Number.isInteger(body.sortOrder)) {
      updates.sortOrder = body.sortOrder;
    }
    const [updated] = await db
      .update(screeningQuestion)
      .set(updates as Record<string, unknown>)
      .where(eq(screeningQuestion.id, questionId))
      .returning();
    return jsonSuccess(updated!);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await requireSuperAdminUser(request);
    const questionId = parseId((await params).id);
    const [deleted] = await db
      .delete(screeningQuestion)
      .where(eq(screeningQuestion.id, questionId))
      .returning({ id: screeningQuestion.id });
    if (!deleted) throw new AppError(404, "NOT_FOUND", "Question not found.");
    return jsonSuccess({ deleted: true, id: deleted.id });
  } catch (error) {
    return toErrorResponse(error);
  }
}
