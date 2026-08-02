# Repository Guidelines

## Project Structure & Module Organization
- Core CLI: `scan.py` (metrics), `list_submissions.py` (listing helper), `normalize_judge_responses.py` (data cleanup).
- AI helpers: `ai/run_ai.py` plus prompt assets in `ai/hackathon_context.md` and `ai/prompt_template.txt`.
- Web viewer: `ui/server.py` with static assets under `ui/static/` for browsing generated metrics.
- Data inputs: `data/` holds CSV exports and normalized judge data.
- Outputs: `work/` is the sandbox for clones, metrics, AI summaries, logs, and summaries; safe to delete/regenerate.

## Build, Test, and Development Commands
- `python3 scan.py --repos data/repos.csv --config config.json --work-dir work`: clone repos and compute metrics; add `--force` to recompute, `--no-update` to skip git refresh.
- `python3 ai/run_ai.py --work-dir work --repos-csv data/repos.csv [--only-id <repo>]`: produce AI notes once metrics exist.
- `python3 ui/server.py --work-dir work --port 8000`: serve the local dashboard at http://localhost:8000.
- `python3 normalize_judge_responses.py`: regenerate normalized judge data from raw CSVs in `data/`.
- Use `python3 <script> --help` for full flag descriptions.

## Coding Style & Naming Conventions
- Python 3.10+, PEP 8, 4-space indent; prefer type hints and `Path` over raw strings.
- Favor clear, imperative function names (`ensure_work_dirs`, `collect_commit_data`) and lower_snake_case for variables/functions; PascalCase reserved for classes.
- Use `logging` (see `setup_logging`) instead of `print`; default INFO level.
- Prefer explicit error handling with actionable messages; avoid silent failures.

## Testing Guidelines
- No formal test suite; validate changes by running the primary flows above against a small sample CSV in `data/`.
- When changing git/metrics logic, spot-check `work/metrics/<id>.json` and `_commits.csv` for expected fields and ordering.
- For UI tweaks, start the server and manually verify tables, flags, and time distributions render correctly.

## Commit & Pull Request Guidelines
- Match existing history: short, imperative summaries (e.g., `Add winners`, `Show judge info`).
- Keep commits scoped; avoid bundling unrelated data refreshes with code changes.
- PRs should describe the change, the commands run, and any datasets or sample repos used; include screenshots for UI adjustments.

## Security & Configuration Tips
- Keep secrets out of `config.json`; only store public times/log levels. Use environment variables or local overrides for anything sensitive.
- Avoid committing `work/` outputs unless explicitly requested; they are reproducible and can be large.
- Verify cloned repos come from trusted sources; this tool executes git operations and parses repo contents locally.
