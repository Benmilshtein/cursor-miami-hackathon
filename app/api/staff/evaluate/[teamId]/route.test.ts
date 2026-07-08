import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { AppError } from "@/lib/api/http";

const mockRequireSessionUser = vi.fn();
const mockIsRankingFinalized = vi.fn();
const mockGetScoreByJudgeAndTeam = vi.fn();
const mockUpsertScore = vi.fn();
const mockNotifyRankingUpdate = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireSessionUser: (...args: unknown[]) => mockRequireSessionUser(...args),
}));

vi.mock("@/lib/scoring/finalization", () => ({
  isRankingFinalized: (...args: unknown[]) => mockIsRankingFinalized(...args),
}));

vi.mock("@/lib/scoring/service", () => ({
  getScoreByJudgeAndTeam: (...args: unknown[]) => mockGetScoreByJudgeAndTeam(...args),
  upsertScore: (...args: unknown[]) => mockUpsertScore(...args),
}));

vi.mock("@/lib/scoring/events", () => ({
  notifyRankingUpdate: (...args: unknown[]) => mockNotifyRankingUpdate(...args),
}));

const mockLimit = vi.fn();
const mockWhere = vi.fn().mockReturnValue({ limit: mockLimit });
const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

vi.mock("@/db", () => ({
  db: { select: (...args: unknown[]) => mockSelect(...args) },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn(),
}));

vi.mock("@/db/schema/auth", () => ({
  team: {},
}));

vi.mock("@/db/schema/projects", () => ({
  project: {},
}));

function createRequest(url: string, init?: RequestInit): Request {
  return new Request(url, {
    method: init?.method ?? "GET",
    headers: init?.headers,
    body: init?.body,
  });
}

function makeCtx(teamId: string) {
  return { params: Promise.resolve({ teamId }) };
}

function setupApprovedTeamWithProject(teamId: number) {
  mockLimit
    .mockResolvedValueOnce([{ id: teamId, screeningStatus: "approved" }])
    .mockResolvedValueOnce([{ id: 99 }]);
}

describe("GET /api/staff/evaluate/[teamId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWhere.mockReturnValue({ limit: mockLimit });
    mockFrom.mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });
  });

  it("returns 403 when actor is not a judge", async () => {
    mockRequireSessionUser.mockResolvedValue({ id: "user1", role: "participant" });

    const req = createRequest("http://localhost/api/staff/evaluate/1");
    const res = await GET(req as never, makeCtx("1") as never);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error?.code).toBe("FORBIDDEN");
  });

  it("returns 403 when actor is a mentor", async () => {
    mockRequireSessionUser.mockResolvedValue({ id: "user2", role: "mentor" });

    const req = createRequest("http://localhost/api/staff/evaluate/1");
    const res = await GET(req as never, makeCtx("1") as never);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error?.code).toBe("FORBIDDEN");
  });

  it("returns 403 when not authenticated", async () => {
    mockRequireSessionUser.mockRejectedValue(new AppError(401, "UNAUTHORIZED", "Unauthorized"));

    const req = createRequest("http://localhost/api/staff/evaluate/1");
    const res = await GET(req as never, makeCtx("1") as never);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it("returns the judge's score for the team", async () => {
    mockRequireSessionUser.mockResolvedValue({ id: "judge1", role: "judge" });
    setupApprovedTeamWithProject(1);
    const fakeScore = {
      id: "score-1",
      teamId: 1,
      judgeUserId: "judge1",
      innovation: 20,
      technicalExecution: 18,
      aiUsage: 15,
      uxUi: 12,
      businessPotential: 10,
      comment: "Good work",
    };
    mockGetScoreByJudgeAndTeam.mockResolvedValue(fakeScore);

    const req = createRequest("http://localhost/api/staff/evaluate/1");
    const res = await GET(req as never, makeCtx("1") as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(fakeScore);
    expect(mockGetScoreByJudgeAndTeam).toHaveBeenCalledWith("judge1", 1);
  });
});

describe("POST /api/staff/evaluate/[teamId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockWhere.mockReturnValue({ limit: mockLimit });
    mockFrom.mockReturnValue({ where: mockWhere });
    mockSelect.mockReturnValue({ from: mockFrom });
  });

  it("returns 403 when actor is not a judge", async () => {
    mockRequireSessionUser.mockResolvedValue({ id: "user1", role: "participant" });

    const req = createRequest("http://localhost/api/staff/evaluate/1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ innovation: 20 }),
    });
    const res = await POST(req as never, makeCtx("1") as never);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error?.code).toBe("FORBIDDEN");
    expect(mockUpsertScore).not.toHaveBeenCalled();
  });

  it("returns 403 RANKING_FINALIZED when ranking is published", async () => {
    mockRequireSessionUser.mockResolvedValue({ id: "judge1", role: "judge" });
    mockIsRankingFinalized.mockResolvedValue(true);

    const req = createRequest("http://localhost/api/staff/evaluate/1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ innovation: 20 }),
    });
    const res = await POST(req as never, makeCtx("1") as never);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error?.code).toBe("RANKING_FINALIZED");
    expect(mockUpsertScore).not.toHaveBeenCalled();
  });

  it("saves score and notifies when judge submits valid scores", async () => {
    mockRequireSessionUser.mockResolvedValue({ id: "judge1", role: "judge" });
    mockIsRankingFinalized.mockResolvedValue(false);
    setupApprovedTeamWithProject(1);
    const savedScore = {
      id: "score-1",
      teamId: 1,
      judgeUserId: "judge1",
      innovation: 20,
      technicalExecution: 18,
      aiUsage: 15,
      uxUi: 12,
      businessPotential: 10,
      comment: "Nice",
    };
    mockUpsertScore.mockResolvedValue(savedScore);

    const req = createRequest("http://localhost/api/staff/evaluate/1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        innovation: 20,
        technicalExecution: 18,
        aiUsage: 15,
        uxUi: 12,
        businessPotential: 10,
        comment: "Nice",
      }),
    });
    const res = await POST(req as never, makeCtx("1") as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(savedScore);
    expect(mockUpsertScore).toHaveBeenCalledWith(
      "judge1",
      1,
      { innovation: 20, technicalExecution: 18, aiUsage: 15, uxUi: 12, businessPotential: 10 },
      "Nice",
    );
    expect(mockNotifyRankingUpdate).toHaveBeenCalledOnce();
  });

  it("clamps scores to their max values", async () => {
    mockRequireSessionUser.mockResolvedValue({ id: "judge1", role: "judge" });
    mockIsRankingFinalized.mockResolvedValue(false);
    setupApprovedTeamWithProject(1);
    mockUpsertScore.mockResolvedValue({ id: "score-1" });

    const req = createRequest("http://localhost/api/staff/evaluate/1", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        innovation: 999,
        technicalExecution: 999,
        aiUsage: 999,
        uxUi: 999,
        businessPotential: 999,
      }),
    });
    await POST(req as never, makeCtx("1") as never);

    expect(mockUpsertScore).toHaveBeenCalledWith(
      "judge1",
      1,
      { innovation: 25, technicalExecution: 25, aiUsage: 20, uxUi: 15, businessPotential: 15 },
      null,
    );
  });
});
