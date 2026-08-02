import type { NextRequest } from "next/server";
import { AppError, jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import {
  getAnalyzerPaths,
  listAnalyzerSubmissions,
} from "@/lib/repo-analyzer/service";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireSessionUser(request);
    if (actor.role !== "judge" && actor.role !== "mentor" && actor.role !== "super_admin") {
      throw new AppError(403, "FORBIDDEN", "Staff only.");
    }

    const [submissions, paths] = await Promise.all([
      listAnalyzerSubmissions(),
      Promise.resolve(getAnalyzerPaths()),
    ]);

    return jsonSuccess({
      submissions,
      metricsAvailable: paths.hasMetrics,
      source: "hackathon-analyzer",
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
