import { getPublicRankingDetail } from "@/lib/scoring/service";
import { isRankingFinalized } from "@/lib/scoring/finalization";
import { jsonSuccess, toErrorResponse } from "@/lib/api/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const finalized = await isRankingFinalized();
    if (!finalized) {
      return jsonSuccess({ ranking: [], totalJudges: 0, finalized: false });
    }
    const detail = await getPublicRankingDetail();
    return jsonSuccess({
      ranking: detail.ranking,
      judgeSlots: detail.judgeSlots,
      criteria: detail.criteria,
      totalJudges: detail.totalJudges,
      finalized: true,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
