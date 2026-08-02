import type { NextRequest } from "next/server";
import { toErrorResponse } from "@/lib/api/http";
import { requireAnalyzerStaff } from "@/lib/repo-analyzer/auth";
import { readRepoAi } from "@/lib/repo-analyzer/service";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ repoId: string }> },
) {
  try {
    await requireAnalyzerStaff(request);
    const { repoId } = await context.params;
    const text = readRepoAi(decodeURIComponent(repoId));
    if (text == null) {
      return new Response("AI output not found.", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
    return new Response(text, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
