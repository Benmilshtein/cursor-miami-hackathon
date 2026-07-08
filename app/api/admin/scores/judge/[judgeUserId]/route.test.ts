import { describe, it, expect, vi, beforeEach } from "vitest";
import { DELETE } from "./route";
import { AppError } from "@/lib/api/http";

const mockRequireSuperAdminUser = vi.fn();
const mockDeleteScoresByJudge = vi.fn();
const mockNotifyRankingUpdate = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireSuperAdminUser: (...args: unknown[]) => mockRequireSuperAdminUser(...args),
}));

vi.mock("@/lib/scoring/service", () => ({
  deleteScoresByJudge: (...args: unknown[]) => mockDeleteScoresByJudge(...args),
}));

vi.mock("@/lib/scoring/events", () => ({
  notifyRankingUpdate: (...args: unknown[]) => mockNotifyRankingUpdate(...args),
}));

function createRequest(url: string): Request {
  return new Request(url, { method: "DELETE" });
}

function makeCtx(judgeUserId: string) {
  return { params: Promise.resolve({ judgeUserId }) };
}

describe("DELETE /api/admin/scores/judge/[judgeUserId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when not super admin", async () => {
    mockRequireSuperAdminUser.mockRejectedValue(new AppError(403, "FORBIDDEN", "Forbidden"));

    const req = createRequest("http://localhost/api/admin/scores/judge/judge1");
    const res = await DELETE(req as never, makeCtx("judge1") as never);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error?.code).toBe("FORBIDDEN");
    expect(mockDeleteScoresByJudge).not.toHaveBeenCalled();
    expect(mockNotifyRankingUpdate).not.toHaveBeenCalled();
  });

  it("deletes scores, notifies, and returns deleted count", async () => {
    mockRequireSuperAdminUser.mockResolvedValue({ id: "admin1" });
    mockDeleteScoresByJudge.mockResolvedValue(12);

    const req = createRequest("http://localhost/api/admin/scores/judge/judge42");
    const res = await DELETE(req as never, makeCtx("judge42") as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.deleted).toBe(12);
    expect(mockDeleteScoresByJudge).toHaveBeenCalledWith("judge42");
    expect(mockNotifyRankingUpdate).toHaveBeenCalledOnce();
  });

  it("returns deleted: 0 when judge had no scores", async () => {
    mockRequireSuperAdminUser.mockResolvedValue({ id: "admin1" });
    mockDeleteScoresByJudge.mockResolvedValue(0);

    const req = createRequest("http://localhost/api/admin/scores/judge/judge99");
    const res = await DELETE(req as never, makeCtx("judge99") as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.deleted).toBe(0);
    expect(mockNotifyRankingUpdate).toHaveBeenCalledOnce();
  });
});
