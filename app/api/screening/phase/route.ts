import { jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { getScreeningPhase } from "@/lib/screening-phase";

export async function GET() {
  try {
    const phase = await getScreeningPhase();
    return jsonSuccess({ phase });
  } catch (error) {
    return toErrorResponse(error);
  }
}
