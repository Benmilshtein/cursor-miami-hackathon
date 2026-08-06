import { describe, it, expect } from "vitest";
import type { RepoCheckDetails } from "./repo-check";
import { decodeContent, MAX_FILE_BYTES, resolveRepoFile } from "./repo-file";

function details(over: Partial<RepoCheckDetails> = {}): RepoCheckDetails {
  return {
    prdPath: "docs/PRD.md",
    cursorRulesPath: ".cursorrules",
    prdOnTime: true,
    cursorRulesOnTime: true,
    appUrlOnTime: true,
    appUrlSubmittedAt: null,
    deadline: null,
    githubUrl: "https://github.com/acme/hack",
    error: null,
    ...over,
  };
}

describe("resolveRepoFile", () => {
  it("picks the cached path matching the kind", () => {
    expect(resolveRepoFile(details(), "prd")).toEqual({
      slug: { owner: "acme", repo: "hack" },
      path: "docs/PRD.md",
    });
    expect(resolveRepoFile(details(), "cursorrules")).toEqual({
      slug: { owner: "acme", repo: "hack" },
      path: ".cursorrules",
    });
  });

  it("returns null when that file was never found", () => {
    expect(resolveRepoFile(details({ prdPath: null }), "prd")).toBeNull();
    expect(resolveRepoFile(details({ cursorRulesPath: null }), "cursorrules")).toBeNull();
  });

  it("returns null when the repo URL is unusable", () => {
    expect(resolveRepoFile(details({ githubUrl: null }), "prd")).toBeNull();
    expect(resolveRepoFile(details({ githubUrl: "https://gitlab.com/acme/hack" }), "prd")).toBeNull();
  });
});

describe("decodeContent", () => {
  it("round-trips base64, including the newlines GitHub embeds", () => {
    const source = "# PRD\n\nBuild the thing.\n";
    const b64 = Buffer.from(source, "utf8").toString("base64");
    // GitHub wraps its base64 at 60 chars; the decoder must tolerate it.
    expect(decodeContent(`${b64.slice(0, 4)}\n${b64.slice(4)}`)).toEqual({
      content: source,
      truncated: false,
    });
  });

  it("caps oversized files and flags the truncation", () => {
    const big = "x".repeat(MAX_FILE_BYTES + 10);
    const result = decodeContent(Buffer.from(big, "utf8").toString("base64"));
    expect(result.truncated).toBe(true);
    expect(result.content).toHaveLength(MAX_FILE_BYTES);
  });
});
