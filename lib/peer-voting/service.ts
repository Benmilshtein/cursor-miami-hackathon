import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { team, user } from "@/db/schema/auth";
import { project } from "@/db/schema/projects";
import { peerVote } from "@/db/schema/peer-voting";
import { AppError } from "@/lib/api/http";
import type { AppSessionUser } from "@/lib/auth/session";
import { notifyRankingUpdate } from "@/lib/scoring/events";
import {
  activeRound,
  activeVotingGroup,
  getPeerVotingPhase,
  isAllowedTransition,
  presentingGroup,
  setPeerVotingPhase,
  type PeerVotingPhase,
  type VotingGroup,
} from "@/lib/peer-voting/phase";

/** Every participant gets the same fixed budget of "Launch Credits". */
export const MAX_CREDITS = 3;

function otherGroup(group: VotingGroup): VotingGroup {
  return group === "A" ? "B" : "A";
}

function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

async function countPeerVotes(): Promise<number> {
  const [row] = await db.select({ count: sql<number>`count(*)::int` }).from(peerVote);
  return row?.count ?? 0;
}

/**
 * Group membership may only change before voting opens and before any votes
 * exist - otherwise moving a team between groups would orphan/invalidate votes.
 */
async function assertGroupsEditable(): Promise<void> {
  const phase = await getPeerVotingPhase();
  if (phase !== "closed") {
    throw new AppError(
      409,
      "VOTING_GROUPS_LOCKED",
      "Groups can only be changed while peer voting is closed.",
    );
  }
  if ((await countPeerVotes()) > 0) {
    throw new AppError(
      409,
      "VOTING_GROUPS_LOCKED",
      "Groups are locked because votes have already been cast.",
    );
  }
}

export type GroupCounts = { A: number; B: number; unassigned: number; total: number };

export async function getGroupCounts(): Promise<GroupCounts> {
  const rows = await db
    .select({ votingGroup: team.votingGroup, count: sql<number>`count(*)::int` })
    .from(team)
    .where(eq(team.status, "active"))
    .groupBy(team.votingGroup);

  const counts: GroupCounts = { A: 0, B: 0, unassigned: 0, total: 0 };
  for (const row of rows) {
    const n = row.count ?? 0;
    counts.total += n;
    if (row.votingGroup === "A") counts.A = n;
    else if (row.votingGroup === "B") counts.B = n;
    else counts.unassigned = n;
  }
  return counts;
}

/** Randomly split all active teams into two as-even-as-possible groups (A/B). */
export async function splitTeamsIntoGroups(): Promise<GroupCounts> {
  await assertGroupsEditable();

  return db.transaction(async (tx) => {
    const teams = await tx
      .select({ id: team.id })
      .from(team)
      .where(eq(team.status, "active"));

    const ids = shuffle(teams.map((t) => t.id));
    const half = Math.ceil(ids.length / 2); // odd team out → Group A (the larger half)
    const groupA = ids.slice(0, half);
    const groupB = ids.slice(half);

    if (groupA.length > 0) {
      await tx
        .update(team)
        .set({ votingGroup: "A", updatedAt: new Date() })
        .where(inArray(team.id, groupA));
    }
    if (groupB.length > 0) {
      await tx
        .update(team)
        .set({ votingGroup: "B", updatedAt: new Date() })
        .where(inArray(team.id, groupB));
    }

    return { A: groupA.length, B: groupB.length, unassigned: 0, total: ids.length };
  });
}

/** Manually move one team into a group (or unassign with null). */
export async function reassignTeamGroup(
  teamId: number,
  group: VotingGroup | null,
): Promise<void> {
  await assertGroupsEditable();

  const [row] = await db.select({ id: team.id }).from(team).where(eq(team.id, teamId)).limit(1);
  if (!row) {
    throw new AppError(404, "TEAM_NOT_FOUND", "Team not found.");
  }

  await db
    .update(team)
    .set({ votingGroup: group, updatedAt: new Date() })
    .where(eq(team.id, teamId));
}

