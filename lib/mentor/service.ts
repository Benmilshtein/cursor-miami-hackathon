import { and, asc, eq, inArray, isNull, not, or } from "drizzle-orm";
import { db } from "@/db";
import { mentorRequest } from "@/db/schema/mentor";
import { team, user } from "@/db/schema/auth";
import { project } from "@/db/schema/projects";
import { AppError } from "@/lib/api/http";
import { notifyMentor, notifyTeam } from "./events";

const ACTIVE_STATUSES = ["pending", "assigned", "matched"] as const;
type ActiveStatus = (typeof ACTIVE_STATUSES)[number];

// ─── Read helpers ──────────────────────────────────────────────────────────────

export async function getActiveRequestForTeam(teamId: number) {
  const [req] = await db
    .select()
    .from(mentorRequest)
    .where(
      and(
        eq(mentorRequest.teamId, teamId),
        inArray(mentorRequest.status, [...ACTIVE_STATUSES]),
      ),
    )
    .limit(1);
  return req ?? null;
}

export async function getActiveRequestForMentor(mentorUserId: string) {
  const [req] = await db
    .select({
      id: mentorRequest.id,
      teamId: mentorRequest.teamId,
      status: mentorRequest.status,
      assignedMentorId: mentorRequest.assignedMentorId,
      acceptedMentorId: mentorRequest.acceptedMentorId,
      requestedAt: mentorRequest.requestedAt,
      matchedAt: mentorRequest.matchedAt,
      teamName: team.name,
      projectName: project.name,
      projectDescription: project.description,
      projectGithubUrl: project.githubUrl,
      projectDemoUrl: project.demoUrl,
    })
    .from(mentorRequest)
    .innerJoin(team, eq(mentorRequest.teamId, team.id))
    .leftJoin(project, eq(team.id, project.teamId))
    .where(
      and(
        or(
          eq(mentorRequest.assignedMentorId, mentorUserId),
          eq(mentorRequest.acceptedMentorId, mentorUserId),
        ),
        inArray(mentorRequest.status, ["assigned", "matched"]),
      ),
    )
    .limit(1);
  return req ?? null;
}

export async function getAllTeamsWithRequestStatus() {
  const teams = await db
    .select({
      id: team.id,
      name: team.name,
      projectName: project.name,
      projectDescription: project.description,
      projectGithubUrl: project.githubUrl,
      projectDemoUrl: project.demoUrl,
      requestId: mentorRequest.id,
      requestStatus: mentorRequest.status,
      acceptedMentorId: mentorRequest.acceptedMentorId,
    })
    .from(team)
    .leftJoin(project, eq(team.id, project.teamId))
    .leftJoin(
      mentorRequest,
      and(
        eq(mentorRequest.teamId, team.id),
        inArray(mentorRequest.status, [...ACTIVE_STATUSES]),
      ),
    )
    .where(eq(team.screeningStatus, "approved"))
    .orderBy(team.name);

  return teams.map((t) => ({
    id: t.id,
    name: t.name,
    project: t.projectName
      ? {
          name: t.projectName,
          description: t.projectDescription,
          githubUrl: t.projectGithubUrl,
          demoUrl: t.projectDemoUrl,
        }
      : null,
    mentorRequest: t.requestId
      ? {
          id: t.requestId,
          status: t.requestStatus as ActiveStatus,
          hasMentor: t.requestStatus === "matched",
        }
      : null,
  }));
}

// ─── Write operations ───────────────────────────────────────────────────────────

export async function createMentorRequest(teamId: number) {
  const existing = await getActiveRequestForTeam(teamId);
  if (existing) {
    throw new AppError(409, "REQUEST_EXISTS", "Team already has an active mentor request.");
  }

  const [inserted] = await db
    .insert(mentorRequest)
    .values({ teamId, status: "pending" })
    .returning();

  if (!inserted) {
    throw new AppError(500, "INSERT_FAILED", "Failed to create mentor request.");
  }

  await tryAssignMentor(inserted.id, []);
  return inserted;
}

export async function cancelMentorRequest(teamId: number) {
  const req = await getActiveRequestForTeam(teamId);
  if (!req) {
    throw new AppError(404, "NOT_FOUND", "No active mentor request to cancel.");
  }
  if (req.status === "matched") {
    throw new AppError(409, "ALREADY_MATCHED", "Cannot cancel a session in progress.");
  }

  await db
    .update(mentorRequest)
    .set({ status: "cancelled", cancelledAt: new Date() })
    .where(eq(mentorRequest.id, req.id));

  notifyTeam(teamId, { type: "cancelled", requestId: req.id });
}

