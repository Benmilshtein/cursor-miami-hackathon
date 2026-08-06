import type { NextRequest } from "next/server";
import { jsonSuccess, parseJsonBody, toErrorResponse } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import { upsertAppLinks } from "@/lib/projects/service";

function toStringOrNull(value: unknown): string | null {
  return value == null ? null : typeof value === "string" ? value : String(value);
}

/**
 * Set (or clear) the team's public app URL, GitHub URL, and PRD link. Separate
 * from POST/PATCH /api/projects/my so the approval-gated full submission flow
 * is untouched.
 */
export async function PUT(request: NextRequest) {
  try {
    const actor = await requireSessionUser(request);
    const body = await parseJsonBody<{
      appUrl?: unknown;
      githubUrl?: unknown;
      prdUrl?: unknown;
    }>(request);
    const appUrl = toStringOrNull(body.appUrl);
    const githubUrl = body.githubUrl === undefined ? undefined : toStringOrNull(body.githubUrl);
    const prdUrl = body.prdUrl === undefined ? undefined : toStringOrNull(body.prdUrl);
    const row = await upsertAppLinks(actor, { appUrl, githubUrl, prdUrl });
    return jsonSuccess(row);
  } catch (error) {
    return toErrorResponse(error);
  }
}
