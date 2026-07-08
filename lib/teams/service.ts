import { randomBytes } from "crypto";
import { and, desc, eq, ilike, isNull, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { team, user } from "@/db/schema/auth";
import { teamInvite, teamMember } from "@/db/schema/teams";
import type { AppSessionUser } from "@/lib/auth/session";
import { createTeamError } from "@/lib/teams/errors";
import {
  TEAM_INVITE_ALPHABET,
  TEAM_LIMITS,
  type TeamMembershipRole,
} from "@/lib/teams/constants";
import type {
  AdminForceMembershipInput,
  CreateTeamInput,
  JoinTeamInput,
  UpdateTeamInput,
} from "@/lib/teams/validation";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbExecutor = typeof db | Transaction;
type TeamRecord = typeof team.$inferSelect;
type TeamMembershipRecord = typeof teamMember.$inferSelect;

type ActiveMembershipRecord = {
  team: TeamRecord;
  membership: TeamMembershipRecord;
};

function now() {
  return new Date();
}

function isFutureDate(value: Date | null | undefined) {
  return value instanceof Date && value.getTime() > Date.now();
}

function createInviteCode() {
  const bytes = randomBytes(TEAM_LIMITS.inviteCodeLength);
  let code = "";

  for (let index = 0; index < TEAM_LIMITS.inviteCodeLength; index += 1) {
    code += TEAM_INVITE_ALPHABET[bytes[index]! % TEAM_INVITE_ALPHABET.length];
  }

  return code;
}

async function generateUniqueInviteCode(executor: DbExecutor) {
  for (let attempt = 0; attempt < TEAM_LIMITS.inviteCodeGenerationAttempts; attempt += 1) {
    const code = createInviteCode();
    const [existingInvite] = await executor
      .select({ id: teamInvite.id })
      .from(teamInvite)
      .where(eq(teamInvite.code, code))
      .limit(1);

    if (!existingInvite) {
      return code;
    }
  }

  throw createTeamError(
    500,
    "INVITE_CODE_GENERATION_FAILED",
    "Failed to generate a unique invite code.",
  );
}

async function clearUserTeamState(executor: DbExecutor, userId: string) {
  await executor
    .update(user)
    .set({
      teamId: null,
      isTeamLead: false,
      updatedAt: now(),
    })
    .where(eq(user.id, userId));
}

async function updateUserTeamState(
  executor: DbExecutor,
  userId: string,
  teamId: number | null,
  isLead: boolean,
) {
  await executor
    .update(user)
    .set({
      teamId,
      isTeamLead: isLead,
      updatedAt: now(),
    })
    .where(eq(user.id, userId));
}

async function getLockedTeam(executor: DbExecutor, teamId: number) {
  const [record] = await executor
    .select()
    .from(team)
    .where(eq(team.id, teamId))
    .limit(1)
    .for("update");

  return record ?? null;
}

async function getActiveMembershipForUser(
  executor: DbExecutor,
  userId: string,
  lock = false,
): Promise<ActiveMembershipRecord | null> {
  const query = executor
    .select({
      team,
      membership: teamMember,
    })
    .from(teamMember)
    .innerJoin(team, eq(teamMember.teamId, team.id))
    .where(and(eq(teamMember.userId, userId), isNull(teamMember.leftAt)))
    .limit(1);

  const [record] = await (lock ? query.for("update") : query);
  return record ?? null;
}

async function getActiveMembershipByUserAndTeam(
  executor: DbExecutor,
  userId: string,
  teamId: number,
  lock = false,
): Promise<TeamMembershipRecord | null> {
  const query = executor
    .select()
    .from(teamMember)
    .where(
      and(
        eq(teamMember.userId, userId),
        eq(teamMember.teamId, teamId),
        isNull(teamMember.leftAt),
      ),
    )
    .limit(1);

  const [record] = await (lock ? query.for("update") : query);
  return record ?? null;
}

async function getActiveLeadMembership(
  executor: DbExecutor,
  teamId: number,
  lock = false,
): Promise<TeamMembershipRecord | null> {
  const query = executor
    .select()
    .from(teamMember)
    .where(
      and(
        eq(teamMember.teamId, teamId),
        eq(teamMember.role, "lead"),
        isNull(teamMember.leftAt),
      ),
    )
    .limit(1);

  const [record] = await (lock ? query.for("update") : query);
  return record ?? null;
}

function assertInviteSettings(
  inviteExpiresAt: Date | null | undefined,
  inviteMaxUses: number | null | undefined,
) {
  if (inviteExpiresAt && !isFutureDate(inviteExpiresAt)) {
    throw createTeamError(
      400,
      "INVALID_INVITE_EXPIRY",
      "inviteExpiresAt must be a future date.",
    );
  }

  if (inviteMaxUses !== undefined && inviteMaxUses !== null && inviteMaxUses > TEAM_LIMITS.maxMembers) {
    throw createTeamError(
      400,
      "INVALID_INVITE_MAX_USES",
      `inviteMaxUses cannot exceed ${TEAM_LIMITS.maxMembers}.`,
    );
  }
}

async function revokeActiveInvites(executor: DbExecutor, teamId: number) {
  await executor
    .update(teamInvite)
    .set({
      revokedAt: now(),
      updatedAt: now(),
    })
    .where(and(eq(teamInvite.teamId, teamId), isNull(teamInvite.revokedAt)));
}

async function createInviteForTeam(
  executor: DbExecutor,
  params: {
    teamId: number;
    createdByUserId: string;
    expiresAt: Date | null;
    maxUses: number | null;
    revokeCurrent?: boolean;
  },
) {
  const code = await generateUniqueInviteCode(executor);

  if (params.revokeCurrent ?? true) {
    await revokeActiveInvites(executor, params.teamId);
  }

  const [invite] = await executor
    .insert(teamInvite)
    .values({
      teamId: params.teamId,
      code,
      createdByUserId: params.createdByUserId,
      expiresAt: params.expiresAt,
      maxUses: params.maxUses,
    })
    .returning();

  await executor
    .update(team)
    .set({
      joinCode: code,
      updatedAt: now(),
    })
    .where(eq(team.id, params.teamId));

  return invite;
}

async function reactivateOrUpdateTeamCount(
  executor: DbExecutor,
  teamRow: TeamRecord,
  memberCount: number,
) {
  await executor
    .update(team)
    .set({
      memberCount,
      status: memberCount > 0 ? "active" : teamRow.status,
      archivedAt: memberCount > 0 ? null : teamRow.archivedAt,
      updatedAt: now(),
    })
    .where(eq(team.id, teamRow.id));
}

async function archiveTeam(executor: DbExecutor, teamId: number) {
  await executor
    .update(team)
    .set({
      status: "archived",
      memberCount: 0,
      archivedAt: now(),
      updatedAt: now(),
    })
    .where(eq(team.id, teamId));

  await revokeActiveInvites(executor, teamId);
}

async function promoteMemberToLead(
  executor: DbExecutor,
  teamId: number,
  nextLeadUserId: string,
) {
  const targetMembership = await getActiveMembershipByUserAndTeam(
    executor,
    nextLeadUserId,
    teamId,
    true,
  );

  if (!targetMembership) {
    throw createTeamError(
      404,
      "MEMBER_NOT_FOUND",
      "The selected user is not an active member of this team.",
    );
  }

  if (targetMembership.role === "lead") {
    await updateUserTeamState(executor, targetMembership.userId, teamId, true);
    return targetMembership;
  }

  const currentLead = await getActiveLeadMembership(executor, teamId, true);

  if (currentLead && currentLead.userId !== targetMembership.userId) {
    await executor
      .update(teamMember)
      .set({
        role: "member",
        updatedAt: now(),
      })
      .where(eq(teamMember.id, currentLead.id));

    await updateUserTeamState(executor, currentLead.userId, teamId, false);
  }

  await executor
    .update(teamMember)
    .set({
      role: "lead",
      updatedAt: now(),
    })
    .where(eq(teamMember.id, targetMembership.id));

  await updateUserTeamState(executor, targetMembership.userId, teamId, true);

  return {
    ...targetMembership,
    role: "lead" as TeamMembershipRole,
  };
}

async function removeMembershipFromTeam(
  executor: DbExecutor,
  params: {
    teamRow: TeamRecord;
    membership: TeamMembershipRecord;
    removedByUserId: string;
    nextLeadUserId?: string;
  },
) {
  if (params.membership.role === "lead" && params.teamRow.memberCount > 1) {
    if (!params.nextLeadUserId) {
      throw createTeamError(
        409,
        "LEAD_TRANSFER_REQUIRED",
        "Transfer the team lead role before removing the current lead.",
      );
    }

    if (params.nextLeadUserId === params.membership.userId) {
      throw createTeamError(
        400,
        "INVALID_LEAD_TRANSFER",
        "The replacement lead must be another active team member.",
      );
    }

    await promoteMemberToLead(executor, params.teamRow.id, params.nextLeadUserId);
  }

  await executor
    .update(teamMember)
    .set({
      leftAt: now(),
      removedByUserId: params.removedByUserId,
      updatedAt: now(),
    })
    .where(eq(teamMember.id, params.membership.id));

  await clearUserTeamState(executor, params.membership.userId);

  const nextMemberCount = Math.max(params.teamRow.memberCount - 1, 0);

  if (nextMemberCount === 0) {
    await archiveTeam(executor, params.teamRow.id);
    return;
  }

  await reactivateOrUpdateTeamCount(executor, params.teamRow, nextMemberCount);
}

async function listActiveTeamMembers(executor: DbExecutor, teamId: number) {
  const rows = await executor
    .select({
      membership: teamMember,
      user,
    })
    .from(teamMember)
    .innerJoin(user, eq(teamMember.userId, user.id))
    .where(and(eq(teamMember.teamId, teamId), isNull(teamMember.leftAt)));

  return rows
    .map((row) => ({
      id: row.membership.id,
      userId: row.user.id,
      role: row.membership.role,
      joinedAt: row.membership.joinedAt,
      name: row.user.name,
      email: row.user.email,
      image: row.user.image,
      firstName: row.user.firstName,
      lastName: row.user.lastName,
      isTeamLead: row.membership.role === "lead",
    }))
    .sort((left, right) => {
      if (left.role === right.role) {
        return left.joinedAt.getTime() - right.joinedAt.getTime();
      }

      return left.role === "lead" ? -1 : 1;
    });
}

async function getCurrentInviteForTeam(executor: DbExecutor, teamRow: TeamRecord) {
  if (!teamRow.joinCode) {
    return null;
  }

  const [invite] = await executor
    .select()
    .from(teamInvite)
    .where(and(eq(teamInvite.teamId, teamRow.id), eq(teamInvite.code, teamRow.joinCode)))
    .limit(1);

  if (!invite || invite.revokedAt) {
    return null;
  }

  return {
    id: invite.id,
    code: invite.code,
    expiresAt: invite.expiresAt,
    maxUses: invite.maxUses,
    usedCount: invite.usedCount,
    isExpired: Boolean(invite.expiresAt && invite.expiresAt.getTime() <= Date.now()),
    createdAt: invite.createdAt,
    updatedAt: invite.updatedAt,
  };
}

async function buildTeamDetails(
  executor: DbExecutor,
  teamId: number,
  currentUserId?: string,
) {
  const [teamRow] = await executor.select().from(team).where(eq(team.id, teamId)).limit(1);

  if (!teamRow) {
    throw createTeamError(404, "TEAM_NOT_FOUND", "Team not found.");
  }

  const members = await listActiveTeamMembers(executor, teamId);
  const invite = await getCurrentInviteForTeam(executor, teamRow);
  const currentUserMembership = currentUserId
    ? members.find((member) => member.userId === currentUserId) ?? null
    : null;

  return {
    id: teamRow.id,
    name: teamRow.name,
    description: teamRow.description,
    status: teamRow.status,
    screeningStatus: teamRow.screeningStatus,
    votingGroup: teamRow.votingGroup,
    memberCount: teamRow.memberCount,
    maxMembers: teamRow.maxMembers,
    joinCode: teamRow.joinCode,
    archivedAt: teamRow.archivedAt,
    createdByUserId: teamRow.createdByUserId,
    createdAt: teamRow.createdAt,
    updatedAt: teamRow.updatedAt,
    captainUserId: members.find((member) => member.role === "lead")?.userId ?? null,
    invite,
    members,
    currentUserMembership,
  };
}

function assertTeamManagementPermission(actor: AppSessionUser, membership: TeamMembershipRecord) {
  if (actor.role === "super_admin" || membership.role === "lead") {
    return;
  }

  throw createTeamError(
    403,
    "FORBIDDEN",
    "Only the team lead or a super admin can manage team membership.",
  );
}

export async function getCurrentUserTeam(actor: AppSessionUser) {
  const activeMembership = await getActiveMembershipForUser(db, actor.id);

  if (!activeMembership) {
    if (actor.teamId !== null || actor.isTeamLead) {
      await clearUserTeamState(db, actor.id);
    }

    return null;
  }

  const shouldBeLead = activeMembership.membership.role === "lead";

  if (actor.teamId !== activeMembership.team.id || actor.isTeamLead !== shouldBeLead) {
    await updateUserTeamState(db, actor.id, activeMembership.team.id, shouldBeLead);
  }

  return buildTeamDetails(db, activeMembership.team.id, actor.id);
}

export async function listCurrentTeamMembers(actor: AppSessionUser) {
  const activeMembership = await getActiveMembershipForUser(db, actor.id);

  if (!activeMembership) {
    throw createTeamError(404, "TEAM_NOT_FOUND", "You are not part of a team.");
  }

  return listActiveTeamMembers(db, activeMembership.team.id);
}

export async function createTeam(actor: AppSessionUser, input: CreateTeamInput) {
  assertInviteSettings(input.inviteExpiresAt, input.inviteMaxUses);

  return db.transaction(async (tx) => {
    const existingMembership = await getActiveMembershipForUser(tx, actor.id, true);

    if (existingMembership) {
      throw createTeamError(
        409,
        "ALREADY_IN_TEAM",
        "You must leave your current team before creating a new one.",
      );
    }

    const inviteCode = await generateUniqueInviteCode(tx);
    const [createdTeam] = await tx
      .insert(team)
      .values({
        name: input.name,
        description: input.description,
        status: "active",
        joinCode: inviteCode,
        memberCount: 1,
        maxMembers: TEAM_LIMITS.maxMembers,
        createdByUserId: actor.id,
      })
      .returning();

    await tx.insert(teamMember).values({
      teamId: createdTeam.id,
      userId: actor.id,
      role: "lead",
    });

    await tx.insert(teamInvite).values({
      teamId: createdTeam.id,
      code: inviteCode,
      createdByUserId: actor.id,
      expiresAt: input.inviteExpiresAt,
      maxUses: input.inviteMaxUses,
    });

    await updateUserTeamState(tx, actor.id, createdTeam.id, true);

    return buildTeamDetails(tx, createdTeam.id, actor.id);
  });
}

export async function joinTeamByCode(actor: AppSessionUser, input: JoinTeamInput) {
  return db.transaction(async (tx) => {
    const existingMembership = await getActiveMembershipForUser(tx, actor.id, true);

    if (existingMembership) {
      throw createTeamError(
        409,
        "ALREADY_IN_TEAM",
        "You must leave your current team before joining another one.",
      );
    }

    const [invite] = await tx
      .select()
      .from(teamInvite)
      .where(eq(teamInvite.code, input.code))
      .limit(1);

    if (!invite) {
      throw createTeamError(404, "INVALID_INVITE_CODE", "Invite code is invalid.");
    }

    const lockedTeam = await getLockedTeam(tx, invite.teamId);

    if (!lockedTeam) {
      throw createTeamError(404, "TEAM_NOT_FOUND", "Team not found.");
    }

    if (invite.revokedAt || lockedTeam.joinCode !== input.code) {
      throw createTeamError(409, "INVALID_INVITE_CODE", "Invite code is no longer active.");
    }

    if (invite.expiresAt && invite.expiresAt.getTime() <= Date.now()) {
      throw createTeamError(409, "INVITE_EXPIRED", "Invite code has expired.");
    }

    if (invite.maxUses !== null && invite.usedCount >= invite.maxUses) {
      throw createTeamError(409, "INVITE_EXHAUSTED", "Invite code can no longer be used.");
    }

    if (lockedTeam.status !== "active") {
      throw createTeamError(409, "TEAM_ARCHIVED", "Archived teams cannot accept new members.");
    }

    if (lockedTeam.memberCount >= lockedTeam.maxMembers) {
      throw createTeamError(409, "TEAM_FULL", "This team already has the maximum of 5 members.");
    }

    await tx.insert(teamMember).values({
      teamId: lockedTeam.id,
      userId: actor.id,
      role: "member",
    });

    await reactivateOrUpdateTeamCount(tx, lockedTeam, lockedTeam.memberCount + 1);

    await tx
      .update(teamInvite)
      .set({
        usedCount: sql`${teamInvite.usedCount} + 1`,
        updatedAt: now(),
      })
      .where(eq(teamInvite.id, invite.id));

    await updateUserTeamState(tx, actor.id, lockedTeam.id, false);

    return buildTeamDetails(tx, lockedTeam.id, actor.id);
  });
}

export async function leaveCurrentTeam(actor: AppSessionUser) {
  return db.transaction(async (tx) => {
    const activeMembership = await getActiveMembershipForUser(tx, actor.id, true);

    if (!activeMembership) {
      await clearUserTeamState(tx, actor.id);
      throw createTeamError(409, "NOT_IN_TEAM", "You are not part of a team.");
    }

    await removeMembershipFromTeam(tx, {
      teamRow: activeMembership.team,
      membership: activeMembership.membership,
      removedByUserId: actor.id,
    });

    return {
      leftTeamId: activeMembership.team.id,
      archived: activeMembership.team.memberCount === 1,
    };
  });
}

export async function removeMemberFromCurrentTeam(actor: AppSessionUser, memberUserId: string) {
  if (memberUserId === actor.id) {
    throw createTeamError(
      400,
      "USE_LEAVE_TEAM",
      "Use the leave team endpoint to remove yourself from a team.",
    );
  }

  return db.transaction(async (tx) => {
    const activeMembership = await getActiveMembershipForUser(tx, actor.id, true);

    if (!activeMembership) {
      throw createTeamError(404, "TEAM_NOT_FOUND", "You are not part of a team.");
    }

    assertTeamManagementPermission(actor, activeMembership.membership);

    const targetMembership = await getActiveMembershipByUserAndTeam(
      tx,
      memberUserId,
      activeMembership.team.id,
      true,
    );

    if (!targetMembership) {
      throw createTeamError(404, "MEMBER_NOT_FOUND", "The selected user is not in your team.");
    }

    if (targetMembership.role === "lead") {
      throw createTeamError(
        409,
        "LEAD_TRANSFER_REQUIRED",
        "Transfer the team lead role before removing the current lead.",
      );
    }

    await removeMembershipFromTeam(tx, {
      teamRow: activeMembership.team,
      membership: targetMembership,
      removedByUserId: actor.id,
    });

    return buildTeamDetails(tx, activeMembership.team.id, actor.id);
  });
}

export async function transferCurrentTeamLead(actor: AppSessionUser, newLeadUserId: string) {
  return db.transaction(async (tx) => {
    const activeMembership = await getActiveMembershipForUser(tx, actor.id, true);

    if (!activeMembership) {
      throw createTeamError(404, "TEAM_NOT_FOUND", "You are not part of a team.");
    }

    assertTeamManagementPermission(actor, activeMembership.membership);

    if (newLeadUserId === actor.id) {
      return buildTeamDetails(tx, activeMembership.team.id, actor.id);
    }

    await promoteMemberToLead(tx, activeMembership.team.id, newLeadUserId);

    return buildTeamDetails(tx, activeMembership.team.id, actor.id);
  });
}

export async function updateCurrentTeam(actor: AppSessionUser, input: UpdateTeamInput) {
  assertInviteSettings(input.inviteExpiresAt, input.inviteMaxUses);

  return db.transaction(async (tx) => {
    const activeMembership = await getActiveMembershipForUser(tx, actor.id, true);

    if (!activeMembership) {
      throw createTeamError(404, "TEAM_NOT_FOUND", "You are not part of a team.");
    }

    assertTeamManagementPermission(actor, activeMembership.membership);

    if (
      input.name === undefined &&
      input.description === undefined &&
      !input.regenerateInvite
    ) {
      throw createTeamError(400, "NO_TEAM_CHANGES", "No team changes were provided.");
    }

    const teamPatch: Partial<typeof team.$inferInsert> & { updatedAt: Date } = {
      updatedAt: now(),
    };

    if (input.name !== undefined) {
      if (input.name.length < TEAM_LIMITS.nameMinLength) {
        throw createTeamError(
          400,
          "INVALID_TEAM_NAME",
          `name must be at least ${TEAM_LIMITS.nameMinLength} characters long.`,
        );
      }

      teamPatch.name = input.name;
    }

    if (input.description !== undefined) {
      teamPatch.description = input.description;
    }

    await tx.update(team).set(teamPatch).where(eq(team.id, activeMembership.team.id));

    if (input.regenerateInvite) {
      await createInviteForTeam(tx, {
        teamId: activeMembership.team.id,
        createdByUserId: actor.id,
        expiresAt: input.inviteExpiresAt ?? null,
        maxUses: input.inviteMaxUses ?? null,
      });
    }

    return buildTeamDetails(tx, activeMembership.team.id, actor.id);
  });
}

export async function listTeamsForAdmin(options: {
  limit: number;
  offset: number;
  search?: string;
  status?: "active" | "archived";
}) {
  const filters = [];

  if (options.status) {
    filters.push(eq(team.status, options.status));
  }

  if (options.search) {
    filters.push(ilike(team.name, `%${options.search}%`));
  }

  const whereClause = filters.length > 0 ? and(...filters) : undefined;
  const rows = await db
    .select({
      team,
      leadUserId: user.id,
      leadName: user.name,
      leadEmail: user.email,
    })
    .from(team)
    .leftJoin(
      teamMember,
      and(
        eq(teamMember.teamId, team.id),
        eq(teamMember.role, "lead"),
        isNull(teamMember.leftAt),
      ),
    )
    .leftJoin(user, eq(user.id, teamMember.userId))
    .where(whereClause)
    .orderBy(desc(team.createdAt))
    .limit(options.limit)
    .offset(options.offset);

  const [totalRow] = await db
    .select({
      total: sql<number>`count(*)::int`,
    })
    .from(team)
    .where(whereClause);

  return {
    total: totalRow?.total ?? 0,
    limit: options.limit,
    offset: options.offset,
    items: rows.map((row) => ({
      id: row.team.id,
      name: row.team.name,
      description: row.team.description,
      status: row.team.status,
      votingGroup: row.team.votingGroup,
      memberCount: row.team.memberCount,
      maxMembers: row.team.maxMembers,
      joinCode: row.team.joinCode,
      archivedAt: row.team.archivedAt,
      createdByUserId: row.team.createdByUserId,
      createdAt: row.team.createdAt,
      updatedAt: row.team.updatedAt,
      lead: row.leadUserId
        ? {
            userId: row.leadUserId,
            name: row.leadName,
            email: row.leadEmail,
          }
        : null,
    })),
  };
}

export async function getTeamDetailsForAdmin(teamId: number) {
  return buildTeamDetails(db, teamId);
}

export type AdminUpdateTeamInput = {
  name?: string;
  description?: string | null;
};

export async function updateTeamForAdmin(
  teamId: number,
  input: AdminUpdateTeamInput,
) {
  const [teamRow] = await db.select().from(team).where(eq(team.id, teamId)).limit(1);

  if (!teamRow) {
    throw createTeamError(404, "TEAM_NOT_FOUND", "Team not found.");
  }

  if (input.name === undefined && input.description === undefined) {
    return buildTeamDetails(db, teamId);
  }

  const patch: Partial<typeof team.$inferInsert> & { updatedAt: Date } = {
    updatedAt: now(),
  };

  if (input.name !== undefined) {
    if (input.name.length < TEAM_LIMITS.nameMinLength) {
      throw createTeamError(
        400,
        "INVALID_TEAM_NAME",
        `name must be at least ${TEAM_LIMITS.nameMinLength} characters long.`,
      );
    }
    patch.name = input.name;
  }

  if (input.description !== undefined) {
    patch.description = input.description;
  }

  await db.update(team).set(patch).where(eq(team.id, teamId));
  return buildTeamDetails(db, teamId);
}

/**
 * Permanently removes a team and dependent rows (members, invites, project, scores, credit allocations).
 * Clears `user.teamId` / `isTeamLead` for members before delete so denormalized lead flags stay consistent.
 */
export async function deleteTeamForSuperAdmin(teamId: number) {
  await db.transaction(async (tx) => {
    const [teamRow] = await tx.select({ id: team.id }).from(team).where(eq(team.id, teamId)).limit(1);

    if (!teamRow) {
      throw createTeamError(404, "TEAM_NOT_FOUND", "Team not found.");
    }

    await tx
      .update(user)
      .set({
        teamId: null,
        isTeamLead: false,
        updatedAt: now(),
      })
      .where(eq(user.teamId, teamId));

    await tx.delete(team).where(eq(team.id, teamId));
  });
}

async function adminAssignMemberToTeam(
  actor: AppSessionUser,
  teamId: number,
  userId: string,
  makeLead: boolean,
  removeFromCurrentTeam: boolean,
) {
  return db.transaction(async (tx) => {
    const targetTeam = await getLockedTeam(tx, teamId);

    if (!targetTeam) {
      throw createTeamError(404, "TEAM_NOT_FOUND", "Team not found.");
    }

    const existingMembership = await getActiveMembershipForUser(tx, userId, true);

    if (existingMembership && existingMembership.team.id === teamId) {
      if (makeLead) {
        await promoteMemberToLead(tx, teamId, userId);
      }

      return buildTeamDetails(tx, teamId);
    }

    if (existingMembership) {
      if (!removeFromCurrentTeam) {
        throw createTeamError(
          409,
          "USER_ALREADY_IN_TEAM",
          "The selected user already belongs to a different team.",
        );
      }

      await removeMembershipFromTeam(tx, {
        teamRow: existingMembership.team,
        membership: existingMembership.membership,
        removedByUserId: actor.id,
      });
    }

    const refreshedTargetTeam = await getLockedTeam(tx, teamId);

    if (!refreshedTargetTeam) {
      throw createTeamError(404, "TEAM_NOT_FOUND", "Team not found.");
    }

    if (refreshedTargetTeam.memberCount >= refreshedTargetTeam.maxMembers) {
      throw createTeamError(409, "TEAM_FULL", "This team already has 5 members.");
    }

    await tx.insert(teamMember).values({
      teamId,
      userId,
      role: "member",
    });

    await reactivateOrUpdateTeamCount(tx, refreshedTargetTeam, refreshedTargetTeam.memberCount + 1);
    await updateUserTeamState(tx, userId, teamId, false);

    if (makeLead) {
      await promoteMemberToLead(tx, teamId, userId);
    }

    return buildTeamDetails(tx, teamId);
  });
}

async function adminRemoveMemberFromTeam(
  actor: AppSessionUser,
  teamId: number,
  userId: string,
  nextLeadUserId?: string,
) {
  return db.transaction(async (tx) => {
    const targetTeam = await getLockedTeam(tx, teamId);

    if (!targetTeam) {
      throw createTeamError(404, "TEAM_NOT_FOUND", "Team not found.");
    }

    const membership = await getActiveMembershipByUserAndTeam(tx, userId, teamId, true);

    if (!membership) {
      throw createTeamError(404, "MEMBER_NOT_FOUND", "The selected user is not in this team.");
    }

    await removeMembershipFromTeam(tx, {
      teamRow: targetTeam,
      membership,
      removedByUserId: actor.id,
      nextLeadUserId,
    });

    return buildTeamDetails(tx, teamId);
  });
}

async function adminTransferLead(teamId: number, newLeadUserId: string) {
  return db.transaction(async (tx) => {
    const targetTeam = await getLockedTeam(tx, teamId);

    if (!targetTeam) {
      throw createTeamError(404, "TEAM_NOT_FOUND", "Team not found.");
    }

    if (targetTeam.memberCount === 0) {
      throw createTeamError(
        409,
        "TEAM_HAS_NO_MEMBERS",
        "Cannot assign a lead to an empty archived team.",
      );
    }

    await promoteMemberToLead(tx, teamId, newLeadUserId);
    return buildTeamDetails(tx, teamId);
  });
}

const SUPER_ADMIN_DELETABLE_ROLES = ["participant", "judge", "mentor"] as const;

/**
 * Permanently removes a user (auth row + cascades). Allowed roles: participant,
 * judge, mentor. Team membership is reconciled when applicable. Super-admin only.
 */
export async function deleteUserBySuperAdmin(
  actorId: string,
  targetUserId: string,
): Promise<void> {
  if (actorId === targetUserId) {
    throw createTeamError(400, "INVALID_TARGET", "You cannot delete your own account.");
  }

  await db.transaction(async (tx) => {
    const [target] = await tx
      .select()
      .from(user)
      .where(eq(user.id, targetUserId))
      .limit(1);

    if (!target) {
      throw createTeamError(404, "USER_NOT_FOUND", "User not found.");
    }

    if (target.role === "super_admin") {
      throw createTeamError(400, "ROLE_NOT_DELETABLE", "Super admin accounts cannot be deleted here.");
    }

    if (!SUPER_ADMIN_DELETABLE_ROLES.includes(target.role as (typeof SUPER_ADMIN_DELETABLE_ROLES)[number])) {
      throw createTeamError(
        400,
        "ROLE_NOT_DELETABLE",
        "Only participant, judge, and mentor accounts can be deleted. Change their role first if needed.",
      );
    }

    const [membership] = await tx
      .select()
      .from(teamMember)
      .where(and(eq(teamMember.userId, targetUserId), isNull(teamMember.leftAt)))
      .limit(1);

    if (membership) {
      const teamRow = await getLockedTeam(tx, membership.teamId);
      if (!teamRow) {
        throw createTeamError(404, "TEAM_NOT_FOUND", "Team for this member was not found.");
      }

      let nextLeadUserId: string | undefined;
      if (membership.role === "lead" && teamRow.memberCount > 1) {
        const [next] = await tx
          .select({ userId: teamMember.userId })
          .from(teamMember)
          .where(
            and(
              eq(teamMember.teamId, teamRow.id),
              isNull(teamMember.leftAt),
              ne(teamMember.userId, targetUserId),
            ),
          )
          .orderBy(teamMember.joinedAt)
          .limit(1);
        nextLeadUserId = next?.userId;
      }

      await removeMembershipFromTeam(tx, {
        teamRow,
        membership,
        removedByUserId: actorId,
        nextLeadUserId,
      });
    }

    const [deleted] = await tx
      .delete(user)
      .where(eq(user.id, targetUserId))
      .returning({ id: user.id });

    if (!deleted) {
      throw createTeamError(404, "USER_NOT_FOUND", "User not found.");
    }
  });
}

export async function forceUpdateTeamMembership(
  actor: AppSessionUser,
  teamId: number,
  input: AdminForceMembershipInput,
) {
  switch (input.action) {
    case "assign-member":
      return adminAssignMemberToTeam(
        actor,
        teamId,
        input.userId,
        input.makeLead,
        input.removeFromCurrentTeam,
      );
    case "remove-member":
      return adminRemoveMemberFromTeam(actor, teamId, input.userId, input.nextLeadUserId);
    case "transfer-lead":
      return adminTransferLead(teamId, input.newLeadUserId);
    default:
      throw createTeamError(400, "INVALID_ACTION", "Unsupported admin membership action.");
  }
}
