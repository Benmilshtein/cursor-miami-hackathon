import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { NextRequest } from "next/server";
import { jsonSuccess, toErrorResponse } from "@/lib/api/http";
import { requireAnalyzerStaff } from "@/lib/repo-analyzer/auth";
import {
  ANALYZER_CONFIG,
  ANALYZER_REPOS_CSV,
  ANALYZER_ROOT,
  ANALYZER_WORK,
} from "@/lib/repo-analyzer/paths";
import { buildReposExportCsv } from "@/lib/repo-analyzer/service";

/**
 * Export live submissions to repos.csv and run the vendored HCMC scanner.
 * POST /api/staff/repo-analyzer/scan
 */
export async function POST(request: NextRequest) {
  try {
    await requireAnalyzerStaff(request);

    const csv = await buildReposExportCsv();
    mkdirSync(path.dirname(ANALYZER_REPOS_CSV), { recursive: true });
    mkdirSync(ANALYZER_WORK, { recursive: true });
    writeFileSync(ANALYZER_REPOS_CSV, csv, "utf8");

    const scanPy = path.join(ANALYZER_ROOT, "scan.py");
    const output = await runProcess(
      "python3",
      [
        scanPy,
        "--repos",
        ANALYZER_REPOS_CSV,
        "--config",
        ANALYZER_CONFIG,
        "--work-dir",
        ANALYZER_WORK,
      ],
      ANALYZER_ROOT,
      10 * 60 * 1000,
    );

    return jsonSuccess({
      ok: output.code === 0,
      code: output.code,
      stdout: output.stdout.slice(-4000),
      stderr: output.stderr.slice(-4000),
      reposCsv: ANALYZER_REPOS_CSV,
      workDir: ANALYZER_WORK,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

function runProcess(
  cmd: string,
  args: string[],
  cwd: string,
  timeoutMs: number,
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, env: process.env });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error(`scan timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });
}
