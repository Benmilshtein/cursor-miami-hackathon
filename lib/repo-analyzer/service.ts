import { createReadStream, existsSync } from "node:fs";
import { createInterface } from "node:readline";
import path from "node:path";
import { and, asc, eq, isNotNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { project } from "@/db/schema/projects";
import { team } from "@/db/schema/auth";

export type RepoMetricsFlags = {
  hasCommitsBeforeT0: boolean;
  hasBulkCommits: boolean;
  hasLargeInitialCommitAfterT0: boolean;
  hasMergeCommits: boolean;
};

export type RepoMetrics = {
  totalCommits: number;
  totalLocAdded: number;
  totalLocDeleted: number;
  flags: RepoMetricsFlags;
};

export type AnalyzerSubmission = {
  teamId: number;
  teamName: string;
  projectId: string;
  projectName: string;
  githubUrl: string;
  demoUrl: string | null;
  description: string | null;
  metrics: RepoMetrics | null;
};

const ANALYZER_ROOT = path.join(process.cwd(), "tools", "hackathon-analyzer");
const METRICS_SUMMARY = path.join(
  ANALYZER_ROOT,
  "work",
  "summary",
  "metrics_summary.csv",
);

function normalizeGithubUrl(raw: string): string {
  return raw
    .trim()
    .replace(/\.git$/i, "")
    .replace(/\/$/, "")
    .toLowerCase();
}

function truthyFlag(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

async function loadMetricsByRepo(): Promise<Map<string, RepoMetrics>> {
  const map = new Map<string, RepoMetrics>();
  if (!existsSync(METRICS_SUMMARY)) return map;

  const rl = createInterface({
    input: createReadStream(METRICS_SUMMARY, { encoding: "utf8" }),
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
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? "";
    });
    const repo = row.repo || row.repo_url || "";
    if (!repo) continue;
    map.set(normalizeGithubUrl(repo), {
      totalCommits: Number(row.total_commits || 0),
      totalLocAdded: Number(row.total_loc_added || 0),
      totalLocDeleted: Number(row.total_loc_deleted || 0),
      flags: {
        hasCommitsBeforeT0: truthyFlag(row.has_commits_before_t0),
        hasBulkCommits: truthyFlag(row.has_bulk_commits),
        hasLargeInitialCommitAfterT0: truthyFlag(
          row.has_large_initial_commit_after_t0,
        ),
        hasMergeCommits: truthyFlag(row.has_merge_commits),
      },
    });
  }

  return map;
}

/** Minimal CSV line parser (handles quoted fields). */
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

/**
 * All submitted projects with a GitHub URL, optionally enriched with
 * metrics from tools/hackathon-analyzer/work/summary/metrics_summary.csv
 * (produced by the vendored HCMC scanner).
 */
export async function listAnalyzerSubmissions(): Promise<AnalyzerSubmission[]> {
  const [rows, metricsMap] = await Promise.all([
    db
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
      .orderBy(asc(team.name)),
    loadMetricsByRepo(),
  ]);

  return rows.map((row) => {
    const githubUrl = row.githubUrl!;
    const metrics = metricsMap.get(normalizeGithubUrl(githubUrl)) ?? null;
    return {
      teamId: row.teamId,
      teamName: row.teamName,
      projectId: row.projectId,
      projectName: row.projectName,
      githubUrl,
      demoUrl: row.demoUrl,
      description: row.description,
      metrics,
    };
  });
}

/** CSV compatible with tools/hackathon-analyzer `data/repos.csv`. */
export async function buildReposExportCsv(): Promise<string> {
  const submissions = await listAnalyzerSubmissions();
  const lines = ["repo_url,id,team_name,project_name"];
  for (const s of submissions) {
    const id = `${s.teamId}-${slugify(s.projectName)}`;
    lines.push(
      [
        csvEscape(s.githubUrl),
        csvEscape(id),
        csvEscape(s.teamName),
        csvEscape(s.projectName),
      ].join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "project";
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function getAnalyzerPaths() {
  return {
    root: ANALYZER_ROOT,
    metricsSummary: METRICS_SUMMARY,
    hasMetrics: existsSync(METRICS_SUMMARY),
  };
}
