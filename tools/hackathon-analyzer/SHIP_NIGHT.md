# Cursor Miami Ship Night · Repo Analyzer

Vendored from [cursor-hackathon-hcmc-2025](https://github.com/Git-on-my-level/cursor-hackathon-hcmc-2025).

Ship Night uses this tool instead of peer expo / swipe voting. Judges review GitHub metrics, then enter official scores in `/staff`.

## Workflow

1. Participants submit a public GitHub URL in the event app.
2. As staff, open **`/staff/analyze`** and click **Export repos.csv**.
3. Save the file to `tools/hackathon-analyzer/data/repos.csv` (or pass its path to `scan.py`).
4. Set Ship Night start/end in `config.json` (`t0` / `t1`).
5. Run the scanner:

```bash
python3 tools/hackathon-analyzer/scan.py \
  --repos tools/hackathon-analyzer/data/repos.csv \
  --config tools/hackathon-analyzer/config.json \
  --work-dir tools/hackathon-analyzer/work
```

6. Refresh `/staff/analyze` — metrics and flags merge automatically from
   `work/summary/metrics_summary.csv`.
7. Optional AI notes:

```bash
python3 tools/hackathon-analyzer/ai/run_ai.py \
  --work-dir tools/hackathon-analyzer/work \
  --repos-csv tools/hackathon-analyzer/data/repos.csv
```

8. Score each team at `/staff/evaluate/[teamId]`. Publish ranking when ready.

## Optional local HCMC UI

```bash
python3 tools/hackathon-analyzer/ui/server.py \
  --work-dir tools/hackathon-analyzer/work \
  --port 8000
```

## Requirements

- `python3` 3.10+
- `git` in PATH
- Optional: `codex` CLI for AI summaries
