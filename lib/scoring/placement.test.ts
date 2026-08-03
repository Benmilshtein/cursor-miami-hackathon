import { describe, it, expect } from "vitest";
import {
  compareBuildScore,
  comparePlacement,
  pitchTotal,
  type PlacementInput,
} from "./placement";

function team(overrides: Partial<PlacementInput> & { teamName: string }): PlacementInput {
  return { isFinalist: false, pitchAvg: 0, totalAvg: 0, ...overrides };
}

/** Sort a list the way getRanking() does and return just the names, in order. */
function order(teams: PlacementInput[]): string[] {
  return [...teams].sort(comparePlacement).map((t) => t.teamName);
}

describe("comparePlacement", () => {
  it("puts finalists above non-finalists even when the build score is lower", () => {
    expect(
      order([
        team({ teamName: "runner-up", totalAvg: 99 }),
        team({ teamName: "finalist", isFinalist: true, totalAvg: 40, pitchAvg: 10 }),
      ]),
    ).toEqual(["finalist", "runner-up"]);
  });

  it("orders finalists by pitch average", () => {
    expect(
      order([
        team({ teamName: "weak-pitch", isFinalist: true, pitchAvg: 55, totalAvg: 90 }),
        team({ teamName: "strong-pitch", isFinalist: true, pitchAvg: 88, totalAvg: 60 }),
      ]),
    ).toEqual(["strong-pitch", "weak-pitch"]);
  });

  it("falls back to build score when two finalists pitch equally well", () => {
    expect(
      order([
        team({ teamName: "lower-build", isFinalist: true, pitchAvg: 70, totalAvg: 61 }),
        team({ teamName: "higher-build", isFinalist: true, pitchAvg: 70, totalAvg: 82 }),
      ]),
    ).toEqual(["higher-build", "lower-build"]);
  });

  it("leaves finalists in build order before any pitch is scored (mid-event state)", () => {
    expect(
      order([
        team({ teamName: "c", isFinalist: true, totalAvg: 70 }),
        team({ teamName: "a", isFinalist: true, totalAvg: 91 }),
        team({ teamName: "b", isFinalist: true, totalAvg: 83 }),
      ]),
    ).toEqual(["a", "b", "c"]);
  });

  it("orders non-finalists among themselves by build score", () => {
    expect(
      order([
        team({ teamName: "third", totalAvg: 41 }),
        team({ teamName: "first", totalAvg: 77 }),
        team({ teamName: "second", totalAvg: 52 }),
      ]),
    ).toEqual(["first", "second", "third"]);
  });

  it("breaks a total tie alphabetically", () => {
    expect(
      order([
        team({ teamName: "zeta", totalAvg: 50 }),
        team({ teamName: "alpha", totalAvg: 50 }),
      ]),
    ).toEqual(["alpha", "zeta"]);
  });

  it("ignores the pitch average of a non-finalist", () => {
    // A stale pitch row on a team that was later removed from the finals must
    // not float it above other non-finalists.
    expect(
      order([
        team({ teamName: "stale-pitch", pitchAvg: 100, totalAvg: 30 }),
        team({ teamName: "better-build", totalAvg: 60 }),
      ]),
    ).toEqual(["better-build", "stale-pitch"]);
  });

  it("produces a full podium across a mixed field", () => {
    expect(
      order([
        team({ teamName: "nonfinalist-high", totalAvg: 95 }),
        team({ teamName: "finalist-mid", isFinalist: true, pitchAvg: 70, totalAvg: 80 }),
        team({ teamName: "nonfinalist-low", totalAvg: 20 }),
        team({ teamName: "winner", isFinalist: true, pitchAvg: 92, totalAvg: 75 }),
      ]),
    ).toEqual(["winner", "finalist-mid", "nonfinalist-high", "nonfinalist-low"]);
  });
});

describe("compareBuildScore", () => {
  it("ignores finalist status, so re-selecting the top N re-picks by build score", () => {
    // The regression this guards: selecting finalists off comparePlacement order
    // would keep re-picking the teams already flagged, because that order floats
    // finalists to the top regardless of how good their build was.
    const field = [
      team({ teamName: "already-finalist", isFinalist: true, pitchAvg: 99, totalAvg: 30 }),
      team({ teamName: "best-build", totalAvg: 95 }),
      team({ teamName: "second-build", totalAvg: 80 }),
    ];

    expect([...field].sort(compareBuildScore).map((t) => t.teamName)).toEqual([
      "best-build",
      "second-build",
      "already-finalist",
    ]);

    // Contrast: placement order would have put the incumbent first.
    expect([...field].sort(comparePlacement)[0].teamName).toBe("already-finalist");
  });

  it("breaks build-score ties alphabetically", () => {
    expect(
      [team({ teamName: "b", totalAvg: 50 }), team({ teamName: "a", totalAvg: 50 })]
        .sort(compareBuildScore)
        .map((t) => t.teamName),
    ).toEqual(["a", "b"]);
  });
});

describe("pitchTotal", () => {
  it("sums the three criteria to at most 100", () => {
    expect(pitchTotal({ delivery: 30, clarity: 30, impact: 40 })).toBe(100);
    expect(pitchTotal({ delivery: 0, clarity: 0, impact: 0 })).toBe(0);
    expect(pitchTotal({ delivery: 21, clarity: 18, impact: 33 })).toBe(72);
  });
});
