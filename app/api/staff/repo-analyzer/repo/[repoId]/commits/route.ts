import type { NextRequest } from "next/server";
import { toErrorResponse } from "@/lib/api/http";
import { requireAnalyzerStaff } from "@/lib/repo-analyzer/auth";
import { readRepoCommits } from "@/lib/repo-analyzer/service";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ repoId: string }> },
) {
  try {
    await requireAnalyzerStaff(request);
    const { repoId } = await context.params;
    const data = await readRepoCommits(decodeURIComponent(repoId));
    return Response.json(data);
  } catch (error) {
    return toErrorResponse(error);
  }
}
