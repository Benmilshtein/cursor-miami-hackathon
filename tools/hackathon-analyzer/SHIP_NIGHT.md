# Cursor Miami Ship Night · Repo Analyzer

Vendored from [cursor-hackathon-hcmc-2025](https://github.com/Git-on-my-level/cursor-hackathon-hcmc-2025).

This is the **primary judging surface** for Ship Night project submissions
(same dashboard HCMC used: metrics, flags, AI notes, judge averages).
Peer expo / swipe voting is disabled.

## In-app workflow (preferred)

1. Participants submit a public GitHub URL in the event app.
2. Set `t0` / `t1` in `tools/hackathon-analyzer/config.json` to the Ship Night window.
3. Open **`/staff/analyze`** (full HCMC UI at `/hackathon-analyzer/`).
4. Click **Run scan** — exports live submissions and runs `scan.py`.
5. Review Pre-T0 / Bulk / Init / Merge flags + AI assessment in the table/drawer.
6. Click **Score team →** (or `/staff/evaluate/[teamId]`) to enter official scores.
7. Judge averages appear live in the analyzer. Publish ranking when ready.

## CLI fallback

```bash
# from /staff/analyze → Export CSV, then:
python3 tools/hackathon-analyzer/scan.py \
  --repos tools/hackathon-analyzer/data/repos.csv \
  --config tools/hackathon-analyzer/config.json \
  --work-dir tools/hackathon-analyzer/work

# optional AI authenticity notes
python3 tools/hackathon-analyzer/ai/run_ai.py \
  --work-dir tools/hackathon-analyzer/work \
  --repos-csv tools/hackathon-analyzer/data/repos.csv
```

## API surface (HCMC-compatible)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/staff/repo-analyzer/summary` | Submissions + metrics rows |
| `GET /api/staff/repo-analyzer/judges` | Judge responses by repo URL |
| `GET /api/staff/repo-analyzer/repo/:id/metrics` | Per-repo metrics JSON |
| `GET /api/staff/repo-analyzer/repo/:id/commits` | Commit CSV rows |
| `GET /api/staff/repo-analyzer/repo/:id/ai` | AI notes text |
| `POST /api/staff/repo-analyzer/scan` | Export + run scanner |
| `GET /api/staff/repo-analyzer/export` | Download repos.csv |

## Requirements

- `python3` 3.10+
- `git` in PATH
- Optional: `codex` CLI for AI summaries
