import path from "node:path";

export const ANALYZER_ROOT = path.join(process.cwd(), "tools", "hackathon-analyzer");
export const ANALYZER_WORK = path.join(ANALYZER_ROOT, "work");
export const ANALYZER_METRICS = path.join(ANALYZER_WORK, "metrics");
export const ANALYZER_SUMMARY = path.join(ANALYZER_WORK, "summary", "metrics_summary.csv");
export const ANALYZER_AI = path.join(ANALYZER_WORK, "ai_outputs");
export const ANALYZER_REPOS_CSV = path.join(ANALYZER_ROOT, "data", "repos.csv");
export const ANALYZER_CONFIG = path.join(ANALYZER_ROOT, "config.json");

export function normalizeGithubUrl(raw: string): string {
  return raw
    .trim()
    .replace(/\.git$/i, "")
    .replace(/\/$/, "")
    .toLowerCase();
}

/** HCMC scan.py style: owner/repo → owner-repo */
export function repoIdFromGithubUrl(raw: string): string {
  const normalized = normalizeGithubUrl(raw)
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/^git@github\.com:/, "");
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length < 2) {
    return normalized.replace(/[^a-z0-9._-]+/g, "-") || "unknown";
  }
  return `${parts[0]}-${parts[1]}`;
}
