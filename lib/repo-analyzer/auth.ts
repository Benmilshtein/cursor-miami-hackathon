import type { NextRequest } from "next/server";
import { AppError } from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";

export async function requireAnalyzerStaff(request: NextRequest) {
  const actor = await requireSessionUser(request);
  if (
    actor.role !== "judge" &&
    actor.role !== "mentor" &&
    actor.role !== "super_admin"
  ) {
    throw new AppError(403, "FORBIDDEN", "Staff only.");
  }
  return actor;
}
