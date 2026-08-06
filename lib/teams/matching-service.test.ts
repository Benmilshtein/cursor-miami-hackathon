import { describe, it, expect } from "vitest";
import { formTeams } from "./matching-service";
import { MATCH_TEAM_SIZE, TEAM_LIMITS } from "@/lib/teams/constants";

function pool(size: number) {
  return Array.from({ length: size }, (_, i) => ({
    id: `u${i}`,
    experienceLevel: (i % 3) + 1,
    matchNumber: (i % MATCH_TEAM_SIZE) + 1,
  }));
}

const sizes = (teams: { id: string }[][]) => teams.map((t) => t.length);

describe("formTeams", () => {
  it("places every participant on a team", () => {
    for (let size = 1; size <= 30; size += 1) {
      const teams = formTeams(pool(size));
      const placed = teams.flat().map((m) => m.id);

      expect(new Set(placed).size, `pool of ${size} lost or duplicated people`).toBe(
        size,
      );
    }
  });

  it("forms a team for a single leftover participant", () => {
    expect(sizes(formTeams(pool(1)))).toEqual([1]);
  });

  it("keeps a partial pool together instead of discarding it", () => {
    expect(sizes(formTeams(pool(3)))).toEqual([3]);
  });

  it("balances the remainder rather than stranding people", () => {
    expect(sizes(formTeams(pool(5)))).toEqual([3, 2]);
    expect(sizes(formTeams(pool(6)))).toEqual([3, 3]);
    expect(sizes(formTeams(pool(10)))).toEqual([4, 3, 3]);
  });

  it("fills whole teams when the pool divides evenly", () => {
    expect(sizes(formTeams(pool(8)))).toEqual([4, 4]);
  });

  it("never exceeds the team size cap", () => {
    for (let size = 1; size <= 30; size += 1) {
      for (const team of formTeams(pool(size))) {
        expect(team.length).toBeLessThanOrEqual(TEAM_LIMITS.maxMembers);
      }
    }
  });

  it("returns nothing for an empty pool", () => {
    expect(formTeams([])).toEqual([]);
  });
});
