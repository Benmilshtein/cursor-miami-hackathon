import type { NextRequest } from "next/server";
import { toErrorResponse } from "@/lib/api/http";
import { requireAnalyzerStaff } from "@/lib/repo-analyzer/auth";
import { buildReposExportCsv } from "@/lib/repo-analyzer/service";

export async function GET(request: NextRequest) {
  try {
    await requireAnalyzerStaff(request);
    const csv = await buildReposExportCsv();
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'attachment; filename="ship-night-repos.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
