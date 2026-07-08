import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema/settings";

/**
 * Peer-voting expo lifecycle.
 *
 * - `closed`    — groups not yet formed / voting not started. No votes accepted.
 * - `round_1`   — Group A presents; Group B votes on Group A teams.
 * - `round_2`   — Group B presents; Group A votes on Group B teams.
 *                 Round-1 votes (Group B's) are now locked.
 * - `finished`  — everything locked.
 */
export type PeerVotingPhase = "closed" | "round_1" | "round_2" | "finished";
export type VotingGroup = "A" | "B";

export const PEER_VOTING_PHASE_KEY = "peer_voting_phase";
const DEFAULT_PHASE: PeerVotingPhase = "closed";

const VALID_PHASES = new Set<PeerVotingPhase>([
  "closed",
  "round_1",
  "round_2",
  "finished",
]);

export function isValidPeerVotingPhase(value: string): value is PeerVotingPhase {
  return VALID_PHASES.has(value as PeerVotingPhase);
}

/** The group currently allowed to cast/edit votes, or null when voting is closed. */
export function activeVotingGroup(phase: PeerVotingPhase): VotingGroup | null {
  if (phase === "round_1") return "B"; // Group B evaluates Group A (who present first)
  if (phase === "round_2") return "A"; // Group A evaluates Group B
  return null;
}

/** The round number for the active phase, or null when voting is closed. */
export function activeRound(phase: PeerVotingPhase): 1 | 2 | null {
  if (phase === "round_1") return 1;
  if (phase === "round_2") return 2;
  return null;
}

/** The group presenting / being evaluated in the active phase, or null. */
export function presentingGroup(phase: PeerVotingPhase): VotingGroup | null {
  if (phase === "round_1") return "A";
  if (phase === "round_2") return "B";
  return null;
}

/**
 * Forward-only transitions (closed → round_1 → round_2 → finished). A reset to
 * `closed` is always allowed as a deliberate escape hatch; moving backwards in
 * any other way would unlock already-cast votes and is rejected.
 */
const FORWARD: Record<PeerVotingPhase, PeerVotingPhase[]> = {
  closed: ["round_1"],
  round_1: ["round_2"],
  round_2: ["finished"],
  finished: [],
};

export function isAllowedTransition(from: PeerVotingPhase, to: PeerVotingPhase): boolean {
  if (to === from) return true;
  if (to === "closed") return true; // deliberate reset
  return FORWARD[from]?.includes(to) ?? false;
}

export async function getPeerVotingPhase(): Promise<PeerVotingPhase> {
  const [row] = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, PEER_VOTING_PHASE_KEY))
    .limit(1);

  const raw = row?.value ?? DEFAULT_PHASE;
  return isValidPeerVotingPhase(raw) ? raw : DEFAULT_PHASE;
}

/** Low-level persistence. Transition rules are enforced in the service layer. */
export async function setPeerVotingPhase(phase: PeerVotingPhase): Promise<void> {
  const existing = await db
    .select({ key: siteSettings.key })
    .from(siteSettings)
    .where(eq(siteSettings.key, PEER_VOTING_PHASE_KEY))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(siteSettings)
      .set({ value: phase, updatedAt: new Date() })
      .where(eq(siteSettings.key, PEER_VOTING_PHASE_KEY));
  } else {
    await db.insert(siteSettings).values({ key: PEER_VOTING_PHASE_KEY, value: phase });
  }
}
