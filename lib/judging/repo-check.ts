import { eq } from "drizzle-orm";
import { db } from "@/db";
import { team } from "@/db/schema/auth";
import { project } from "@/db/schema/projects";
import { repoCheck } from "@/db/schema/scoring";
import { siteSettings } from "@/db/schema/settings";

/**
 * Step 1 of judging: verify each team set up its repo correctly in the first
 * hour of the hackathon.
 *
 * Requirements (all must exist inside the T0 + 1h window):
 *   1. a PRD committed to the repo
 *   2. a `.cursorrules` file (or `.cursor/rules/*`)
 *   3. a public app URL submitted on the dashboard
 *
 * Everything is read through the GitHub REST API - no cloning. Whether a file
 * existed inside the window is answered exactly by asking for the earliest
 * commit touching that path with `until=<deadline>`: a non-empty response means
 * the file was already there.
 *
 * The result is a flag, never a disqualification. Judges see it and decide.
 */

export const HACKATHON_START_KEY = "hackathon_start_at";

/** Requirements must be in place within this long after T0. */
export const REQUIREMENTS_WINDOW_MS = 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Pure helpers (no network, no db) - these are what the tests cover.
// ---------------------------------------------------------------------------

export type RepoSlug = { owner: string; repo: string };

/**
 * Accept the three forms teams actually paste: a GitHub page URL, an HTTPS
 * clone URL, and an SSH remote. Mirrors the normalization in the offline
 * analyzer (`scan.py`).
 */
export function parseRepoSlug(raw: string | null | undefined): RepoSlug | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const ssh = /^git@github\.com:([^/]+)\/(.+?)(?:\.git)?\/?$/i.exec(trimmed);
  if (ssh) return { owner: ssh[1], repo: ssh[2] };

  const https = /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/]+)\/([^/#?]+)/i.exec(trimmed);
  if (https) return { owner: https[1], repo: https[2].replace(/\.git$/i, "") };

  return null;
}

/** `PRD.md`, `docs/prd.md`, `product-requirements.md`, `.cursor/prd.md`, … */
export function findPrdPath(paths: string[]): string | null {
  const byName = /(^|\/)prd\b[^/]*\.(md|mdx|txt)$/i;
  const byPhrase = /(^|\/)product[-_ ]?requirements?[^/]*\.(md|mdx|txt)$/i;
  return (
    paths.find((p) => byName.test(p)) ?? paths.find((p) => byPhrase.test(p)) ?? null
  );
}

/** Root `.cursorrules`, or any rule file under `.cursor/rules/`. */
export function findCursorRulesPath(paths: string[]): string | null {
  return (
    paths.find((p) => p === ".cursorrules") ??
    paths.find((p) => /^\.cursor\/rules\/.+/i.test(p)) ??
    null
  );
}

export type RequirementFlags = {
  hasPrd: boolean;
  hasCursorRules: boolean;
  hasAppUrl: boolean;
  prdOnTime: boolean;
  cursorRulesOnTime: boolean;
  appUrlOnTime: boolean;
};

/** A team passes step 1 only when all three exist AND all three were on time. */
export function isOnTime(flags: RequirementFlags): boolean {
  return (
    flags.hasPrd &&
    flags.hasCursorRules &&
    flags.hasAppUrl &&
    flags.prdOnTime &&
    flags.cursorRulesOnTime &&
    flags.appUrlOnTime
  );
}

export function submittedWithinWindow(
  submittedAt: Date | null | undefined,
  deadline: Date,
): boolean {
  return submittedAt != null && submittedAt.getTime() <= deadline.getTime();
}

// ---------------------------------------------------------------------------
// T0 setting
// ---------------------------------------------------------------------------

export async function getHackathonStartAt(): Promise<Date | null> {
  const [row] = await db
    .select({ value: siteSettings.value })
    .from(siteSettings)
    .where(eq(siteSettings.key, HACKATHON_START_KEY))
    .limit(1);

  if (!row?.value) return null;
  const date = new Date(row.value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function setHackathonStartAt(startAt: Date | null): Promise<Date | null> {
  if (!startAt) {
    await db.delete(siteSettings).where(eq(siteSettings.key, HACKATHON_START_KEY));
    return null;
  }

  await db
    .insert(siteSettings)
    .values({ key: HACKATHON_START_KEY, value: startAt.toISOString() })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value: startAt.toISOString(), updatedAt: new Date() },
    });

  return startAt;
}

