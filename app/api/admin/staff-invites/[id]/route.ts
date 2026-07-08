import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { staffInvite } from "@/db/schema/auth";
import { AppError } from "@/lib/api/http";
import { jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireSuperAdminUser(request);
    const { id } = await context.params;

    if (!id) {
      throw new AppError(400, "MISSING_ID", "Invite id is required.");
    }

    const [deleted] = await db
      .delete(staffInvite)
      .where(eq(staffInvite.id, id))
      .returning({ id: staffInvite.id });

    if (!deleted) {
      throw new AppError(404, "NOT_FOUND", "Invite not found.");
    }

    return jsonSuccess({ deleted: true, id: deleted.id });
  } catch (e) {
    return toErrorResponse(e);
  }
}
