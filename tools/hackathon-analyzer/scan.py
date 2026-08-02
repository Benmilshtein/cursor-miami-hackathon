#!/usr/bin/env python3
"""
Hackathon GitHub Repo Analyzer
"""

import argparse
import csv
import json
import logging
import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from statistics import median
from typing import Dict, List, Optional, Tuple

BULK_INSERTION_THRESHOLD = 1000
BULK_FILES_THRESHOLD = 50


def parse_iso_datetime(value: str) -> datetime:
    """Parse ISO datetime string and ensure timezone-aware (default UTC)."""
    if value.endswith("Z"):
        value = value[:-1] + "+00:00"
    dt = datetime.fromisoformat(value)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def load_config(path: Optional[Path]) -> Dict:
    if not path:
        return {}
    if not path.exists():
        raise FileNotFoundError(f"Config file not found: {path}")
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def ensure_work_dirs(work_dir: Path) -> Dict[str, Path]:
    paths = {
        "repos": work_dir / "repos",
        "metrics": work_dir / "metrics",
        "summary": work_dir / "summary",
        "ai_outputs": work_dir / "ai_outputs",
        "logs": work_dir / "logs",
    }
    for p in paths.values():
        p.mkdir(parents=True, exist_ok=True)
    return paths


def setup_logging(log_level: str, log_dir: Path) -> logging.Logger:
    logger = logging.getLogger("scan")
    logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))
    logger.handlers.clear()

    formatter = logging.Formatter("%(asctime)s %(levelname)s %(message)s")
    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)
    logger.addHandler(stream_handler)

    log_dir.mkdir(parents=True, exist_ok=True)
    file_handler = logging.FileHandler(log_dir / "scan.log")
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    return logger


def run_git_command(repo_dir: Path, args: List[str]) -> subprocess.CompletedProcess:
    cmd = ["git", "-C", str(repo_dir)] + args
    return subprocess.run(cmd, capture_output=True, text=True)


def get_default_branch(repo_dir: Path) -> str:
    result = run_git_command(repo_dir, ["symbolic-ref", "--short", "refs/remotes/origin/HEAD"])
    if result.returncode == 0:
        ref = result.stdout.strip()
        if ref.startswith("origin/"):
            return ref[len("origin/") :]
        return ref
    result = run_git_command(repo_dir, ["rev-parse", "--abbrev-ref", "HEAD"])
    result.check_returncode()
    return result.stdout.strip()


def parse_repo_url(raw: str) -> Tuple[str, str]:
    """
    Normalize a repo URL/slug to (owner/repo slug, clone_url candidate).
    Accepts GitHub page URL, HTTPS .git, SSH git@github.com:owner/repo.git, or slug owner/repo.
    """
    if not raw:
        raise ValueError("Empty repo URL")
    trimmed = raw.strip()
    if trimmed.startswith("git@github.com:"):
        path_part = trimmed.split(":", 1)[1]
    elif "://" in trimmed:
        # Strip scheme/host
        after_scheme = trimmed.split("://", 1)[1]
        # Remove possible username@host/
        if "/" in after_scheme:
            path_part = after_scheme.split("/", 1)[1]
        else:
            raise ValueError(f"Could not parse repo URL: {raw}")
    else:
        path_part = trimmed

    path_part = path_part.strip("/")
    if path_part.endswith(".git"):
        path_part = path_part[:-4]
    parts = path_part.split("/")
    if len(parts) < 2:
        raise ValueError(f"Could not extract owner/repo from: {raw}")
    owner, repo = parts[0], parts[1]
    slug = f"{owner}/{repo}"
    clone_url = raw if ("://" in trimmed or trimmed.startswith("git@")) else f"https://github.com/{slug}.git"
    return slug, clone_url


