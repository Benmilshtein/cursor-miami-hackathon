import { eq, and, isNull, gt } from "drizzle-orm";
import { db } from "@/db";
import { staffInvite } from "@/db/schema/auth";
import { AppError } from "@/lib/api/http";
import { jsonSuccess, toErrorResponse } from "@/lib/api/http";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token")?.trim();

    if (!token) {
      throw new AppError(400, "MISSING_TOKEN", "Token is required.");
    }

    const [inv] = await db
      .select({ email: staffInvite.email, role: staffInvite.role })
      .from(staffInvite)
      .where(
        and(
          eq(staffInvite.token, token),
          isNull(staffInvite.acceptedAt),
          gt(staffInvite.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!inv) {
      throw new AppError(404, "INVALID_OR_EXPIRED", "Invite link is invalid or has expired.");
    }

    return jsonSuccess({ email: inv.email, role: inv.role });
  } catch (e) {
    return toErrorResponse(e);
  }
}
