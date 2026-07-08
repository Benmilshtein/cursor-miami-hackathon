import type { NextRequest } from "next/server";
import { and, desc, eq, ilike, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { team, user } from "@/db/schema/auth";
import { teamMember } from "@/db/schema/teams";
import { AppError, jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parsePositiveInt(value: string | null, fallback: number, field: string) {
  if (value === null) return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) {
    throw new AppError(400, "INVALID_QUERY", `${field} must be a non-negative integer.`);
  }
  return n;
}

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdminUser(request);
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") === "true";
    const limit = all
      ? undefined
      : Math.min(
        parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT, "limit"),
        MAX_LIMIT
      );
    const offset = all ? 0 : parsePositiveInt(searchParams.get("offset"), 0, "offset");
    const search = searchParams.get("search")?.trim() || undefined;
    const status = searchParams.get("status")?.trim();
    const screeningStatus =
      status === "draft" || status === "submitted" || status === "approved" || status === "rejected"
        ? status
        : undefined;

    const filters = [];
    if (screeningStatus) {
      filters.push(eq(team.screeningStatus, screeningStatus));
    }
    if (search) {
      filters.push(ilike(team.name, `%${search}%`));
    }
    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    const rowsQuery = db
      .select({
        id: team.id,
        name: team.name,
        description: team.description,
        memberCount: team.memberCount,
        joinCode: team.joinCode,
        screeningStatus: team.screeningStatus,
        screeningSubmittedAt: team.screeningSubmittedAt,
        screeningRejectedAt: team.screeningRejectedAt,
        screeningApprovedAt: team.screeningApprovedAt,
        createdAt: team.createdAt,
        leadUserId: user.id,
        leadName: user.name,
        leadEmail: user.email,
      })
      .from(team)
      .leftJoin(
        teamMember,
        and(
          eq(teamMember.teamId, team.id),
          eq(teamMember.role, "lead"),
          isNull(teamMember.leftAt)
        )
      )
      .leftJoin(user, eq(user.id, teamMember.userId))
      .where(whereClause)
      .orderBy(desc(team.screeningSubmittedAt), desc(team.createdAt));

    const rows = all
      ? await rowsQuery
      : await rowsQuery.limit(limit!).offset(offset);

    const [totalRow] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(team)
      .where(whereClause);

    return jsonSuccess({
      teams: rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        memberCount: r.memberCount,
        joinCode: r.joinCode,
        screeningStatus: r.screeningStatus,
        screeningSubmittedAt: r.screeningSubmittedAt,
        screeningRejectedAt: r.screeningRejectedAt,
        screeningApprovedAt: r.screeningApprovedAt,
        createdAt: r.createdAt,
        lead: r.leadUserId
          ? { userId: r.leadUserId, name: r.leadName, email: r.leadEmail }
          : null,
      })),
      total: totalRow?.total ?? 0,
      limit: all ? totalRow?.total ?? 0 : limit,
      offset,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
