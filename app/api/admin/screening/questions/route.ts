import type { NextRequest } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { screeningQuestion } from "@/db/schema/screening";
import { AppError, jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdminUser(request);
    const list = await db
      .select()
      .from(screeningQuestion)
      .orderBy(asc(screeningQuestion.sortOrder), asc(screeningQuestion.id));
    return jsonSuccess({ questions: list });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdminUser(request);
    const body = await parseJsonBody<{
      title: string;
      description?: string;
      options: string[];
      correctIndex: number;
      sortOrder?: number;
    }>(request);
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) throw new AppError(400, "INVALID_INPUT", "title is required.");
    const options = Array.isArray(body.options) ? body.options : [];
    if (options.length === 0) {
      throw new AppError(400, "INVALID_INPUT", "options must be a non-empty array.");
    }
    const correctIndex =
      typeof body.correctIndex === "number" && Number.isInteger(body.correctIndex)
        ? body.correctIndex
        : 0;
    if (correctIndex < 0 || correctIndex >= options.length) {
      throw new AppError(400, "INVALID_INPUT", "correctIndex must be within options range.");
    }
    const sortOrder =
      typeof body.sortOrder === "number" && Number.isInteger(body.sortOrder)
        ? body.sortOrder
        : 0;
    const description =
      typeof body.description === "string" ? body.description.trim() || null : null;
    const [created] = await db
      .insert(screeningQuestion)
      .values({
        title,
        description,
        options,
        correctIndex,
        sortOrder,
      })
      .returning();
    return jsonSuccess(created!, 201);
  } catch (error) {
    return toErrorResponse(error);
  }
}
