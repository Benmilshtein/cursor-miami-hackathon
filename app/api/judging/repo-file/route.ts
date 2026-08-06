import type { NextRequest } from "next/server";
import { AppError, jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import { fetchRepoFile, RepoFileError, type RepoFileKind } from "@/lib/judging/repo-file";

export const dynamic = "force-dynamic";

/**
 * Read one requirement file (PRD or `.cursorrules`) out of a team's repo.
 *
 * Shared by the judge dashboard and the super-admin views - both need to
 * review the same content, and participant repos are private so the browser
 * cannot fetch them directly.
 */
export async function GET(request: NextRequest) {
  try {
    const actor = await requireSessionUser(request);
    if (actor.role !== "judge" && actor.role !== "super_admin") {
      throw new AppError(403, "FORBIDDEN", "Only judges and admins can read submission files.");
    }

    const { searchParams } = new URL(request.url);
    const teamId = Number(searchParams.get("teamId"));
    if (!Number.isInteger(teamId) || teamId <= 0) {
      throw new AppError(400, "INVALID_INPUT", "Invalid team ID.");
    }

    const kind = searchParams.get("kind");
    if (kind !== "prd" && kind !== "cursorrules") {
      throw new AppError(400, "INVALID_INPUT", "kind must be 'prd' or 'cursorrules'.");
    }

    return jsonSuccess(await fetchRepoFile(teamId, kind as RepoFileKind));
  } catch (error) {
    if (error instanceof RepoFileError) {
      return toErrorResponse(new AppError(error.status, "REPO_FILE_UNAVAILABLE", error.message));
    }
    return toErrorResponse(error);
  }
}
