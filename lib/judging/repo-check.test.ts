import { describe, it, expect } from "vitest";
import {
  findCursorRulesPath,
  findPrdPath,
  isOnTime,
  parseRepoSlug,
  submittedWithinWindow,
} from "./repo-check";

describe("parseRepoSlug", () => {
  it("reads the three forms teams actually paste", () => {
    const expected = { owner: "acme", repo: "hack" };
    expect(parseRepoSlug("https://github.com/acme/hack")).toEqual(expected);
    expect(parseRepoSlug("https://github.com/acme/hack.git")).toEqual(expected);
    expect(parseRepoSlug("git@github.com:acme/hack.git")).toEqual(expected);
    expect(parseRepoSlug("github.com/acme/hack/tree/main")).toEqual(expected);
  });

  it("rejects anything that is not a GitHub repo", () => {
    expect(parseRepoSlug("https://gitlab.com/acme/hack")).toBeNull();
    expect(parseRepoSlug("https://github.com/acme")).toBeNull();
    expect(parseRepoSlug("")).toBeNull();
    expect(parseRepoSlug(null)).toBeNull();
  });
});

describe("findPrdPath", () => {
  it("finds a PRD wherever teams put it", () => {
    expect(findPrdPath(["README.md", "PRD.md"])).toBe("PRD.md");
    expect(findPrdPath(["src/app.ts", "docs/prd.md"])).toBe("docs/prd.md");
    expect(findPrdPath(["prd-v2.md"])).toBe("prd-v2.md");
    expect(findPrdPath(["docs/product-requirements.md"])).toBe(
      "docs/product-requirements.md",
    );
  });

  it("does not match unrelated files", () => {
    expect(findPrdPath(["README.md", "src/prdInternal.ts"])).toBeNull();
    expect(findPrdPath([])).toBeNull();
  });
});

describe("findCursorRulesPath", () => {
  it("matches the root file and the rules directory", () => {
    expect(findCursorRulesPath(["README.md", ".cursorrules"])).toBe(".cursorrules");
    expect(findCursorRulesPath([".cursor/rules/style.mdc"])).toBe(".cursor/rules/style.mdc");
  });

  it("does not match a nested .cursorrules or an empty repo", () => {
    expect(findCursorRulesPath(["packages/web/.cursorrules"])).toBeNull();
    expect(findCursorRulesPath([])).toBeNull();
  });
});

describe("submittedWithinWindow", () => {
  const deadline = new Date("2026-08-02T11:00:00Z");

  it("accepts on or before the deadline, rejects after and missing", () => {
    expect(submittedWithinWindow(new Date("2026-08-02T10:59:59Z"), deadline)).toBe(true);
    expect(submittedWithinWindow(deadline, deadline)).toBe(true);
    expect(submittedWithinWindow(new Date("2026-08-02T11:00:01Z"), deadline)).toBe(false);
    expect(submittedWithinWindow(null, deadline)).toBe(false);
  });
});

describe("isOnTime", () => {
  const allGood = {
    hasPrd: true,
    hasCursorRules: true,
    hasAppUrl: true,
    prdOnTime: true,
    cursorRulesOnTime: true,
    appUrlOnTime: true,
  };

  it("passes only when all three exist and all three were on time", () => {
    expect(isOnTime(allGood)).toBe(true);
  });

  it("fails when any single requirement is missing or late", () => {
    for (const key of Object.keys(allGood) as Array<keyof typeof allGood>) {
      expect(isOnTime({ ...allGood, [key]: false })).toBe(false);
    }
  });
});
