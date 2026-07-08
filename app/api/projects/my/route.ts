import type { NextRequest } from "next/server";
import {
  AppError,
  jsonSuccess,
  parseJsonBody,
  toErrorResponse,
} from "@/lib/api/http";
import { requireSessionUser } from "@/lib/auth/session";
import {
  createProject,
  getProjectDeadline,
  getProjectForTeam,
  updateProject,
  type CreateProjectInput,
  type UpdateProjectInput,
} from "@/lib/projects/service";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireSessionUser(request);

    if (!actor.teamId) {
      throw new AppError(400, "NO_TEAM", "You are not on a team.");
    }

    const proj = await getProjectForTeam(actor.teamId);
    const deadline = await getProjectDeadline();

    return jsonSuccess({
      project: proj,
      deadline: deadline?.toISOString() ?? null,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await requireSessionUser(request);
    const body = await parseJsonBody<CreateProjectInput>(request);

    if (!body.name?.trim()) {
      throw new AppError(400, "INVALID_INPUT", "Project name is required.");
    }
    if (!body.githubUrl?.trim()) {
      throw new AppError(400, "INVALID_INPUT", "GitHub URL is required.");
    }

    const row = await createProject(actor, {
      name: body.name,
      description: body.description,
      githubUrl: body.githubUrl,
      demoUrl: body.demoUrl,
      techStack: body.techStack,
      slidesUrl: body.slidesUrl,
      videoUrl: body.videoUrl,
    });

    return jsonSuccess(row, 201);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const actor = await requireSessionUser(request);
    const body = await parseJsonBody<UpdateProjectInput>(request);

    if (body.name !== undefined && !body.name.trim()) {
      throw new AppError(400, "INVALID_INPUT", "Project name cannot be empty.");
    }
    if (body.githubUrl !== undefined && !body.githubUrl.trim()) {
      throw new AppError(400, "INVALID_INPUT", "GitHub URL cannot be empty.");
    }

    const row = await updateProject(actor, body);
    return jsonSuccess(row);
  } catch (error) {
    return toErrorResponse(error);
  }
}
