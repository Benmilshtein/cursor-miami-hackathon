import type { NextRequest } from "next/server";
import { toErrorResponse } from "@/lib/api/http";
import { requireAnalyzerStaff } from "@/lib/repo-analyzer/auth";
import { readRepoMetrics } from "@/lib/repo-analyzer/service";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ repoId: string }> },
) {
  try {
    await requireAnalyzerStaff(request);
    const { repoId } = await context.params;
    const data = readRepoMetrics(decodeURIComponent(repoId));
    if (!data) {
      return Response.json({ error: "metrics not found" }, { status: 404 });
    }
    return Response.json(data);
  } catch (error) {
    return toErrorResponse(error);
  }
}
