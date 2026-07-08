import type { NextRequest } from "next/server";
import { jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import { deleteProjectForAdmin } from "@/lib/projects/service";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    await requireSuperAdminUser(request);
    const { projectId } = await context.params;
    await deleteProjectForAdmin(projectId);
    return jsonSuccess({ deleted: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
