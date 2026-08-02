#!/usr/bin/env python3
"""
Optional AI analysis runner using codex CLI.
"""

import argparse
import csv
import json
import logging
import subprocess
from pathlib import Path
from typing import Tuple
from textwrap import shorten


def parse_repo_url(raw: str) -> Tuple[str, str]:
    if raw.startswith("git@github.com:"):
        path_part = raw.split(":", 1)[1]
    elif "://" in raw:
        after_scheme = raw.split("://", 1)[1]
        path_part = after_scheme.split("/", 1)[1] if "/" in after_scheme else ""
    else:
        path_part = raw
    path_part = path_part.strip("/")
    if path_part.endswith(".git"):
        path_part = path_part[:-4]
    parts = path_part.split("/")
    if len(parts) < 2:
        raise ValueError(f"Cannot parse repo URL: {raw}")
    owner, repo = parts[0], parts[1]
    slug = f"{owner}/{repo}"
    return slug, raw


def load_repos_map(csv_path: Path) -> dict:
    mapping = {}
    with csv_path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if "repo_url" in reader.fieldnames:
                raw = row.get("repo_url", "").strip()
                if not raw:
                    continue
                try:
                    slug, _ = parse_repo_url(raw)
                except ValueError:
                    continue
                repo_id = row.get("id", "").strip() or slug.replace("/", "-")
                mapping[repo_id] = slug
            elif row.get("id") and row.get("repo"):
                mapping[row["id"].strip()] = row["repo"].strip()
    return mapping


def load_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def find_candidate_readmes(repo_dir: Path) -> list[Path]:
    names = {"README.md", "README.MD", "README", "readme.md", "readme"}
    candidates = []
    for path in repo_dir.rglob("*"):
        if path.name in names and path.is_file() and ".git" not in path.parts:
            candidates.append(path)
    return candidates


def read_best_readme(repo_dir: Path, limit_chars: int = 4000) -> str:
    candidates = find_candidate_readmes(repo_dir)
    if not candidates:
        return "No README found."
    # pick the longest meaningful README (by size), preferring shorter than limit but >50 chars
    candidates.sort(key=lambda p: p.stat().st_size, reverse=True)
    for candidate in candidates:
        content = candidate.read_text(encoding="utf-8", errors="ignore")
        if len(content.strip()) > 50:
            return shorten(content, width=limit_chars, placeholder="... [truncated]")
    content = candidates[0].read_text(encoding="utf-8", errors="ignore")
    return shorten(content, width=limit_chars, placeholder="... [truncated]")


def render_tree(repo_dir: Path, max_entries: int = 200, max_depth: int = 3) -> str:
    lines = []

    def walk(path: Path, depth: int) -> None:
        nonlocal lines
        if len(lines) >= max_entries:
            return
        prefix = "  " * depth
        try:
            entries = sorted(path.iterdir(), key=lambda p: p.name.lower())
        except Exception:
            return
        for entry in entries:
            if len(lines) >= max_entries:
                return
            name = entry.name
            if name in {".git", "__pycache__", "node_modules"}:
                continue
            lines.append(f"{prefix}{name}/" if entry.is_dir() else f"{prefix}{name}")
            if entry.is_dir() and depth + 1 < max_depth:
                walk(entry, depth + 1)

    walk(repo_dir, 0)
    if len(lines) >= max_entries:
        lines.append("... [truncated]")
    return "\n".join(lines) if lines else "No files listed."


def build_prompt(
    template: str,
    context: str,
    repo_id: str,
    repo: str,
    metrics_json: str,
    file_tree: str,
    readme_snippet: str,
) -> str:
    return (
        template.replace("{{HACKATHON_CONTEXT}}", context)
        .replace("{{REPO_ID}}", repo_id)
        .replace("{{REPO}}", repo)
        .replace("{{METRICS_JSON}}", metrics_json)
        .replace("{{FILE_TREE}}", file_tree)
        .replace("{{README_SNIPPET}}", readme_snippet)
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Run optional AI analysis via codex CLI.")
    parser.add_argument("--work-dir", default="work", help="Work directory (contains ai_outputs, metrics)")
    parser.add_argument("--repos-csv", default="data/repos.csv", help="Path to repos.csv")
    parser.add_argument("--only-id", help="Run AI analysis only for this repo id")
    parser.add_argument("--model", default="gpt-5.1-codex-mini", help="Model name for codex CLI")
    args = parser.parse_args()

    work_dir = Path(args.work_dir)
    metrics_dir = work_dir / "metrics"
    ai_outputs_dir = work_dir / "ai_outputs"
    ai_outputs_dir.mkdir(parents=True, exist_ok=True)

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
    logger = logging.getLogger("ai")

    repos_map = load_repos_map(Path(args.repos_csv))
    context_path = Path("ai") / "hackathon_context.md"
    template_path = Path("ai") / "prompt_template.txt"

    if not context_path.exists() or not template_path.exists():
        logger.error("Missing AI context or template files.")
        return

    hackathon_context = load_text(context_path)
    prompt_template = load_text(template_path)

    if args.only_id:
        target_ids = [args.only_id]
    else:
        target_ids = [
            path.stem for path in metrics_dir.glob("*.json") if not path.name.endswith("_commits.json")
        ]

    for repo_id in target_ids:
        metrics_path = metrics_dir / f"{repo_id}.json"
        if not metrics_path.exists():
            logger.warning("Metrics file missing for %s, skipping.", repo_id)
            continue
        if repo_id not in repos_map:
            logger.warning("Repo id %s not found in repos.csv, skipping.", repo_id)
            continue
        repo = repos_map[repo_id]
        metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
        repo_dir = work_dir / "repos" / repo_id
        file_tree = render_tree(repo_dir) if repo_dir.exists() else "Repo directory not found."
        readme_snippet = read_best_readme(repo_dir) if repo_dir.exists() else "Repo directory not found."
        prompt = build_prompt(
            prompt_template,
            hackathon_context,
            repo_id,
            repo,
            json.dumps(metrics, indent=2),
            file_tree,
            readme_snippet,
        )

        logger.info("Running codex for %s", repo_id)
        try:
            result = subprocess.run(
                ["codex", "--yolo", "exec", "--sandbox", "danger-full-access", "--model", args.model, prompt],
                capture_output=True,
                text=True,
            )
        except FileNotFoundError as exc:
            logger.error("codex CLI not found: %s", exc)
            (ai_outputs_dir / f"{repo_id}.txt").write_text(
                "ERROR: codex CLI not available\n", encoding="utf-8"
            )
            continue

        output_path = ai_outputs_dir / f"{repo_id}.txt"
        if result.returncode != 0:
            logger.error("codex failed for %s: %s", repo_id, result.stderr.strip())
            output_path.write_text(f"ERROR: codex failed ({result.returncode})\n{result.stderr}", encoding="utf-8")
            continue

        output_path.write_text(result.stdout, encoding="utf-8")
        logger.info("Wrote AI output to %s", output_path)


if __name__ == "__main__":
    main()