// ---------------------------------------------------------------------------
// GitHub access
// ---------------------------------------------------------------------------

/** Injectable so tests never touch the network. */
export type GitHubClient = {
  /** Every file path in the repo at HEAD. */
  listPaths(slug: RepoSlug): Promise<string[]>;
  /** True when `path` was already committed at or before `until`. */
  existedBy(slug: RepoSlug, path: string, until: Date): Promise<boolean>;
};

class GitHubError extends Error {}

const GITHUB_API = "https://api.github.com";

function githubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  // ponytail: unauthenticated GitHub is 60 req/hr, which ~50 teams blow through
  // immediately. A token raises it to 5000/hr.
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function githubFetch(path: string): Promise<Response> {
  const res = await fetch(`${GITHUB_API}${path}`, { headers: githubHeaders() });
  if (res.status === 404) {
    throw new GitHubError("Repository not found, or it is private and the token cannot read it.");
  }
  if (res.status === 403 || res.status === 429) {
    throw new GitHubError(
      "GitHub rate limit hit. Set GITHUB_TOKEN and re-run the check.",
    );
  }
  if (!res.ok) {
    throw new GitHubError(`GitHub returned HTTP ${res.status}.`);
  }
  return res;
}

export const liveGitHubClient: GitHubClient = {
  async listPaths(slug) {
    const res = await githubFetch(
      `/repos/${slug.owner}/${slug.repo}/git/trees/HEAD?recursive=1`,
    );
    const json = (await res.json()) as {
      tree?: Array<{ path?: string; type?: string }>;
    };
    return (json.tree ?? [])
      .filter((entry) => entry.type === "blob" && typeof entry.path === "string")
      .map((entry) => entry.path as string);
  },

  async existedBy(slug, path, until) {
    const res = await githubFetch(
      `/repos/${slug.owner}/${slug.repo}/commits` +
        `?path=${encodeURIComponent(path)}&until=${until.toISOString()}&per_page=1`,
    );
    const commits = (await res.json()) as unknown[];
    return Array.isArray(commits) && commits.length > 0;
  },
};

// ---------------------------------------------------------------------------
// The check
// ---------------------------------------------------------------------------

export type RepoCheckResult = {
  teamId: number;
  hasPrd: boolean;
  hasCursorRules: boolean;
  hasAppUrl: boolean;
  onTime: boolean;
  details: RepoCheckDetails;
};

export type RepoCheckDetails = {
  prdPath: string | null;
  cursorRulesPath: string | null;
  prdOnTime: boolean;
  cursorRulesOnTime: boolean;
  appUrlOnTime: boolean;
  appUrlSubmittedAt: string | null;
  deadline: string | null;
  githubUrl: string | null;
  error: string | null;
};

function emptyDetails(): RepoCheckDetails {
  return {
    prdPath: null,
    cursorRulesPath: null,
    prdOnTime: false,
    cursorRulesOnTime: false,
    appUrlOnTime: false,
    appUrlSubmittedAt: null,
    deadline: null,
    githubUrl: null,
    error: null,
  };
}

/**
 * Run the check for one team and cache the result. Never throws for expected
 * failures (no T0, no repo, private repo, rate limit) - the reason lands in
 * `details.error` so an admin can see why a team shows as failing.
 */
