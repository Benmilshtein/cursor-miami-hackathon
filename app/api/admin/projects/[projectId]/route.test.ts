import { describe, it, expect, vi, beforeEach } from "vitest";
import { DELETE } from "./route";

const mockRequireSuperAdminUser = vi.fn();
const mockDeleteProjectForAdmin = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireSuperAdminUser: (...args: unknown[]) => mockRequireSuperAdminUser(...args),
}));

vi.mock("@/lib/projects/service", () => ({
  deleteProjectForAdmin: (...args: unknown[]) => mockDeleteProjectForAdmin(...args),
}));

describe("DELETE /api/admin/projects/[projectId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 and deleted: true on success", async () => {
    mockRequireSuperAdminUser.mockResolvedValue({ id: "admin1" });
    mockDeleteProjectForAdmin.mockResolvedValue(undefined);

    const req = new Request("http://localhost/api/admin/projects/proj-123", {
      method: "DELETE",
    });
    const ctx = { params: Promise.resolve({ projectId: "proj-123" }) };
    const res = await DELETE(req as never, ctx as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.deleted).toBe(true);
    expect(mockDeleteProjectForAdmin).toHaveBeenCalledWith("proj-123");
  });

  it("returns 404 when project not found", async () => {
    const { AppError } = await import("@/lib/api/http");
    mockRequireSuperAdminUser.mockResolvedValue({ id: "admin1" });
    mockDeleteProjectForAdmin.mockRejectedValue(
      new AppError(404, "PROJECT_NOT_FOUND", "Project not found."),
    );

    const req = new Request("http://localhost/api/admin/projects/bad-id", {
      method: "DELETE",
    });
    const ctx = { params: Promise.resolve({ projectId: "bad-id" }) };
    const res = await DELETE(req as never, ctx as never);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error?.code).toBe("PROJECT_NOT_FOUND");
  });
});
