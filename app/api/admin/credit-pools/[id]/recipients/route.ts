import type { NextRequest } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { team, user } from "@/db/schema/auth";
import { jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";

/**
 * GET: data for the disburse pickers - active teams (with member counts) and
 * all participants (id, name, email, team). Used to choose who receives links.
 */
export async function GET(request: NextRequest) {
  try {
    await requireSuperAdminUser(request);

    const [teams, participants] = await Promise.all([
      db
        .select({ id: team.id, name: team.name, memberCount: team.memberCount })
        .from(team)
        .where(eq(team.status, "active"))
        .orderBy(asc(team.name)),
      db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          teamId: user.teamId,
        })
        .from(user)
        .where(eq(user.role, "participant"))
        .orderBy(asc(user.name)),
    ]);

    return jsonSuccess({ teams, participants });
  } catch (e) {
    return toErrorResponse(e);
  }
}