export type PeerVoteRow = typeof peerVote.$inferSelect;

/**
 * Create or update a voter's credit allocation for one team. Runs in a
 * transaction holding a per-voter advisory lock so a voter's concurrent writes
 * serialize and the 3-credit budget can't be raced past.
 */
export async function upsertPeerVote(
  voterUserId: string,
  teamId: number,
  credits: number,
): Promise<PeerVoteRow> {
  if (!Number.isInteger(credits) || credits < 1 || credits > MAX_CREDITS) {
    throw new AppError(400, "INVALID_CREDITS", `Credits must be between 1 and ${MAX_CREDITS}.`);
  }

  const phase = await getPeerVotingPhase();
  const round = activeRound(phase);
  const votingGroup = activeVotingGroup(phase);
  if (round === null || votingGroup === null) {
    throw new AppError(403, "VOTING_CLOSED", "Peer voting is not open right now.");
  }

  const saved = await db.transaction(async (tx) => {
    // Serialize concurrent writes from the same voter (double-clicks, retries).
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${voterUserId}))`);

    const [voterRow] = await tx
      .select({ teamId: user.teamId })
      .from(user)
      .where(eq(user.id, voterUserId))
      .limit(1);
    const voterTeamId = voterRow?.teamId ?? null;
    if (voterTeamId === null) {
      throw new AppError(403, "NO_TEAM", "You must be on a team to vote.");
    }

    const [voterTeam] = await tx
      .select({ status: team.status, votingGroup: team.votingGroup })
      .from(team)
      .where(eq(team.id, voterTeamId))
      .limit(1);
    if (!voterTeam || voterTeam.status !== "active" || !voterTeam.votingGroup) {
      throw new AppError(403, "NO_VOTING_GROUP", "Your team has not been assigned a voting group yet.");
    }
    if (voterTeam.votingGroup !== votingGroup) {
      throw new AppError(403, "NOT_YOUR_ROUND", "It is not your group's turn to vote.");
    }

    const [targetTeam] = await tx
      .select({ status: team.status, votingGroup: team.votingGroup })
      .from(team)
      .where(eq(team.id, teamId))
      .limit(1);
    if (!targetTeam) {
      throw new AppError(404, "TEAM_NOT_FOUND", "Team not found.");
    }
    if (targetTeam.status !== "active" || !targetTeam.votingGroup) {
      throw new AppError(400, "TEAM_NOT_VOTABLE", "That team is not part of this voting round.");
    }
    // Opposite group only - this also excludes the voter's own team.
    if (targetTeam.votingGroup === voterTeam.votingGroup) {
      throw new AppError(403, "SAME_GROUP", "You can only vote for teams in the other group.");
    }

    const existing = await tx
      .select({ id: peerVote.id, teamId: peerVote.teamId, credits: peerVote.credits, round: peerVote.round })
      .from(peerVote)
      .where(eq(peerVote.voterUserId, voterUserId));

    const existingForTeam = existing.find((e) => e.teamId === teamId);
    // Lock-on-advance: an existing row from a prior round can't be edited.
    if (existingForTeam && existingForTeam.round !== round) {
      throw new AppError(409, "VOTES_LOCKED", "Your previous votes are locked and can no longer be changed.");
    }

    const otherCredits = existing
      .filter((e) => e.teamId !== teamId)
      .reduce((sum, e) => sum + e.credits, 0);
    if (otherCredits + credits > MAX_CREDITS) {
      const remaining = MAX_CREDITS - otherCredits;
      throw new AppError(
        409,
        "CREDIT_BUDGET_EXCEEDED",
        `You only have ${remaining} credit${remaining === 1 ? "" : "s"} left.`,
      );
    }

    if (existingForTeam) {
      const [updated] = await tx
        .update(peerVote)
        .set({ credits, updatedAt: new Date() })
        .where(eq(peerVote.id, existingForTeam.id))
        .returning();
      return updated as PeerVoteRow;
    }

    const [inserted] = await tx
      .insert(peerVote)
      .values({ voterUserId, teamId, credits, round })
      .returning();
    return inserted as PeerVoteRow;
  });

  // Live-refresh the public crowd leaderboard stream.
  notifyRankingUpdate();
  return saved;
}

/** Remove a voter's allocation for one team, freeing up the credits. */
export async function deletePeerVote(
  voterUserId: string,
  teamId: number,
): Promise<{ deleted: boolean }> {
  const phase = await getPeerVotingPhase();
  const round = activeRound(phase);
  if (round === null) {
    throw new AppError(403, "VOTING_CLOSED", "Peer voting is not open right now.");
  }

  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${voterUserId}))`);

    const [row] = await tx
      .select({ id: peerVote.id, round: peerVote.round })
      .from(peerVote)
      .where(and(eq(peerVote.voterUserId, voterUserId), eq(peerVote.teamId, teamId)))
      .limit(1);

    if (!row) return { deleted: false };
    if (row.round !== round) {
      throw new AppError(409, "VOTES_LOCKED", "Your previous votes are locked and can no longer be changed.");
    }

    await tx.delete(peerVote).where(eq(peerVote.id, row.id));
    return { deleted: true };
  });

  if (result.deleted) notifyRankingUpdate();
  return result;
}

