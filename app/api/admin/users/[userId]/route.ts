import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import {
  AppError,
  jsonSuccess,
  parseJsonBody,
  toErrorResponse,
} from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import { deleteUserBySuperAdmin } from "@/lib/teams/service";

const ALLOWED_ROLES = [
  "participant",
  "moderator",
  "reviewer",
  "super_admin",
  "judge",
  "mentor",
] as const;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    await requireSuperAdminUser(request);
    const { userId } = await context.params;

    const [row] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
        teamId: user.teamId,
        isTeamLead: user.isTeamLead,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!row) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found.");
    }

    return jsonSuccess(row);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    await requireSuperAdminUser(request);
    const { userId } = await context.params;
    const body = await parseJsonBody<Record<string, unknown>>(request);

    const role =
      body.role === undefined
        ? undefined
        : typeof body.role === "string" && ALLOWED_ROLES.includes(body.role as (typeof ALLOWED_ROLES)[number])
          ? (body.role as (typeof ALLOWED_ROLES)[number])
          : undefined;

    if (body.role !== undefined && role === undefined) {
      throw new AppError(
        400,
        "INVALID_INPUT",
        `role must be one of: ${ALLOWED_ROLES.join(", ")}.`,
      );
    }

    if (role === undefined) {
      const [existing] = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          teamId: user.teamId,
          createdAt: user.createdAt,
        })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      if (!existing) {
        throw new AppError(404, "USER_NOT_FOUND", "User not found.");
      }
      return jsonSuccess(existing);
    }

    const [updated] = await db
      .update(user)
      .set({ role, updatedAt: new Date() })
      .where(eq(user.id, userId))
      .returning({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        teamId: user.teamId,
        createdAt: user.createdAt,
      });

    if (!updated) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found.");
    }

    return jsonSuccess(updated);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  try {
    const actor = await requireSuperAdminUser(request);
    const { userId } = await context.params;
    await deleteUserBySuperAdmin(actor.id, userId);
    return jsonSuccess({ deleted: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
