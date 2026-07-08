import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT } from "./route";

const mockRequireSuperAdminUser = vi.fn();
const mockGetProjectDeadline = vi.fn();
const mockSetProjectDeadline = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireSuperAdminUser: (...args: unknown[]) => mockRequireSuperAdminUser(...args),
}));

vi.mock("@/lib/projects/service", () => ({
  getProjectDeadline: (...args: unknown[]) => mockGetProjectDeadline(...args),
  setProjectDeadline: (...args: unknown[]) => mockSetProjectDeadline(...args),
}));

function createRequest(url: string, init?: RequestInit): Request {
  return new Request(url, { method: init?.method ?? "GET", headers: init?.headers, body: init?.body });
}

describe("GET /api/admin/settings/project-deadline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null deadline when not set", async () => {
    mockRequireSuperAdminUser.mockResolvedValue({ id: "admin1" });
    mockGetProjectDeadline.mockResolvedValue(null);

    const req = createRequest("http://localhost/api/admin/settings/project-deadline");
    const res = await GET(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.deadline).toBeNull();
    expect(mockGetProjectDeadline).toHaveBeenCalled();
  });

  it("returns ISO deadline when set", async () => {
    const deadline = new Date("2025-06-15T18:00:00Z");
    mockRequireSuperAdminUser.mockResolvedValue({ id: "admin1" });
    mockGetProjectDeadline.mockResolvedValue(deadline);

    const req = createRequest("http://localhost/api/admin/settings/project-deadline");
    const res = await GET(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.deadline).toBe(deadline.toISOString());
  });
});

describe("PUT /api/admin/settings/project-deadline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clears deadline when body.deadline is null", async () => {
    mockRequireSuperAdminUser.mockResolvedValue({ id: "admin1" });
    mockSetProjectDeadline.mockResolvedValue(null);

    const req = createRequest("http://localhost/api/admin/settings/project-deadline", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deadline: null }),
    });
    const res = await PUT(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.deadline).toBeNull();
    expect(mockSetProjectDeadline).toHaveBeenCalledWith(null);
  });

  it("sets deadline from valid ISO string", async () => {
    const deadline = new Date("2025-07-01T23:59:59Z");
    mockRequireSuperAdminUser.mockResolvedValue({ id: "admin1" });
    mockSetProjectDeadline.mockResolvedValue(deadline);

    const req = createRequest("http://localhost/api/admin/settings/project-deadline", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deadline: "2025-07-01T23:59:59.000Z" }),
    });
    const res = await PUT(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.deadline).toBe(deadline.toISOString());
    expect(mockSetProjectDeadline).toHaveBeenCalledWith(expect.any(Date));
  });

  it("returns 400 for invalid date string", async () => {
    mockRequireSuperAdminUser.mockResolvedValue({ id: "admin1" });

    const req = createRequest("http://localhost/api/admin/settings/project-deadline", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deadline: "not-a-date" }),
    });
    const res = await PUT(req as never);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error?.code).toBe("INVALID_INPUT");
    expect(mockSetProjectDeadline).not.toHaveBeenCalled();
  });
});
