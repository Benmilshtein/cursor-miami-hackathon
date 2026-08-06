import { eq } from "drizzle-orm";
import { db } from "@/db";
import { repoCheck } from "@/db/schema/scoring";
import {
  GitHubError,
  githubFetch,
  parseRepoSlug,
  type RepoCheckDetails,
  type RepoSlug,
} from "./repo-check";

/**
 * Read a team's PRD or `.cursorrules` out of its GitHub repo so a judge or
 * super-admin can review the content in-app.
 *
 * In-app rather than a link to github.com because participant repos are
 * private: a `blob/` deep link 404s for anyone who is not a collaborator.
 * Fetching server-side puts `GITHUB_TOKEN` behind the request instead.
 *
 * The path is not searched for here - `runRepoCheck` already found it and
 * cached it in `repo_check.details`. This just reads that path.
 */

export type RepoFileKind = "prd" | "cursorrules";

/** Files are read for review, not stored; anything past this is noise. */
export const MAX_FILE_BYTES = 200_000;

export type RepoFile = {
  kind: RepoFileKind;
  path: string;
  content: string;
  truncated: boolean;
};

// ---------------------------------------------------------------------------
// Pure helpers - what the tests cover.
// ---------------------------------------------------------------------------

/** Which cached path a kind maps to, plus the repo it lives in. */
export function resolveRepoFile(
  details: RepoCheckDetails,
  kind: RepoFileKind,
): { slug: RepoSlug; path: string } | null {
  const path = kind === "prd" ? details.prdPath : details.cursorRulesPath;
  if (!path) return null;
  const slug = parseRepoSlug(details.githubUrl);
  return slug ? { slug, path } : null;
}

/**
 * GitHub returns file contents as base64 with embedded newlines. Decode, then
 * cap - a runaway file should not be streamed into a browser.
 */
export function decodeContent(base64: string): { content: string; truncated: boolean } {
  const buf = Buffer.from(base64, "base64");
  const truncated = buf.byteLength > MAX_FILE_BYTES;
  return {
    content: buf.subarray(0, MAX_FILE_BYTES).toString("utf8"),
    truncated,
  };
}

// ---------------------------------------------------------------------------
// The read
// ---------------------------------------------------------------------------

export class RepoFileError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function fetchRepoFile(teamId: number, kind: RepoFileKind): Promise<RepoFile> {
  const [row] = await db
    .select({ details: repoCheck.details })
    .from(repoCheck)
    .where(eq(repoCheck.teamId, teamId))
    .limit(1);

  if (!row) {
    throw new RepoFileError(404, "This team has not been checked yet. Run the repo check first.");
  }

  let details: RepoCheckDetails;
  try {
    details = JSON.parse(row.details ?? "{}") as RepoCheckDetails;
  } catch {
    throw new RepoFileError(500, "The cached repo check for this team is unreadable. Re-run it.");
  }

  const target = resolveRepoFile(details, kind);
  if (!target) {
    throw new RepoFileError(
      404,
      kind === "prd"
        ? "No PRD was found in this team's repository."
        : "No .cursorrules file was found in this team's repository.",
    );
  }

  const { slug, path } = target;
  let base64: string;
  try {
    const res = await githubFetch(
      `/repos/${slug.owner}/${slug.repo}/contents/${path
        .split("/")
        .map(encodeURIComponent)
        .join("/")}`,
    );
    const json = (await res.json()) as { content?: string; encoding?: string };
    if (typeof json.content !== "string" || json.encoding !== "base64") {
      throw new RepoFileError(422, "GitHub did not return readable file contents for that path.");
    }
    base64 = json.content;
  } catch (error) {
    if (error instanceof RepoFileError) throw error;
    // Same stance as runRepoCheck: expected GitHub failures surface as a
    // readable reason, never a 500.
    throw new RepoFileError(
      502,
      error instanceof GitHubError ? error.message : "Failed to read the file from GitHub.",
    );
  }

  return { kind, path, ...decodeContent(base64) };
}