def ensure_cloned(repo_id: str, repo_spec: str, repos_root: Path, update: bool = True) -> Path:
    repo_dir = repos_root / repo_id
    if not repo_dir.exists():
        if "://" in repo_spec:
            clone_url = repo_spec
        else:
            clone_url = f"https://github.com/{repo_spec}.git"
        result = subprocess.run(["git", "clone", clone_url, str(repo_dir)], capture_output=True, text=True)
        if result.returncode != 0:
            raise RuntimeError(f"git clone failed for {repo_id}: {result.stderr.strip()}")
    else:
        if update:
            fetch = run_git_command(repo_dir, ["fetch", "--all", "--prune"])
            if fetch.returncode != 0:
                raise RuntimeError(f"git fetch failed for {repo_id}: {fetch.stderr.strip()}")
            default_branch = get_default_branch(repo_dir)
            checkout = run_git_command(repo_dir, ["checkout", default_branch])
            if checkout.returncode != 0:
                raise RuntimeError(f"git checkout failed for {repo_id}: {checkout.stderr.strip()}")
            reset = run_git_command(repo_dir, ["reset", "--hard", f"origin/{default_branch}"])
            if reset.returncode != 0:
                raise RuntimeError(f"git reset failed for {repo_id}: {reset.stderr.strip()}")
    return repo_dir


def collect_commit_data(repo_dir: Path, default_branch: str) -> List[Dict]:
    checkout = run_git_command(repo_dir, ["checkout", default_branch])
    if checkout.returncode != 0:
        raise RuntimeError(f"git checkout {default_branch} failed: {checkout.stderr.strip()}")
    log_cmd = [
        "log",
        "--reverse",
        "--pretty=format:%H%x1f%aI%x1f%an%x1f%ae%x1f%P%x1f%s",
        "--numstat",
    ]
    result = run_git_command(repo_dir, log_cmd)
    if result.returncode != 0:
        raise RuntimeError(f"git log failed: {result.stderr.strip()}")

    commits: List[Dict] = []
    current: Optional[Dict] = None

    for line in result.stdout.splitlines():
        if not line.strip():
            if current is not None:
                commits.append(current)
                current = None
            continue
        if current is None:
            parts = line.split("\x1f")
            if len(parts) != 6:
                raise RuntimeError("Unexpected git log format")
            sha, author_iso, author_name, author_email, parents_raw, subject = parts
            parents = parents_raw.split() if parents_raw.strip() else []
            current = {
                "sha": sha,
                "author_time": parse_iso_datetime(author_iso),
                "author_name": author_name,
                "author_email": author_email,
                "parents": parents,
                "is_merge": len(parents) > 1,
                "subject": subject,
                "insertions": 0,
                "deletions": 0,
                "files_changed": 0,
            }
            continue
        fields = line.split("\t")
        if len(fields) != 3:
            continue
        ins_raw, del_raw, _path = fields
        insertions = int(ins_raw) if ins_raw.isdigit() else 0
        deletions = int(del_raw) if del_raw.isdigit() else 0
        current["insertions"] += insertions
        current["deletions"] += deletions
        current["files_changed"] += 1

    if current is not None:
        commits.append(current)
    return commits


