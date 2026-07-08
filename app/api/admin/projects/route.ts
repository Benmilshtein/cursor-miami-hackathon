import type { NextRequest } from "next/server";
import { jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import { listProjectsForAdmin } from "@/lib/projects/service";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const num = parseInt(value, 10);
  return Number.isNaN(num) || num < 0 ? fallback : num;
}

export async function GET(request: NextRequest) {
  try {
    await requireSuperAdminUser(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || undefined;

    if (searchParams.get("all") === "true") {
      const data = await listProjectsForAdmin({ all: true, search });
      return jsonSuccess(data);
    }

    const limit = Math.min(parsePositiveInt(searchParams.get("limit"), DEFAULT_LIMIT), MAX_LIMIT);
    const offset = parsePositiveInt(searchParams.get("offset"), 0);

    const data = await listProjectsForAdmin({ limit, offset, search });
    return jsonSuccess(data);
  } catch (error) {
    return toErrorResponse(error);
  }
}