export async function acceptMentorRequest(requestId: string, mentorUserId: string) {
  const [req] = await db
    .select()
    .from(mentorRequest)
    .where(eq(mentorRequest.id, requestId))
    .limit(1);

  if (!req) {
    throw new AppError(404, "NOT_FOUND", "Mentor request not found.");
  }
  if (req.status !== "assigned") {
    throw new AppError(409, "INVALID_STATE", "Request is not in assigned state.");
  }
  if (req.assignedMentorId !== mentorUserId) {
    throw new AppError(403, "NOT_ASSIGNED", "This request is not assigned to you.");
  }

  await db
    .update(mentorRequest)
    .set({
      status: "matched",
      acceptedMentorId: mentorUserId,
      matchedAt: new Date(),
    })
    .where(eq(mentorRequest.id, requestId));

  const mentorUser = await db
    .select({ name: user.name })
    .from(user)
    .where(eq(user.id, mentorUserId))
    .limit(1);

  notifyTeam(req.teamId, {
    type: "matched",
    requestId,
    mentorName: mentorUser[0]?.name ?? null,
  });
}

export async function declineMentorRequest(requestId: string, mentorUserId: string) {
  const [req] = await db
    .select()
    .from(mentorRequest)
    .where(eq(mentorRequest.id, requestId))
    .limit(1);

  if (!req) {
    throw new AppError(404, "NOT_FOUND", "Mentor request not found.");
  }
  if (req.status !== "assigned") {
    throw new AppError(409, "INVALID_STATE", "Request is not in assigned state.");
  }
  if (req.assignedMentorId !== mentorUserId) {
    throw new AppError(403, "NOT_ASSIGNED", "This request is not assigned to you.");
  }

  const updatedDeclined = [...(req.declinedMentorIds ?? []), mentorUserId];

  await db
    .update(mentorRequest)
    .set({
      status: "pending",
      assignedMentorId: null,
      assignedAt: null,
      declinedMentorIds: updatedDeclined,
    })
    .where(eq(mentorRequest.id, requestId));

  notifyTeam(req.teamId, { type: "pending", requestId });

  await tryAssignMentor(requestId, updatedDeclined);
}

export async function completeMentorSession(requestId: string, mentorUserId: string) {
  const [req] = await db
    .select()
    .from(mentorRequest)
    .where(eq(mentorRequest.id, requestId))
    .limit(1);

  if (!req) {
    throw new AppError(404, "NOT_FOUND", "Mentor request not found.");
  }
  if (req.status !== "matched") {
    throw new AppError(409, "INVALID_STATE", "Session is not active.");
  }
  if (req.acceptedMentorId !== mentorUserId) {
    throw new AppError(403, "FORBIDDEN", "You are not the mentor for this session.");
  }

  await db
    .update(mentorRequest)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(mentorRequest.id, requestId));

  notifyTeam(req.teamId, { type: "completed", requestId });

  // Assign this now-free mentor to the oldest pending request
  const [oldest] = await db
    .select({ id: mentorRequest.id, declinedMentorIds: mentorRequest.declinedMentorIds })
    .from(mentorRequest)
    .where(
      and(
        eq(mentorRequest.status, "pending"),
        not(eq(mentorRequest.teamId, req.teamId)),
      ),
    )
    .orderBy(asc(mentorRequest.requestedAt))
    .limit(1);

  if (oldest) {
    const declined = oldest.declinedMentorIds ?? [];
    if (!declined.includes(mentorUserId)) {
      await tryAssignMentor(oldest.id, declined, mentorUserId);
    }
  }
}

// ─── Matching logic ─────────────────────────────────────────────────────────────

async function tryAssignMentor(
  requestId: string,
  declinedMentorIds: string[],
  preferredMentorId?: string,
) {
  // Find all mentors not currently in a matched/assigned session
  const busyMentorIds = await db
    .select({ id: mentorRequest.assignedMentorId })
    .from(mentorRequest)
    .where(
      and(
        inArray(mentorRequest.status, ["assigned", "matched"]),
        not(isNull(mentorRequest.assignedMentorId)),
      ),
    );

  const busyIds = busyMentorIds.map((r) => r.id).filter((id): id is string => id !== null);

  const allMentors = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(eq(user.role, "mentor"));

  const excludeIds = [...new Set([...busyIds, ...declinedMentorIds])];

  let candidate: { id: string; name: string | null } | undefined;

  if (preferredMentorId && !excludeIds.includes(preferredMentorId)) {
    candidate = allMentors.find((m) => m.id === preferredMentorId);
  }

  if (!candidate) {
    candidate = allMentors.find((m) => !excludeIds.includes(m.id));
  }

  if (!candidate) {
    return;
  }

  const [updated] = await db
    .update(mentorRequest)
    .set({
      status: "assigned",
      assignedMentorId: candidate.id,
      assignedAt: new Date(),
    })
    .where(
      and(
        eq(mentorRequest.id, requestId),
        eq(mentorRequest.status, "pending"),
      ),
    )
    .returning({ teamId: mentorRequest.teamId });

  if (!updated) return;

  const [teamRow] = await db
    .select({ name: team.name })
    .from(team)
    .where(eq(team.id, updated.teamId))
    .limit(1);

  notifyMentor(candidate.id, {
    type: "assigned",
    requestId,
    teamId: updated.teamId,
    teamName: teamRow?.name ?? null,
  });
}