def compute_metrics(commits: List[Dict], t0: datetime, t1: Optional[datetime]) -> Dict:
    commits_enriched = []
    minutes_between_all = []
    minutes_between_event = []
    event_prev_time: Optional[datetime] = None

    for idx, commit in enumerate(commits):
        prev_time = commits[idx - 1]["author_time"] if idx > 0 else None
        minutes_since_prev = None
        if prev_time:
            minutes_since_prev = (commit["author_time"] - prev_time).total_seconds() / 60.0
            minutes_between_all.append(minutes_since_prev)

        if t1:
            is_during = t0 <= commit["author_time"] <= t1
            is_after_t1 = commit["author_time"] > t1
        else:
            is_during = commit["author_time"] >= t0
            is_after_t1 = False
        is_before_t0 = commit["author_time"] < t0

        if is_during and event_prev_time:
            minutes_between_event.append(
                (commit["author_time"] - event_prev_time).total_seconds() / 60.0
            )
        if is_during:
            event_prev_time = commit["author_time"]

        flag_bulk = (
            commit["insertions"] >= BULK_INSERTION_THRESHOLD
            or commit["files_changed"] >= BULK_FILES_THRESHOLD
        )

        commits_enriched.append(
            {
                **commit,
                "minutes_since_prev_commit": minutes_since_prev,
                "minutes_since_t0": (commit["author_time"] - t0).total_seconds() / 60.0,
                "is_before_t0": is_before_t0,
                "is_during_event": is_during,
                "is_after_t1": is_after_t1,
                "flag_bulk_commit": flag_bulk,
            }
        )

    def safe_median(values: List[float]) -> Optional[float]:
        return median(values) if values else None

    total_commits = len(commits_enriched)
    total_commits_before_t0 = sum(1 for c in commits_enriched if c["is_before_t0"])
    total_commits_during_event = sum(1 for c in commits_enriched if c["is_during_event"])
    total_commits_after_t1 = sum(1 for c in commits_enriched if c["is_after_t1"])

    total_loc_added = sum(c["insertions"] for c in commits_enriched)
    total_loc_deleted = sum(c["deletions"] for c in commits_enriched)
    max_loc_added_single_commit = max((c["insertions"] for c in commits_enriched), default=0)
    max_files_changed_single_commit = max((c["files_changed"] for c in commits_enriched), default=0)

    buckets = {
        "commits_0_3h": 0,
        "commits_3_6h": 0,
        "commits_6_12h": 0,
        "commits_12_24h": 0,
        "commits_after_24h": 0,
    }

    for c in commits_enriched:
        if not c["is_during_event"]:
            continue
        hours = (c["author_time"] - t0).total_seconds() / 3600.0
        if 0 <= hours < 3:
            buckets["commits_0_3h"] += 1
        elif 3 <= hours < 6:
            buckets["commits_3_6h"] += 1
        elif 6 <= hours < 12:
            buckets["commits_6_12h"] += 1
        elif 12 <= hours < 24:
            buckets["commits_12_24h"] += 1
        elif hours >= 24:
            buckets["commits_after_24h"] += 1

    first_during = next((c for c in commits_enriched if c["is_during_event"]), None)
    has_large_initial_commit_after_t0 = bool(first_during and first_during["flag_bulk_commit"])

    metrics = {
        "summary": {
            "total_commits": total_commits,
            "total_commits_before_t0": total_commits_before_t0,
            "total_commits_during_event": total_commits_during_event,
            "total_commits_after_t1": total_commits_after_t1,
            "total_loc_added": total_loc_added,
            "total_loc_deleted": total_loc_deleted,
            "max_loc_added_single_commit": max_loc_added_single_commit,
            "max_files_changed_single_commit": max_files_changed_single_commit,
            "median_minutes_between_commits": safe_median(minutes_between_all),
            "median_minutes_between_commits_during_event": safe_median(minutes_between_event),
        },
        "time_distribution": buckets,
        "flags": {
            "has_commits_before_t0": total_commits_before_t0 > 0,
            "has_bulk_commits": any(
                c["flag_bulk_commit"] and c["is_during_event"] for c in commits_enriched
            ),
            "has_large_initial_commit_after_t0": has_large_initial_commit_after_t0,
            "has_merge_commits": any(c["is_merge"] for c in commits_enriched),
        },
        "commits": commits_enriched,
    }
    return metrics


def write_commit_csv(path: Path, repo_id: str, commits: List[Dict]) -> None:
    fieldnames = [
        "repo_id",
        "seq_index",
        "sha",
        "author_time_iso",
        "minutes_since_prev_commit",
        "minutes_since_t0",
        "insertions",
        "deletions",
        "files_changed",
        "is_merge",
        "is_before_t0",
        "is_during_event",
        "is_after_t1",
        "flag_bulk_commit",
        "subject",
    ]
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for idx, c in enumerate(commits):
            writer.writerow(
                {
                    "repo_id": repo_id,
                    "seq_index": idx,
                    "sha": c["sha"],
                    "author_time_iso": c["author_time"].isoformat(),
                    "minutes_since_prev_commit": (
                        f"{c['minutes_since_prev_commit']:.2f}"
                        if c["minutes_since_prev_commit"] is not None
                        else ""
                    ),
                    "minutes_since_t0": f"{c['minutes_since_t0']:.2f}",
                    "insertions": c["insertions"],
                    "deletions": c["deletions"],
                    "files_changed": c["files_changed"],
                    "is_merge": 1 if c["is_merge"] else 0,
                    "is_before_t0": 1 if c["is_before_t0"] else 0,
                    "is_during_event": 1 if c["is_during_event"] else 0,
                    "is_after_t1": 1 if c["is_after_t1"] else 0,
                    "flag_bulk_commit": 1 if c["flag_bulk_commit"] else 0,
                    "subject": c["subject"],
                }
            )