export type ParticipantVotingState = {
  phase: PeerVotingPhase;
  myGroup: VotingGroup | null;
  /** Group whose turn it is to vote right now (null when closed/finished). */
  activeGroup: VotingGroup | null;
  presentingGroup: VotingGroup | null;
  /** True when this voter may currently create/edit votes. */
  canVote: boolean;
  /** Why the ballot isn't open, for UI messaging. null when canVote is true. */
  reason:
    | null
    | "VOTING_CLOSED"
    | "NO_TEAM"
    | "NO_VOTING_GROUP"
    | "NOT_YOUR_ROUND"
    | "FINISHED";
  maxCredits: number;
  usedCredits: number;
  remainingCredits: number;
  votableTeams: Array<{ id: number; name: string; description: string | null }>;
  myVotes: Array<{ teamId: number; credits: number }>;
};

export async function getParticipantVotingState(
  voter: AppSessionUser,
): Promise<ParticipantVotingState> {
  const phase = await getPeerVotingPhase();
  const activeGroup = activeVotingGroup(phase);

  let myGroup: VotingGroup | null = null;
  if (voter.teamId !== null) {
    const [voterTeam] = await db
      .select({ status: team.status, votingGroup: team.votingGroup })
      .from(team)
      .where(eq(team.id, voter.teamId))
      .limit(1);
    if (voterTeam && voterTeam.status === "active") {
      myGroup = voterTeam.votingGroup ?? null;
    }
  }

  const myVotesRows = await db
    .select({ teamId: peerVote.teamId, credits: peerVote.credits })
    .from(peerVote)
    .where(eq(peerVote.voterUserId, voter.id));
  const usedCredits = myVotesRows.reduce((sum, r) => sum + r.credits, 0);

  // Voters only ever see the opposite group's teams.
  let votableTeams: ParticipantVotingState["votableTeams"] = [];
  if (myGroup) {
    votableTeams = await db
      .select({ id: team.id, name: team.name, description: team.description })
      .from(team)
      .where(and(eq(team.status, "active"), eq(team.votingGroup, otherGroup(myGroup))))
      .orderBy(asc(team.name));
  }

  let canVote = false;
  let reason: ParticipantVotingState["reason"] = null;
  if (phase === "closed") reason = "VOTING_CLOSED";
  else if (phase === "finished") reason = "FINISHED";
  else if (voter.teamId === null) reason = "NO_TEAM";
  else if (!myGroup) reason = "NO_VOTING_GROUP";
  else if (myGroup !== activeGroup) reason = "NOT_YOUR_ROUND";
  else canVote = true;

  return {
    phase,
    myGroup,
    activeGroup,
    presentingGroup: presentingGroup(phase),
    canVote,
    reason,
    maxCredits: MAX_CREDITS,
    usedCredits,
    remainingCredits: Math.max(0, MAX_CREDITS - usedCredits),
    votableTeams,
    myVotes: myVotesRows,
  };
}

