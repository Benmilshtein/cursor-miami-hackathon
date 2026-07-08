import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

const mockIsRankingFinalized = vi.fn();
const mockGetPublicRankingDetail = vi.fn();

vi.mock("@/lib/scoring/finalization", () => ({
  isRankingFinalized: (...args: unknown[]) => mockIsRankingFinalized(...args),
}));

vi.mock("@/lib/scoring/service", () => ({
  getPublicRankingDetail: (...args: unknown[]) => mockGetPublicRankingDetail(...args),
}));

describe("GET /api/ranking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty ranking when not finalized", async () => {
    mockIsRankingFinalized.mockResolvedValue(false);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.ranking).toEqual([]);
    expect(data.data.totalJudges).toBe(0);
    expect(data.data.finalized).toBe(false);
    expect(mockGetPublicRankingDetail).not.toHaveBeenCalled();
  });

  it("returns actual ranking data when finalized", async () => {
    const fakeDetail = {
      ranking: [
        {
          teamId: 1,
          teamName: "Team Alpha",
          totalAvg: 75,
          grossTotalAvg: 75,
          lateSubmissionPenaltyPoints: 0,
          usesFinalScoreOverride: false,
          avgInnovation: 20,
          avgTechnicalExecution: 18,
          avgAiUsage: 15,
          avgUxUi: 12,
          avgBusinessPotential: 10,
          judgeCount: 3,
          judgeScores: [] as unknown[],
        },
      ],
      judgeSlots: [{ displayName: "Judge" }, null, null, null, null, null],
      criteria: [],
      totalJudges: 3,
    };
    mockIsRankingFinalized.mockResolvedValue(true);
    mockGetPublicRankingDetail.mockResolvedValue(fakeDetail);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.ranking).toEqual(fakeDetail.ranking);
    expect(data.data.judgeSlots).toEqual(fakeDetail.judgeSlots);
    expect(data.data.criteria).toEqual(fakeDetail.criteria);
    expect(data.data.totalJudges).toBe(3);
    expect(data.data.finalized).toBe(true);
    expect(mockGetPublicRankingDetail).toHaveBeenCalledOnce();
  });

  it("returns error response when service throws", async () => {
    mockIsRankingFinalized.mockRejectedValue(new Error("DB error"));

    const res = await GET();
    const data = await res.json();

    expect(res.status).not.toBe(200);
    expect(data.success).toBe(false);
  });
});
