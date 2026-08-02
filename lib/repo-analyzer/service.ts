import { createReadStream, existsSync, readFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { and, asc, eq, isNotNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { team, user } from "@/db/schema/auth";
import { project } from "@/db/schema/projects";
import { judgeScore } from "@/db/schema/scoring";
import {
  ANALYZER_AI,
  ANALYZER_METRICS,
  ANALYZER_SUMMARY,
  normalizeGithubUrl,
  repoIdFromGithubUrl,
} from "@/lib/repo-analyzer/paths";

export type HcmcSummaryRow = Record<string, string>;

export type HcmcJudgeResponse = {
  timestamp: string;
  score: number;
  thoughts: string | null;
};

export type HcmcJudgeRepoInfo = {
  project: string;
  raw_project_names: string[];
  responses: HcmcJudgeResponse[];
  average_score: number;
};

function truthyFlag(value: string | undefined): string {
  if (!value) return "0";
  const v = value.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" ? "1" : "0";
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

async function loadMetricsSummaryMap(): Promise<Map<string, HcmcSummaryRow>> {
  const map = new Map<string, HcmcSummaryRow>();
  if (!existsSync(ANALYZER_SUMMARY)) return map;

  const rl = createInterface({
    input: createReadStream(ANALYZER_SUMMARY, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  let headers: string[] | null = null;
  for await (const line of rl) {
    if (!line.trim()) continue;
    const cols = parseCsvLine(line);
    if (!headers) {
      headers = cols.map((h) => h.trim());
      continue;
    }
    const row: HcmcSummaryRow = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? "";
    });
    const repo = row.repo || row.repo_url || "";
    if (!repo) continue;
    map.set(normalizeGithubUrl(repo), row);
    if (row.repo_id) map.set(row.repo_id, row);
  }
  return map;
}

async function listSubmittedProjects() {
  return db
    .select({
      teamId: team.id,
      teamName: team.name,
      projectId: project.id,
      projectName: project.name,
      githubUrl: project.githubUrl,
      demoUrl: project.demoUrl,
      description: project.description,
    })
    .from(project)
    .innerJoin(team, eq(project.teamId, team.id))
    .where(
      and(
        eq(team.screeningStatus, "approved"),
        isNotNull(project.githubUrl),
        ne(project.githubUrl, ""),
      ),
    )
    .orderBy(asc(team.name));
}

function emptySummaryRow(opts: {
  repoId: string;
  repo: string;
  teamName: string;
  projectName: string;
}): HcmcSummaryRow {
  return {
    repo_id: opts.repoId,
    repo: opts.repo,
    team_name: opts.teamName,
    project_name: opts.projectName,
    default_branch: "",
    t0: "",
    t1: "",
    total_commits: "0",
    total_commits_before_t0: "0",
    total_commits_during_event: "0",
    total_commits_after_t1: "0",
    total_loc_added: "0",
    total_loc_deleted: "0",
    max_loc_added_single_commit: "0",
    max_files_changed_single_commit: "0",
    median_minutes_between_commits: "",
    median_minutes_between_commits_during_event: "",
    commits_0_3h: "0",
    commits_3_6h: "0",
    commits_6_12h: "0",
    commits_12_24h: "0",
    commits_after_24h: "0",
    has_commits_before_t0: "0",
    has_bulk_commits: "0",
    has_large_initial_commit_after_t0: "0",
    has_merge_commits: "0",
    scanned: "0",
  };
}

/**
 * HCMC `/api/summary` shape: { rows: [...] }
 * Built from live Ship Night submissions, enriched with scanner CSV when present.
 */
export async function getHcmcSummary(): Promise<{ rows: HcmcSummaryRow[] }> {
  const [projects, metricsMap] = await Promise.all([
    listSubmittedProjects(),
    loadMetricsSummaryMap(),
  ]);

  const rows = projects.map((p) => {
    const githubUrl = p.githubUrl!;
    const repoId = repoIdFromGithubUrl(githubUrl);
    const key = normalizeGithubUrl(githubUrl);
    const scanned = metricsMap.get(key) || metricsMap.get(repoId);
    if (scanned) {
      return {
        ...scanned,
        repo_id: scanned.repo_id || repoId,
        repo: scanned.repo || githubUrl,
        team_name: p.teamName,
        project_name: p.projectName,
        team_id: String(p.teamId),
        scanned: "1",
        has_commits_before_t0: truthyFlag(scanned.has_commits_before_t0),
        has_bulk_commits: truthyFlag(scanned.has_bulk_commits),
        has_large_initial_commit_after_t0: truthyFlag(
          scanned.has_large_initial_commit_after_t0,
        ),
        has_merge_commits: truthyFlag(scanned.has_merge_commits),
      };
    }
    return {
      ...emptySummaryRow({
        repoId,
        repo: githubUrl,
        teamName: p.teamName,
        projectName: p.projectName,
      }),
      team_id: String(p.teamId),
    };
  });

  return { rows };
}

/**
 * Hcmc `/api/judges` shape from live judge_score rows.
 * Scores are 0–100 totals (Ship Night criteria sum), shown as Judge Avg in the UI.
 */
export async function getHcmcJudges(): Promise<{
  by_repo: Record<string, HcmcJudgeRepoInfo>;
  unmapped_responses: HcmcJudgeResponse[];
}> {
  const rows = await db
    .select({
      teamId: team.id,
      teamName: team.name,
      projectName: project.name,
      githubUrl: project.githubUrl,
      judgeName: user.name,
      judgeEmail: user.email,
      innovation: judgeScore.innovation,
      technicalExecution: judgeScore.technicalExecution,
      aiUsage: judgeScore.aiUsage,
      uxUi: judgeScore.uxUi,
      businessPotential: judgeScore.businessPotential,
      comment: judgeScore.comment,
      createdAt: judgeScore.createdAt,
    })
    .from(judgeScore)
    .innerJoin(team, eq(judgeScore.teamId, team.id))
    .innerJoin(user, eq(judgeScore.judgeUserId, user.id))
    .leftJoin(project, eq(project.teamId, team.id));

  const byCanonical = new Map<string, HcmcJudgeRepoInfo>();

  for (const row of rows) {
    if (!row.githubUrl) continue;
    const total =
      row.innovation +
      row.technicalExecution +
      row.aiUsage +
      row.uxUi +
      row.businessPotential;
    const canonical = normalizeGithubUrl(row.githubUrl);
    const response: HcmcJudgeResponse = {
      timestamp: row.createdAt.toISOString(),
      score: total,
      thoughts: row.comment
        ? `${row.judgeName || row.judgeEmail || "Judge"}: ${row.comment}`
        : `${row.judgeName || row.judgeEmail || "Judge"} scored ${total}/100`,
    };

    const existing = byCanonical.get(canonical);
    if (existing) {
      existing.responses.push(response);
      if (!existing.raw_project_names.includes(row.teamName)) {
        existing.raw_project_names.push(row.teamName);
      }
    } else {
      byCanonical.set(canonical, {
        project: row.projectName || row.teamName,
        raw_project_names: [row.teamName, row.projectName || row.teamName].filter(
          Boolean,
        ) as string[],
        responses: [response],
        average_score: 0,
      });
    }
  }

  const by_repo: Record<string, HcmcJudgeRepoInfo> = {};
  for (const [canonical, info] of byCanonical) {
    info.average_score =
      info.responses.reduce((sum, r) => sum + r.score, 0) / info.responses.length;
    // Mirror common URL forms so the HCMC UI join succeeds
    const withGit = canonical.endsWith(".git") ? canonical : `${canonical}.git`;
    by_repo[canonical] = info;
    by_repo[withGit] = info;
  }

  return { by_repo, unmapped_responses: [] };
}

export function readRepoMetrics(repoId: string): Record<string, unknown> | null {
  const file = `${ANALYZER_METRICS}/${repoId}.json`;
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>;
}

export async function readRepoCommits(repoId: string): Promise<{ rows: HcmcSummaryRow[] }> {
  const file = `${ANALYZER_METRICS}/${repoId}_commits.csv`;
  if (!existsSync(file)) return { rows: [] };

  const rl = createInterface({
    input: createReadStream(file, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });
  let headers: string[] | null = null;
  const rows: HcmcSummaryRow[] = [];
  for await (const line of rl) {
    if (!line.trim()) continue;
    const cols = parseCsvLine(line);
    if (!headers) {
      headers = cols.map((h) => h.trim());
      continue;
    }
    const row: HcmcSummaryRow = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? "";
    });
    rows.push(row);
  }
  return { rows };
}

export function readRepoAi(repoId: string): string | null {
  const file = `${ANALYZER_AI}/${repoId}.txt`;
  if (!existsSync(file)) return null;
  return readFileSync(file, "utf8");
}

export async function buildReposExportCsv(): Promise<string> {
  const projects = await listSubmittedProjects();
  const lines = ["repo_url,id,team_name,project_name"];
  for (const s of projects) {
    const id = repoIdFromGithubUrl(s.githubUrl!);
    lines.push(
      [csvEscape(s.githubUrl!), csvEscape(id), csvEscape(s.teamName), csvEscape(s.projectName)].join(
        ",",
      ),
    );
  }
  return `${lines.join("\n")}\n`;
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function getSubmissionByRepoId(repoId: string) {
  const projects = await listSubmittedProjects();
  return (
    projects.find((p) => repoIdFromGithubUrl(p.githubUrl!) === repoId) ?? null
  );
}
