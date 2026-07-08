import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import * as XLSX from "xlsx";
import { db } from "@/db";
import { creditPool } from "@/db/schema/partners";
import { AppError, toErrorResponse } from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import { getEligibleParticipants } from "@/lib/credits/eligible-participants";

type Params = { params: Promise<{ id: string }> };

function parsePoolId(id: string): number {
  const n = parseInt(id, 10);
  if (!Number.isInteger(n) || n < 1) {
    throw new AppError(400, "INVALID_ID", "Invalid pool id.");
  }
  return n;
}

/**
 * GET: download a ready-to-fill .xlsx pre-populated with every eligible
 * participant (user_id + email) and a blank url column. The admin pastes one
 * sponsor URL per row and re-uploads via the upload-links route.
 */
export async function GET(request: NextRequest, { params }: Params) {
  try {
    await requireSuperAdminUser(request);
    const poolId = parsePoolId((await params).id);

    const [pool] = await db
      .select()
      .from(creditPool)
      .where(eq(creditPool.id, poolId))
      .limit(1);
    if (!pool) throw new AppError(404, "NOT_FOUND", "Credit pool not found.");
    if (pool.distributionType !== "excel_unique") {
      throw new AppError(
        400,
        "POOL_MODE",
        "Template is only for pools with distribution type “Unique links (Excel)”.",
      );
    }

    const participants = await getEligibleParticipants();

    // Headers user_id / url are what the upload parser matches; email is for
    // the admin's reference and is ignored on re-upload.
    const rows = participants.map((p) => ({
      user_id: p.id,
      email: p.email,
      url: "",
    }));
    const sheet = XLSX.utils.json_to_sheet(rows, {
      header: ["user_id", "email", "url"],
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "eligible");
    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    }) as Buffer;

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="eligible-participants.xlsx"',
      },
    });
  } catch (e) {
    return toErrorResponse(e);
  }
}
