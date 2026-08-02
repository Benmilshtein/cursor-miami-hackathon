import type { NextRequest } from "next/server";
import { toErrorResponse } from "@/lib/api/http";
import { requireAnalyzerStaff } from "@/lib/repo-analyzer/auth";
import { getHcmcSummary } from "@/lib/repo-analyzer/service";

/** HCMC-compatible: GET /api/summary → { rows } */
export async function GET(request: NextRequest) {
  try {
    await requireAnalyzerStaff(request);
    const data = await getHcmcSummary();
    return Response.json(data);
  } catch (error) {
    return toErrorResponse(error);
  }
}
