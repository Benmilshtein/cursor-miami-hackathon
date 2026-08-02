import type { NextRequest } from "next/server";
import { toErrorResponse } from "@/lib/api/http";
import { requireAnalyzerStaff } from "@/lib/repo-analyzer/auth";
import { getHcmcJudges } from "@/lib/repo-analyzer/service";

/** HCMC-compatible: GET /api/judges */
export async function GET(request: NextRequest) {
  try {
    await requireAnalyzerStaff(request);
    const data = await getHcmcJudges();
    return Response.json(data);
  } catch (error) {
    return toErrorResponse(error);
  }
}
