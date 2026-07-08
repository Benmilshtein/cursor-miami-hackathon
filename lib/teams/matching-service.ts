import { randomBytes } from "crypto";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { db } from "@/db";
import { team, user } from "@/db/schema/auth";
import { teamInvite, teamMember } from "@/db/schema/teams";
import {
  MATCH_TEAM_SIZE,
  TEAM_INVITE_ALPHABET,
  TEAM_LIMITS,
  TEAM_NAME_POOL,
} from "@/lib/teams/constants";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Minimal projection of a poolable participant used by the matching algorithm. */
type PoolUser = {
  id: string;
  experienceLevel: number | null;
  matchNumber: number | null;
};

export type MatchedTeam = {
  name: string;
  memberIds: string[];
};

export type MatchingResult = {
  /** Eligible participants found in the auto-match pool before matching. */
  poolSize: number;
  teamsFormed: number;
  matchedUsers: number;
  /** Pool members left over (fewer than a full team could be formed from them). */
  waitlisted: number;
  teams: MatchedTeam[];
};

/**
 * The auto-match pool: participants who opted into matching, finished onboarding,
 * and are not already on a team.
 */
function poolCondition() {
  return and(
    eq(user.teamPreference, "auto_match"),
    isNull(user.teamId),
    isNotNull(user.onboardingCompletedAt),
  );
}

export async function getMatchingPoolSize(): Promise<number> {
  const rows = await db.select({ id: user.id }).from(user).where(poolCondition());
  return rows.length;
}

function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

/**
 * Greedily form teams of MATCH_TEAM_SIZE, preferring one of each "lucky number"
 * (1..MATCH_TEAM_SIZE) per team, then filling any gaps with whoever's left.
 * Mirrors `matchPool` from the reference SPA. Leftover (<size) members are dropped.
 */
function formTeams(pool: PoolUser[]): PoolUser[][] {
  const available = [...pool];
  const teams: PoolUser[][] = [];

  while (available.length >= MATCH_TEAM_SIZE) {
    const members: PoolUser[] = [];
    const usedNumbers = new Set<number>();

    for (let n = 1; n <= MATCH_TEAM_SIZE; n += 1) {
      const idx = available.findIndex(
        (p) => p.matchNumber === n && !usedNumbers.has(n),
      );
      if (idx >= 0) {
        members.push(available[idx]!);
        available.splice(idx, 1);
        usedNumbers.add(n);
      }
    }

    while (members.length < MATCH_TEAM_SIZE && available.length > 0) {
      members.push(available.shift()!);
    }

    if (members.length === MATCH_TEAM_SIZE) {
      teams.push(members);
    } else {
      // Not enough to complete a team — return them to the pool and stop.
      available.push(...members);
      break;
    }
  }

  return teams;
}

/**
 * Swap experts (experienceLevel === 3) from expert-heavy teams into teams that
 * have none, so every team gets at least one experienced builder when possible.
 * Mirrors `balanceExperts` from the reference SPA. Mutates the team arrays.
 */
function balanceExperts(teams: PoolUser[][]): void {
  const expertCount = (t: PoolUser[]) =>
    t.filter((p) => p.experienceLevel === 3).length;

  const noExpertTeams = teams.filter((t) => expertCount(t) === 0);
  const multiExpertTeams = teams.filter((t) => expertCount(t) >= 2);

  for (const needy of noExpertTeams) {
    for (let mi = multiExpertTeams.length - 1; mi >= 0; mi -= 1) {
      const donor = multiExpertTeams[mi]!;
      const expertIdx = donor.findIndex((p) => p.experienceLevel === 3);
      const nonExpertIdx = needy.findIndex((p) => p.experienceLevel !== 3);

      if (expertIdx >= 0 && nonExpertIdx >= 0) {
        const expert = donor[expertIdx]!;
        const nonExpert = needy[nonExpertIdx]!;
        donor[expertIdx] = nonExpert;
        needy[nonExpertIdx] = expert;

        if (expertCount(donor) < 2) {
          multiExpertTeams.splice(mi, 1);
        }
        break;
      }
    }
  }
}

function pickTeamName(taken: Set<string>): string {
  const candidates = TEAM_NAME_POOL.filter((name) => !taken.has(name));
  if (candidates.length > 0) {
    return candidates[Math.floor(Math.random() * candidates.length)]!;
  }
  let n = taken.size + 1;
  while (taken.has(`Team ${n}`)) n += 1;
  return `Team ${n}`;
}

function createCandidateCode(): string {
  const bytes = randomBytes(TEAM_LIMITS.inviteCodeLength);
  let code = "";
  for (let i = 0; i < TEAM_LIMITS.inviteCodeLength; i += 1) {
    code += TEAM_INVITE_ALPHABET[bytes[i]! % TEAM_INVITE_ALPHABET.length];
  }
  return code;
}

async function generateUniqueJoinCode(tx: Transaction): Promise<string> {
  for (let attempt = 0; attempt < TEAM_LIMITS.inviteCodeGenerationAttempts; attempt += 1) {
    const code = createCandidateCode();
    const [existing] = await tx
      .select({ id: teamInvite.id })
      .from(teamInvite)
      .where(eq(teamInvite.code, code))
      .limit(1);
    if (!existing) {
      return code;
    }
  }
  throw new Error("Failed to generate a unique team join code.");
}

/**
 * Shuffle the auto-match pool into balanced teams and persist them. Self-formed
 * teams and already-assigned participants are untouched (idempotent re-runs only
 * pull in still-unassigned pool members).
 */
export async function runTeamMatching(): Promise<MatchingResult> {
  const pool = await db
    .select({
      id: user.id,
      experienceLevel: user.experienceLevel,
      matchNumber: user.matchNumber,
    })
    .from(user)
    .where(poolCondition());

  const poolSize = pool.length;
  if (poolSize < MATCH_TEAM_SIZE) {
    return { poolSize, teamsFormed: 0, matchedUsers: 0, waitlisted: poolSize, teams: [] };
  }

  const formed = formTeams(shuffle(pool));
  balanceExperts(formed);

  const existingTeams = await db.select({ name: team.name }).from(team);
  const takenNames = new Set(existingTeams.map((row) => row.name));

  const created: MatchedTeam[] = [];

  await db.transaction(async (tx) => {
    for (const members of formed) {
      const name = pickTeamName(takenNames);
      takenNames.add(name);
      const joinCode = await generateUniqueJoinCode(tx);
      const leadId = members[0]!.id;

      const [teamRow] = await tx
        .insert(team)
        .values({
          name,
          joinCode,
          memberCount: members.length,
          status: "active",
          createdByUserId: leadId,
        })
        .returning({ id: team.id });

      const teamId = teamRow!.id;

      await tx.insert(teamMember).values(
        members.map((member, index) => ({
          teamId,
          userId: member.id,
          role: index === 0 ? ("lead" as const) : ("member" as const),
        })),
      );

      await tx.insert(teamInvite).values({
        teamId,
        code: joinCode,
        createdByUserId: leadId,
      });

      for (let index = 0; index < members.length; index += 1) {
        await tx
          .update(user)
          .set({
            teamId,
            isTeamLead: index === 0,
            updatedAt: new Date(),
          })
          .where(eq(user.id, members[index]!.id));
      }

      created.push({ name, memberIds: members.map((member) => member.id) });
    }
  });

  const matchedUsers = created.reduce((sum, t) => sum + t.memberIds.length, 0);

  return {
    poolSize,
    teamsFormed: created.length,
    matchedUsers,
    waitlisted: poolSize - matchedUsers,
    teams: created,
  };
}