export type CrowdLeaderboardRow = {
  teamId: number;
  teamName: string;
  votingGroup: VotingGroup | null;
  totalCredits: number;
  uniqueVoters: number;
  rank: number;
};

/**
 * Crowd leaderboard. Tie-break: total credits → unique voters → earliest
 * submission (using `project.createdAt` as a proxy; no dedicated submission
 * timestamp exists) → team name.
 */
export async function getCrowdLeaderboard(): Promise<CrowdLeaderboardRow[]> {
  const rows = await db
    .select({
      teamId: team.id,
      teamName: team.name,
      votingGroup: team.votingGroup,
      totalCredits: sql<number>`coalesce(sum(${peerVote.credits}), 0)::int`,
      uniqueVoters: sql<number>`count(distinct ${peerVote.voterUserId})::int`,
      submittedAt: sql<string | null>`min(${project.createdAt})`,
    })
    .from(team)
    .leftJoin(peerVote, eq(peerVote.teamId, team.id))
    .leftJoin(project, eq(project.teamId, team.id))
    .where(and(eq(team.status, "active"), sql`${team.votingGroup} is not null`))
    .groupBy(team.id, team.name, team.votingGroup);

  const sorted = rows.sort((a, b) => {
    if (b.totalCredits !== a.totalCredits) return b.totalCredits - a.totalCredits;
    if (b.uniqueVoters !== a.uniqueVoters) return b.uniqueVoters - a.uniqueVoters;
    const aTime = a.submittedAt ? Date.parse(a.submittedAt) : Number.POSITIVE_INFINITY;
    const bTime = b.submittedAt ? Date.parse(b.submittedAt) : Number.POSITIVE_INFINITY;
    if (aTime !== bTime) return aTime - bTime;
    return a.teamName.localeCompare(b.teamName);
  });

  return sorted.map((row, index) => ({
    teamId: row.teamId,
    teamName: row.teamName,
    votingGroup: row.votingGroup,
    totalCredits: row.totalCredits,
    uniqueVoters: row.uniqueVoters,
    rank: index + 1,
  }));
}

export type AdminPeerVotingOverview = {
  phase: PeerVotingPhase;
  groups: GroupCounts;
  totalVotes: number;
  groupsEditable: boolean;
};

export async function getAdminPeerVotingOverview(): Promise<AdminPeerVotingOverview> {
  const [phase, groups, totalVotes] = await Promise.all([
    getPeerVotingPhase(),
    getGroupCounts(),
    countPeerVotes(),
  ]);
  return {
    phase,
    groups,
    totalVotes,
    groupsEditable: phase === "closed" && totalVotes === 0,
  };
}

/** Move the expo to a new phase, enforcing forward-only transitions. */
export async function transitionPeerVotingPhase(
  to: PeerVotingPhase,
): Promise<PeerVotingPhase> {
  const from = await getPeerVotingPhase();
  if (!isAllowedTransition(from, to)) {
    throw new AppError(
      400,
      "INVALID_TRANSITION",
      `Cannot move peer voting from "${from}" to "${to}".`,
    );
  }

  // Opening round 1 requires a completed split (teams in both A and B).
  if (to === "round_1") {
    const counts = await getGroupCounts();
    if (counts.A === 0 || counts.B === 0) {
      throw new AppError(
        400,
        "NOT_SPLIT",
        "Split teams into Group A and Group B before opening round 1.",
      );
    }
  }

  await setPeerVotingPhase(to);
  notifyRankingUpdate();
  return to;
}

export { type PeerVotingPhase, type VotingGroup };