def write_metrics_json(
    path: Path,
    repo_id: str,
    repo_spec: str,
    remote_url: str,
    default_branch: str,
    t0: datetime,
    t1: Optional[datetime],
    metrics: Dict,
) -> None:
    output = {
        "repo_id": repo_id,
        "repo": repo_spec,
        "remote_url": remote_url,
        "default_branch": default_branch,
        "t0": t0.isoformat(),
        "t1": t1.isoformat() if t1 else None,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "summary": metrics["summary"],
        "time_distribution": metrics["time_distribution"],
        "flags": metrics["flags"],
    }
    with path.open("w", encoding="utf-8") as f:
        json.dump(output, f, indent=2)


def write_summary_csv(path: Path, rows: List[Dict]) -> None:
    fieldnames = [
        "repo_id",
        "repo",
        "default_branch",
        "t0",
        "t1",
        "total_commits",
        "total_commits_before_t0",
        "total_commits_during_event",
        "total_commits_after_t1",
        "total_loc_added",
        "total_loc_deleted",
        "max_loc_added_single_commit",
        "max_files_changed_single_commit",
        "median_minutes_between_commits",
        "median_minutes_between_commits_during_event",
        "commits_0_3h",
        "commits_3_6h",
        "commits_6_12h",
        "commits_12_24h",
        "commits_after_24h",
        "has_commits_before_t0",
        "has_bulk_commits",
        "has_large_initial_commit_after_t0",
        "has_merge_commits",
    ]
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            cleaned = {k: ("" if v is None else v) for k, v in row.items()}
            writer.writerow(cleaned)


def load_repos_csv(path: Path) -> List[Dict]:
    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = []
        for row in reader:
            if "repo_url" in reader.fieldnames:
                repo_raw = row.get("repo_url", "").strip()
                if not repo_raw:
                    continue
                try:
                    slug, clone_url = parse_repo_url(repo_raw)
                except ValueError:
                    continue
                repo_id = row.get("id", "").strip() or slug.replace("/", "-")
                rows.append(
                    {
                        "repo_id": repo_id,
                        "repo_spec": clone_url if clone_url else slug,
                        "slug": slug,
                        "t0": row.get("t0", "").strip(),
                    }
                )
            else:
                if not row.get("id") or not row.get("repo"):
                    continue
                rows.append(
                    {
                        "repo_id": row["id"].strip(),
                        "repo_spec": row["repo"].strip(),
                        "slug": row["repo"].strip(),
                        "t0": row.get("t0", "").strip(),
                    }
                )
        return rows


