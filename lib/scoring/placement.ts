/**
 * Final leaderboard ordering across all three judging steps.
 *
 * Kept db-free and pure so the ordering rules can be tested directly - this is
 * the one piece of the judging pipeline where a subtle mistake silently produces
 * a wrong winner.
 */

export type PlacementInput = {
  teamName: string;
  /** Selected for the staged finals. */
  isFinalist: boolean;
  /** Mean of the finals pitch scores (0-100). 0 when nobody has scored the pitch yet. */
  pitchAvg: number;
  /** Overnight build score after penalties / manual override (0-100). */
  totalAvg: number;
};

/**
 * Ordering, most-to-least significant:
 *
 *   1. Finalists rank above everyone else. The build score got them on stage;
 *      it does not put a non-finalist above someone who pitched.
 *   2. Between two finalists, the higher pitch average wins. This is what the
 *      finals decide.
 *   3. Higher build score wins. Doing double duty here is deliberate: it orders
 *      the non-finalists, AND it breaks ties between finalists. Before any pitch
 *      is scored every finalist has pitchAvg 0, so the finals block simply sits
 *      in build order until judges start scoring - nothing looks broken mid-event.
 *   4. Alphabetical, so the order is at least stable and reproducible.
 */
export function comparePlacement(a: PlacementInput, b: PlacementInput): number {
  if (a.isFinalist !== b.isFinalist) return a.isFinalist ? -1 : 1;
  if (a.isFinalist && b.isFinalist && b.pitchAvg !== a.pitchAvg) {
    return b.pitchAvg - a.pitchAvg;
  }
  if (b.totalAvg !== a.totalAvg) return b.totalAvg - a.totalAvg;
  return a.teamName.localeCompare(b.teamName);
}

/**
 * Pre-finals order: purely the overnight build score.
 *
 * This is what finalist selection must use. `comparePlacement` already floats
 * the CURRENT finalists to the top, so selecting "top N" off that order would
 * re-pick whoever is already selected instead of the actual best builds.
 */
export function compareBuildScore(
  a: Pick<PlacementInput, "teamName" | "totalAvg">,
  b: Pick<PlacementInput, "teamName" | "totalAvg">,
): number {
  if (b.totalAvg !== a.totalAvg) return b.totalAvg - a.totalAvg;
  return a.teamName.localeCompare(b.teamName);
}

/** Mean of a judge's three pitch criteria summed per judge (each row is out of 100). */
export function pitchTotal(row: { delivery: number; clarity: number; impact: number }): number {
  return row.delivery + row.clarity + row.impact;
}
