import type { NextRequest } from "next/server";
import {
  AppError,
  jsonSuccess,
  parseJsonBody,
  toErrorResponse,
} from "@/lib/api/http";
import { requireSuperAdminUser } from "@/lib/auth/session";
import {
  deleteTeamForSuperAdmin,
  getTeamDetailsForAdmin,
  updateTeamForAdmin,
} from "@/lib/teams/service";
import { reassignTeamGroup } from "@/lib/peer-voting/service";
import { TEAM_LIMITS } from "@/lib/teams/constants";

function parseVotingGroup(value: unknown): "A" | "B" | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (value === "A" || value === "B") return value;
  throw new AppError(400, "INVALID_INPUT", 'votingGroup must be "A", "B", or null.');
}

function parseTeamId(rawTeamId: string) {
  const teamId = Number(rawTeamId);

  if (!Number.isInteger(teamId) || teamId <= 0) {
    throw new AppError(400, "INVALID_TEAM_ID", "teamId must be a positive integer.");
  }

  return teamId;
}

function parseAdminUpdateTeamBody(body: Record<string, unknown>) {
  const name =
    body.name === undefined
      ? undefined
      : typeof body.name === "string"
        ? body.name.trim()
        : null;
  if (name !== undefined && name !== null && name.length < TEAM_LIMITS.nameMinLength) {
    throw new AppError(
      400,
      "INVALID_INPUT",
      `name must be at least ${TEAM_LIMITS.nameMinLength} characters.`,
    );
  }
  if (
    name !== undefined &&
    name !== null &&
    TEAM_LIMITS.nameMaxLength &&
    name.length > TEAM_LIMITS.nameMaxLength
  ) {
    throw new AppError(400, "INVALID_INPUT", `name must be at most ${TEAM_LIMITS.nameMaxLength} characters.`);
  }

  const description =
    body.description === undefined
      ? undefined
      : body.description === null
        ? null
        : typeof body.description === "string"
          ? body.description.trim()
          : undefined;
  if (
    description !== undefined &&
    description !== null &&
    description.length > TEAM_LIMITS.descriptionMaxLength
  ) {
    throw new AppError(
      400,
      "INVALID_INPUT",
      `description must be at most ${TEAM_LIMITS.descriptionMaxLength} characters.`,
    );
  }

  return { name: name ?? undefined, description };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ teamId: string }> },
) {
  try {
    await requireSuperAdminUser(request);
    const { teamId } = await context.params;
    const result = await getTeamDetailsForAdmin(parseTeamId(teamId));

    return jsonSuccess(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ teamId: string }> },
) {
  try {
    await requireSuperAdminUser(request);
    const { teamId } = await context.params;
    const id = parseTeamId(teamId);
    const body = await parseJsonBody<Record<string, unknown>>(request);
    const input = parseAdminUpdateTeamBody(body);
    const votingGroup = parseVotingGroup(body.votingGroup);

    // Group reassignment is guarded separately (only while voting is closed).
    if (votingGroup !== undefined) {
      await reassignTeamGroup(id, votingGroup);
    }

    if (input.name === undefined && input.description === undefined) {
      const result = await getTeamDetailsForAdmin(id);
      return jsonSuccess(result);
    }

    const result = await updateTeamForAdmin(id, input);
    return jsonSuccess(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ teamId: string }> },
) {
  try {
    await requireSuperAdminUser(request);
    const { teamId } = await context.params;
    await deleteTeamForSuperAdmin(parseTeamId(teamId));
    return jsonSuccess({ ok: true });
  } catch (error) {
    return toErrorResponse(error);
  }
}
