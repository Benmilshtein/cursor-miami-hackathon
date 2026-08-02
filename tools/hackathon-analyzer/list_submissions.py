#!/usr/bin/env python3
"""
Print teams in submission order (rows as they appear in the CSV), showing a
human-friendly team name and the git clone URL.

Usage:
    python3 list_submissions.py [--repos data/repos.csv]

It supports either the simple `repo_url` header (current export) or the
`id,repo` style described in SPEC.md. If a team name is not present, it falls
back to the derived repo slug.
"""

from __future__ import annotations

import argparse
import csv
import sys
from pathlib import Path
from typing import Dict, Tuple


def parse_repo_url(raw: str) -> Tuple[str, str]:
    """
    Normalize a repo URL/slug to (owner/repo slug, clone_url).
    Accepts GitHub page URL, HTTPS .git, SSH git@github.com:owner/repo.git, or slug owner/repo.
    """
    if not raw:
        raise ValueError("Empty repo URL")
    trimmed = raw.strip()
    if trimmed.startswith("git@github.com:"):
        path_part = trimmed.split(":", 1)[1]
    elif "://" in trimmed:
        after_scheme = trimmed.split("://", 1)[1]
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


def derive_team_name(row: Dict[str, str], slug: str) -> str:
    for key in ("team_name", "Team Name", "team", "name", "id"):
        val = row.get(key, "")
        if val and val.strip():
            return val.strip()
    return slug.replace("/", "-")


def _first_non_empty(row: Dict[str, str], keys: Tuple[str, ...]) -> str:
    """Return the first non-empty value for the provided keys."""
    for key in keys:
        val = row.get(key, "")
        if val and val.strip():
            return val.strip()
    return ""


def load_repo_name_map(path: Path) -> Dict[str, str]:
    """
    Load a mapping of repo slug -> submitted project name from a CSV.
    Accepts comma- or tab-delimited files; ignores rows without a valid repo URL.
    """
    if not path.exists():
        return {}

    repo_keys = (
        "Please provide the Github URL of your project (should be publicly accessible)",
        "repo_url",
        "repo",
        "github_url",
        "github",
    )
    name_keys = (
        "What is your team or product name? (will be used when announcing winners)",
        "team_name",
        "team",
        "name",
        "product_name",
    )

    repo_map: Dict[str, str] = {}
    with path.open(newline="", encoding="utf-8") as f:
        sample = f.read(2048)
        f.seek(0)
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=",\t")
            delimiter = dialect.delimiter
        except csv.Error:
            delimiter = "\t" if "\t" in sample else ","

        reader = csv.DictReader(f, delimiter=delimiter)
        for row in reader:
            name_val = _first_non_empty(row, name_keys)
            repo_val = _first_non_empty(row, repo_keys)
            if not repo_val:
                # fall back to any field that looks like a GitHub URL
                for val in row.values():
                    if val and "github.com" in val:
                        repo_val = val.strip()
                        break
            if not repo_val:
                continue

            repo_candidates = [part.strip() for part in repo_val.replace("\n", " ").split(",") if part.strip()]
            for candidate in repo_candidates:
                try:
                    slug, _ = parse_repo_url(candidate)
                except ValueError:
                    continue
                # Keep the first discovered name for a repo slug to avoid churn on duplicates.
                if slug not in repo_map:
                    repo_map[slug] = name_val or slug.replace("/", "-")

    return repo_map


def main() -> int:
    parser = argparse.ArgumentParser(description="List teams in submission order with git repo URLs.")
    parser.add_argument("--repos", default="data/repos.csv", type=Path, help="Path to repos CSV (default: data/repos.csv)")
    parser.add_argument(
        "--repo-map",
        default="data/project-repo-map.csv",
        type=Path,
        help="Optional CSV mapping of repo URL to submitted team/product name (default: data/project-repo-map.csv)",
    )
    parser.add_argument(
        "--names-only",
        action="store_true",
        help="Only print team names (no repo URLs)",
    )
    args = parser.parse_args()

    if not args.repos.exists():
        sys.stderr.write(f"Repos CSV not found: {args.repos}\n")
        return 1

    repo_name_map = load_repo_name_map(args.repo_map)

    rows = []
    with args.repos.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for idx, row in enumerate(reader, start=2):  # start=2 accounts for header line
            repo_val = row.get("repo_url") or row.get("repo") or ""
            repo_val = repo_val.strip()
            if not repo_val:
                continue
            try:
                slug, clone_url = parse_repo_url(repo_val)
            except ValueError as exc:
                sys.stderr.write(f"Skipping row {idx}: {exc}\n")
                continue
            team_name = repo_name_map.get(slug) or derive_team_name(row, slug)
            rows.append((team_name, clone_url))

    for idx, (team, repo_url) in enumerate(rows, start=1):
        if args.names_only:
            print(f"{idx:02d}. {team}")
        else:
            print(f"{idx:02d}. {team} -> {repo_url}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
