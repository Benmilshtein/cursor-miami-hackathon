import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, PATCH } from "./route";

const mockRequireSessionUser = vi.fn();
const mockGetProjectForTeam = vi.fn();
const mockGetProjectDeadline = vi.fn();
const mockCreateProject = vi.fn();
const mockUpdateProject = vi.fn();

vi.mock("@/lib/auth/session", () => ({
  requireSessionUser: (...args: unknown[]) => mockRequireSessionUser(...args),
}));

vi.mock("@/lib/projects/service", () => ({
  getProjectForTeam: (...args: unknown[]) => mockGetProjectForTeam(...args),
  getProjectDeadline: (...args: unknown[]) => mockGetProjectDeadline(...args),
  createProject: (...args: unknown[]) => mockCreateProject(...args),
  updateProject: (...args: unknown[]) => mockUpdateProject(...args),
}));

function createRequest(url: string, init?: RequestInit): Request {
  return new Request(url, {
    method: init?.method ?? "GET",
    headers: init?.headers,
    body: init?.body,
  });
}

describe("GET /api/projects/my", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when user has no team", async () => {
    mockRequireSessionUser.mockResolvedValue({
      id: "u1",
      teamId: null,
      isTeamLead: false,
    });
    const req = createRequest("http://localhost/api/projects/my");
    const res = await GET(req as never);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error?.code).toBe("NO_TEAM");
    expect(mockGetProjectForTeam).not.toHaveBeenCalled();
  });

  it("returns project and deadline when user has team", async () => {
    const deadline = new Date("2025-12-31T23:59:59Z");
    const projectRow = {
      id: "proj-1",
      teamId: 1,
      name: "My Project",
      description: "Desc",
      githubUrl: "https://github.com/a/b",
      demoUrl: null,
      techStack: null,
      slidesUrl: null,
      videoUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockRequireSessionUser.mockResolvedValue({
      id: "u1",
      teamId: 1,
      isTeamLead: true,
    });
    mockGetProjectForTeam.mockResolvedValue(projectRow);
    mockGetProjectDeadline.mockResolvedValue(deadline);

    const req = createRequest("http://localhost/api/projects/my");
    const res = await GET(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.project).toEqual(projectRow);
    expect(data.data.deadline).toBe(deadline.toISOString());
    expect(mockGetProjectForTeam).toHaveBeenCalledWith(1);
    expect(mockGetProjectDeadline).toHaveBeenCalled();
  });

  it("returns null project and null deadline when team has no project", async () => {
    mockRequireSessionUser.mockResolvedValue({ id: "u1", teamId: 42, isTeamLead: true });
    mockGetProjectForTeam.mockResolvedValue(null);
    mockGetProjectDeadline.mockResolvedValue(null);

    const req = createRequest("http://localhost/api/projects/my");
    const res = await GET(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.project).toBeNull();
    expect(data.data.deadline).toBeNull();
  });
});

describe("POST /api/projects/my", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when name is missing", async () => {
    mockRequireSessionUser.mockResolvedValue({ id: "u1", teamId: 1, isTeamLead: true });
    const req = createRequest("http://localhost/api/projects/my", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ githubUrl: "https://github.com/a/b" }),
    });
    const res = await POST(req as never);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error?.code).toBe("INVALID_INPUT");
    expect(mockCreateProject).not.toHaveBeenCalled();
  });

  it("returns 400 when githubUrl is missing", async () => {
    mockRequireSessionUser.mockResolvedValue({ id: "u1", teamId: 1, isTeamLead: true });
    const req = createRequest("http://localhost/api/projects/my", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "My Project" }),
    });
    const res = await POST(req as never);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(mockCreateProject).not.toHaveBeenCalled();
  });

  it("returns 403 when service throws DEADLINE_PASSED", async () => {
    const { AppError } = await import("@/lib/api/http");
    mockRequireSessionUser.mockResolvedValue({ id: "u1", teamId: 1, isTeamLead: true });
    mockCreateProject.mockRejectedValue(
      new AppError(403, "DEADLINE_PASSED", "The project submission deadline has passed."),
    );

    const req = createRequest("http://localhost/api/projects/my", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "My Project", githubUrl: "https://github.com/a/b" }),
    });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error?.code).toBe("DEADLINE_PASSED");
  });

  it("returns 201 and project on success", async () => {
    const created = {
      id: "proj-1",
      teamId: 1,
      name: "My Project",
      description: "Desc",
      githubUrl: "https://github.com/a/b",
      demoUrl: null,
      techStack: "Next.js",
      slidesUrl: null,
      videoUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockRequireSessionUser.mockResolvedValue({ id: "u1", teamId: 1, isTeamLead: true });
    mockCreateProject.mockResolvedValue(created);

    const req = createRequest("http://localhost/api/projects/my", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "My Project",
        description: "Desc",
        githubUrl: "https://github.com/a/b",
        techStack: "Next.js",
      }),
    });
    const res = await POST(req as never);
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(created);
    expect(mockCreateProject).toHaveBeenCalledWith(
      { id: "u1", teamId: 1, isTeamLead: true },
      expect.objectContaining({
        name: "My Project",
        description: "Desc",
        githubUrl: "https://github.com/a/b",
        techStack: "Next.js",
      }),
    );
  });
});

describe("PATCH /api/projects/my", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when name is set to empty string", async () => {
    mockRequireSessionUser.mockResolvedValue({ id: "u1", teamId: 1, isTeamLead: true });
    const req = createRequest("http://localhost/api/projects/my", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "   " }),
    });
    const res = await PATCH(req as never);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(mockUpdateProject).not.toHaveBeenCalled();
  });

  it("returns 404 when service throws PROJECT_NOT_FOUND", async () => {
    const { AppError } = await import("@/lib/api/http");
    mockRequireSessionUser.mockResolvedValue({ id: "u1", teamId: 1, isTeamLead: true });
    mockUpdateProject.mockRejectedValue(
      new AppError(404, "PROJECT_NOT_FOUND", "No project found for this team."),
    );

    const req = createRequest("http://localhost/api/projects/my", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });
    const res = await PATCH(req as never);
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error?.code).toBe("PROJECT_NOT_FOUND");
  });

  it("returns 200 and updated project on success", async () => {
    const updated = {
      id: "proj-1",
      teamId: 1,
      name: "Updated Name",
      description: "New desc",
      githubUrl: "https://github.com/a/b",
      demoUrl: "https://demo.example.com",
      techStack: null,
      slidesUrl: null,
      videoUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockRequireSessionUser.mockResolvedValue({ id: "u1", teamId: 1, isTeamLead: true });
    mockUpdateProject.mockResolvedValue(updated);

    const req = createRequest("http://localhost/api/projects/my", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Updated Name",
        description: "New desc",
        demoUrl: "https://demo.example.com",
      }),
    });
    const res = await PATCH(req as never);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual(updated);
    expect(mockUpdateProject).toHaveBeenCalledWith(
      { id: "u1", teamId: 1, isTeamLead: true },
      expect.objectContaining({
        name: "Updated Name",
        description: "New desc",
        demoUrl: "https://demo.example.com",
      }),
    );
  });
});
