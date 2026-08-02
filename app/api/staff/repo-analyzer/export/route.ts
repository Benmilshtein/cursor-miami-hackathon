import type { NextRequest } from "next/server";
import { AppError, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import { buildReposExportCsv } from "@/lib/repo-analyzer/service";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireSessionUser(request);
    if (actor.role !== "judge" && actor.role !== "mentor" && actor.role !== "super_admin") {
      throw new AppError(403, "FORBIDDEN", "Staff only.");
    }

    const csv = await buildReposExportCsv();
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="ship-night-repos.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