def build_summary_row(repo_id: str, repo_spec: str, default_branch: str, metrics: Dict) -> Dict:
    summary = metrics["summary"]
    time_dist = metrics["time_distribution"]
    flags = metrics["flags"]
    return {
        "repo_id": repo_id,
        "repo": repo_spec,
        "default_branch": default_branch,
        "t0": metrics.get("t0"),
        "t1": metrics.get("t1"),
        "total_commits": summary["total_commits"],
        "total_commits_before_t0": summary["total_commits_before_t0"],
        "total_commits_during_event": summary["total_commits_during_event"],
        "total_commits_after_t1": summary["total_commits_after_t1"],
        "total_loc_added": summary["total_loc_added"],
        "total_loc_deleted": summary["total_loc_deleted"],
        "max_loc_added_single_commit": summary["max_loc_added_single_commit"],
        "max_files_changed_single_commit": summary["max_files_changed_single_commit"],
        "median_minutes_between_commits": summary["median_minutes_between_commits"],
        "median_minutes_between_commits_during_event": summary[
            "median_minutes_between_commits_during_event"
        ],
        "commits_0_3h": time_dist["commits_0_3h"],
        "commits_3_6h": time_dist["commits_3_6h"],
        "commits_6_12h": time_dist["commits_6_12h"],
        "commits_12_24h": time_dist["commits_12_24h"],
        "commits_after_24h": time_dist["commits_after_24h"],
        "has_commits_before_t0": 1 if flags["has_commits_before_t0"] else 0,
        "has_bulk_commits": 1 if flags["has_bulk_commits"] else 0,
        "has_large_initial_commit_after_t0": 1 if flags["has_large_initial_commit_after_t0"] else 0,
        "has_merge_commits": 1 if flags["has_merge_commits"] else 0,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Hackathon GitHub Repo Analyzer")
    parser.add_argument("--repos", required=True, help="Path to repos CSV")
    parser.add_argument("--config", help="Path to config.json (contains t0/t1/log_level)")
    parser.add_argument("--t0", help="Global hackathon start time (ISO-8601). Overrides config if set.")
    parser.add_argument("--t1", help="Hackathon end time (ISO-8601). Overrides config if set.")
    parser.add_argument("--work-dir", default="work", help="Work directory base path")
    parser.add_argument("--no-update", action="store_true", help="Do not fetch/pull existing clones")
    parser.add_argument("--log-level", help="Logging level (overrides config)")
    args = parser.parse_args()

    config = load_config(Path(args.config)) if args.config else {}

    work_dir = Path(args.work_dir)
    dirs = ensure_work_dirs(work_dir)
    log_level = args.log_level or config.get("log_level") or "INFO"
    logger = setup_logging(log_level, dirs["logs"])

    t0_value = args.t0 or config.get("t0")
    if not t0_value:
        logger.error("Global t0 is required (provide via --t0 or config).")
        return
    try:
        global_t0 = parse_iso_datetime(t0_value)
    except Exception as exc:
        logger.error("Failed to parse global t0: %s", exc)
        return
    global_t1 = None
    t1_value = args.t1 or config.get("t1")
    if t1_value:
        try:
            global_t1 = parse_iso_datetime(t1_value)
        except Exception as exc:
            logger.error("Failed to parse global t1: %s", exc)
            return

    repos_csv = Path(args.repos)
    if not repos_csv.exists():
        logger.error("Repos CSV not found: %s", repos_csv)
        return
    rows = load_repos_csv(repos_csv)
    if not rows:
        logger.warning("No repos found in CSV.")
        return

    summary_rows = []

    for row in rows:
        repo_id = row["repo_id"]
        repo_spec = row["repo_spec"]
        t0_value = row.get("t0", "")
        try:
            repo_t0 = parse_iso_datetime(t0_value) if t0_value else global_t0
        except Exception as exc:
            logger.error("Invalid t0 for repo %s: %s", repo_id, exc)
            continue
        repo_t1 = global_t1

        metrics_json_path = dirs["metrics"] / f"{repo_id}.json"
        commits_csv_path = dirs["metrics"] / f"{repo_id}_commits.csv"

        metrics_data = None
        default_branch = None

        if metrics_json_path.exists():
            logger.info("Skipping %s (cached metrics found).", repo_id)
            try:
                with metrics_json_path.open("r", encoding="utf-8") as f:
                    metrics_data = json.load(f)
                    default_branch = metrics_data.get("default_branch")
            except Exception as exc:
                logger.error("Failed to load cached metrics for %s: %s", repo_id, exc)
                continue
        else:
            try:
                repo_dir = ensure_cloned(repo_id, repo_spec, dirs["repos"], update=not args.no_update)
                default_branch = get_default_branch(repo_dir)
                commits = collect_commit_data(repo_dir, default_branch)
                metrics = compute_metrics(commits, repo_t0, repo_t1)
                remote_url_result = run_git_command(repo_dir, ["config", "--get", "remote.origin.url"])
                remote_url = remote_url_result.stdout.strip() if remote_url_result.returncode == 0 else ""
                write_commit_csv(commits_csv_path, repo_id, metrics["commits"])
                write_metrics_json(
                    metrics_json_path,
                    repo_id,
                    repo_spec,
                    remote_url,
                    default_branch,
                    repo_t0,
                    repo_t1,
                    metrics,
                )
                metrics_data = {
                    **metrics,
                    "repo_id": repo_id,
                    "repo": repo_spec,
                    "default_branch": default_branch,
                    "t0": repo_t0.isoformat(),
                    "t1": repo_t1.isoformat() if repo_t1 else None,
                }
                logger.info("Processed %s with %d commits.", repo_id, len(commits))
            except Exception as exc:
                logger.error("Failed processing %s: %s", repo_id, exc)
                continue

        if metrics_data:
            summary_rows.append(
                build_summary_row(repo_id, repo_spec, default_branch or "", metrics_data)
            )

    if summary_rows:
        summary_path = dirs["summary"] / "metrics_summary.csv"
        write_summary_csv(summary_path, summary_rows)
        logger.info("Wrote summary CSV to %s", summary_path)
    else:
        logger.warning("No summary rows generated.")


if __name__ == "__main__":
    main()
