import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT } from "./route";
import { AppError } from "@/lib/api/http";

const mockRequireSuperAdminUser = vi.fn();
const mockIsRankingFinalized = vi.fn();
const mockSetRankingFinalized = vi.fn();
const mockNotifyRankingUpdate = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireSuperAdminUser: (...args: unknown[]) => mockRequireSuperAdminUser(...args),
}));

vi.mock("@/lib/scoring/finalization", () => ({
  isRankingFinalized: (...args: unknown[]) => mockIsRankingFinalized(...args),
  setRankingFinalized: (...args: unknown[]) => mockSetRankingFinalized(...args),
}));

vi.mock("@/lib/scoring/events", () => ({
  notifyRankingUpdate: (...args: unknown[]) => mockNotifyRankingUpdate(...args),
}));

function createRequest(url: string, init?: RequestInit): Request {
  return new Request(url, {
    method: init?.method ?? "GET",
    headers: init?.headers,
    body: init?.body,
  });
}

describe("GET /api/admin/settings/ranking-finalized", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when not super admin", async () => {
    mockRequireSuperAdminUser.mockRejectedValue(new AppError(403, "FORBIDDEN", "Forbidden"));

    const req = createRequest("http://localhost/api/admin/settings/ranking-finalized");
    const res = await GET(req as never);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it("returns finalized: false when not yet finalized", async () => {
    mockRequireSuperAdminUser.mockResolvedValue({ id: "admin1" });
    mockIsRankingFinalized.mockResolvedValue(false);

    const req = createRequest("http://localhost/api/admin/settings/ranking-finalized");
    const res = await GET(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.finalized).toBe(false);
  });

  it("returns finalized: true when finalized", async () => {
    mockRequireSuperAdminUser.mockResolvedValue({ id: "admin1" });
    mockIsRankingFinalized.mockResolvedValue(true);

    const req = createRequest("http://localhost/api/admin/settings/ranking-finalized");
    const res = await GET(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.finalized).toBe(true);
  });
});

describe("PUT /api/admin/settings/ranking-finalized", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when not super admin", async () => {
    mockRequireSuperAdminUser.mockRejectedValue(new AppError(403, "FORBIDDEN", "Forbidden"));

    const req = createRequest("http://localhost/api/admin/settings/ranking-finalized", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ finalized: true }),
    });
    const res = await PUT(req as never);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
    expect(mockSetRankingFinalized).not.toHaveBeenCalled();
    expect(mockNotifyRankingUpdate).not.toHaveBeenCalled();
  });

  it("publishes results (sets finalized: true) and notifies", async () => {
    mockRequireSuperAdminUser.mockResolvedValue({ id: "admin1" });
    mockSetRankingFinalized.mockResolvedValue(undefined);

    const req = createRequest("http://localhost/api/admin/settings/ranking-finalized", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ finalized: true }),
    });
    const res = await PUT(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.finalized).toBe(true);
    expect(mockSetRankingFinalized).toHaveBeenCalledWith(true);
    expect(mockNotifyRankingUpdate).toHaveBeenCalledOnce();
  });

  it("unpublishes results (sets finalized: false) and notifies", async () => {
    mockRequireSuperAdminUser.mockResolvedValue({ id: "admin1" });
    mockSetRankingFinalized.mockResolvedValue(undefined);

    const req = createRequest("http://localhost/api/admin/settings/ranking-finalized", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ finalized: false }),
    });
    const res = await PUT(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.finalized).toBe(false);
    expect(mockSetRankingFinalized).toHaveBeenCalledWith(false);
    expect(mockNotifyRankingUpdate).toHaveBeenCalledOnce();
  });
});