export async function runRepoCheck(
  teamId: number,
  client: GitHubClient = liveGitHubClient,
): Promise<RepoCheckResult> {
  const details = emptyDetails();

  const [row] = await db
    .select({
      githubUrl: project.githubUrl,
      demoUrl: project.demoUrl,
      appUrlSubmittedAt: project.appUrlSubmittedAt,
    })
    .from(project)
    .where(eq(project.teamId, teamId))
    .limit(1);

  const hasAppUrl = Boolean(row?.demoUrl?.trim());
  details.githubUrl = row?.githubUrl?.trim() || null;
  details.appUrlSubmittedAt = row?.appUrlSubmittedAt?.toISOString() ?? null;

  const startAt = await getHackathonStartAt();
  if (!startAt) {
    details.error = "Hackathon start time is not set. Set it before running the check.";
    return persist({ teamId, hasPrd: false, hasCursorRules: false, hasAppUrl, onTime: false, details });
  }

  const deadline = new Date(startAt.getTime() + REQUIREMENTS_WINDOW_MS);
  details.deadline = deadline.toISOString();
  details.appUrlOnTime =
    hasAppUrl && submittedWithinWindow(row?.appUrlSubmittedAt ?? null, deadline);

  const slug = parseRepoSlug(details.githubUrl);
  if (!slug) {
    details.error = details.githubUrl
      ? "Could not read an owner/repo out of that GitHub URL."
      : "No GitHub URL submitted.";
    return persist({ teamId, hasPrd: false, hasCursorRules: false, hasAppUrl, onTime: false, details });
  }

  let hasPrd = false;
  let hasCursorRules = false;
  try {
    const paths = await client.listPaths(slug);
    details.prdPath = findPrdPath(paths);
    details.cursorRulesPath = findCursorRulesPath(paths);
    hasPrd = details.prdPath !== null;
    hasCursorRules = details.cursorRulesPath !== null;

    const [prdOnTime, cursorRulesOnTime] = await Promise.all([
      details.prdPath ? client.existedBy(slug, details.prdPath, deadline) : Promise.resolve(false),
      details.cursorRulesPath
        ? client.existedBy(slug, details.cursorRulesPath, deadline)
        : Promise.resolve(false),
    ]);
    details.prdOnTime = prdOnTime;
    details.cursorRulesOnTime = cursorRulesOnTime;
  } catch (error) {
    details.error =
      error instanceof GitHubError ? error.message : "Failed to read the repository from GitHub.";
  }

  const onTime = isOnTime({
    hasPrd,
    hasCursorRules,
    hasAppUrl,
    prdOnTime: details.prdOnTime,
    cursorRulesOnTime: details.cursorRulesOnTime,
    appUrlOnTime: details.appUrlOnTime,
  });

  return persist({ teamId, hasPrd, hasCursorRules, hasAppUrl, onTime, details });
}

async function persist(result: RepoCheckResult): Promise<RepoCheckResult> {
  const values = {
    teamId: result.teamId,
    hasPrd: result.hasPrd,
    hasCursorRules: result.hasCursorRules,
    hasAppUrl: result.hasAppUrl,
    onTime: result.onTime,
    details: JSON.stringify(result.details),
    checkedAt: new Date(),
  };

  await db
    .insert(repoCheck)
    .values(values)
    .onConflictDoUpdate({ target: repoCheck.teamId, set: values });

  return result;
}

/**
 * Run the check for every active team, sequentially. ponytail: serial keeps us
 * well inside GitHub's secondary rate limits and ~50 teams takes seconds;
 * batch it only if the field ever gets large enough to notice.
 */
export async function runRepoCheckForAllTeams(
  client: GitHubClient = liveGitHubClient,
): Promise<RepoCheckResult[]> {
  const teams = await db
    .select({ id: team.id })
    .from(team)
    .where(eq(team.status, "active"));

  const results: RepoCheckResult[] = [];
  for (const t of teams) {
    results.push(await runRepoCheck(t.id, client));
  }
  return results;
}

export type RepoCheckRow = typeof repoCheck.$inferSelect;

export async function listRepoChecks(): Promise<RepoCheckRow[]> {
  return db.select().from(repoCheck);
}
