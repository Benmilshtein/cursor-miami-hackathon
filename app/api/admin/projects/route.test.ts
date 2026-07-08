import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

const mockRequireSuperAdminUser = vi.fn();
const mockListProjectsForAdmin = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireSuperAdminUser: (...args: unknown[]) => mockRequireSuperAdminUser(...args),
}));

vi.mock("@/lib/projects/service", () => ({
  listProjectsForAdmin: (...args: unknown[]) => mockListProjectsForAdmin(...args),
}));

function createRequest(url: string): Request {
  return new Request(url);
}

describe("GET /api/admin/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns paginated projects list", async () => {
    const listData = {
      projects: [
        {
          id: "p1",
          teamId: 1,
          teamName: "Team A",
          name: "Project Alpha",
          description: "Desc",
          githubUrl: "https://github.com/a/b",
          demoUrl: null,
          techStack: "Next.js",
          slidesUrl: null,
          videoUrl: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      total: 1,
      limit: 20,
      offset: 0,
    };
    mockRequireSuperAdminUser.mockResolvedValue({ id: "admin1" });
    mockListProjectsForAdmin.mockResolvedValue(listData);

    const req = createRequest("http://localhost/api/admin/projects");
    const res = await GET(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.projects).toHaveLength(1);
    expect(data.data.projects[0].name).toBe("Project Alpha");
    expect(data.data.total).toBe(1);
    expect(mockListProjectsForAdmin).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 20, offset: 0 }),
    );
  });

  it("passes search and pagination params", async () => {
    mockRequireSuperAdminUser.mockResolvedValue({ id: "admin1" });
    mockListProjectsForAdmin.mockResolvedValue({ projects: [], total: 0, limit: 10, offset: 20 });

    const req = createRequest(
      "http://localhost/api/admin/projects?search=alpha&limit=10&offset=20",
    );
    const res = await GET(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockListProjectsForAdmin).toHaveBeenCalledWith({
      limit: 10,
      offset: 20,
      search: "alpha",
    });
  });

  it("returns full projects list when all=true", async () => {
    const listData = {
      projects: [
        {
          id: "p1",
          teamId: 1,
          teamName: "Team A",
          name: "Project Alpha",
          description: null,
          githubUrl: "https://github.com/a/b",
          demoUrl: null,
          techStack: null,
          slidesUrl: null,
          videoUrl: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      total: 1,
      limit: 1,
      offset: 0,
    };
    mockRequireSuperAdminUser.mockResolvedValue({ id: "admin1" });
    mockListProjectsForAdmin.mockResolvedValue(listData);

    const req = createRequest("http://localhost/api/admin/projects?all=true");
    const res = await GET(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.projects).toHaveLength(1);
    expect(mockListProjectsForAdmin).toHaveBeenCalledWith({
      all: true,
      search: undefined,
    });
  });

  it("passes search with all=true", async () => {
    mockRequireSuperAdminUser.mockResolvedValue({ id: "admin1" });
    mockListProjectsForAdmin.mockResolvedValue({ projects: [], total: 0, limit: 0, offset: 0 });

    const req = createRequest("http://localhost/api/admin/projects?all=true&search=beta");
    const res = await GET(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockListProjectsForAdmin).toHaveBeenCalledWith({
      all: true,
      search: "beta",
    });
  });
});
