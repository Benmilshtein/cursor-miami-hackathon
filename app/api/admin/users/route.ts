import type { NextRequest } from "next/server";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema/auth";
import { AppError, jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parsePositiveInt(value: string | null, fallback: number, field: string) {
  if (value === null) {
    return fallback;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    throw new AppError(400, "INVALID_QUERY", `${field} must be a non-negative integer.`);
  }

  return parsedValue;
}

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdminUser(request);

    const { searchParams } = new URL(request.url);
    const limit = Math.min(
      parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT, "limit"),
      MAX_LIMIT,
    );
    const offset = parsePositiveInt(searchParams.get("offset"), 0, "offset");
    const search = searchParams.get("search")?.trim() || undefined;
    const role = searchParams.get("role")?.trim() || undefined;

    const filters = [];

    if (search) {
      const pattern = `%${search}%`;
      filters.push(
        or(
          ilike(user.email, pattern),
          ilike(user.name, pattern),
          ilike(user.firstName ?? "", pattern),
          ilike(user.lastName ?? "", pattern),
        )!,
      );
    }

    if (
      role &&
      ["participant", "moderator", "reviewer", "super_admin", "judge", "mentor"].includes(
        role,
      )
    ) {
      filters.push(
        eq(user.role, role as "participant" | "moderator" | "reviewer" | "super_admin" | "judge" | "mentor"),
      );
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    const [list, countResult] = await Promise.all([
      db
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
        .where(whereClause)
        .orderBy(desc(user.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(user)
        .where(whereClause),
    ]);

    const total = countResult[0]?.count ?? 0;

    return jsonSuccess({
      users: list,
      total,
      limit,
      offset,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
