````markdown
# SPEC: Hackathon GitHub Repo Analyzer

Local tool to analyze GitHub repositories for a hackathon and surface:
- Static, objective metrics and flags about commit history and activity.
- Optional short-form AI analysis using `codex --yolo exec --sandbox danger-full-access`.

The tool is designed for:
- macOS
- Local, offline-first usage
- ≤ 100 repositories
- GitHub-only repos (public or private if the user has read access)

---

## 1. Goals

1. Enforce rule: **No code before T0**  
   - T0 = hackathon start time (single global T0, with optional per-repo override).
   - If any commit before T0 exists, **raise a red flag** for that metric (do not auto-disqualify).

2. Provide **per-repo and per-commit metrics** that judges can inspect:
   - Commit timing and velocity.
   - Per-commit LOC and file change statistics.
   - Flags for suspicious patterns (e.g., huge bulk commits).

3. Provide **easy cross-repo comparison**:
   - One summary CSV with key metrics and flags per repo.

4. Provide an optional **short-form AI report** per repo:
   - Uses `codex` CLI with a consistent prompt.
   - Outputs a small text file per repo for human review.

5. Support **caching and resuming**:
   - Repos are cloned into a local folder and reused.
   - Metrics for already-processed repos are not recomputed unless forced.
   - New repos can be appended to the CSV and analyzed incrementally.

---

## 2. Non-Goals

- No automatic disqualification decisions.
- No complex scoring system; judges interpret metrics/flags.
- No web service or UI; this is a CLI-only, local tool.
- No attempt at language-specific static analysis or plagiarism detection beyond generic metrics.

---

## 3. Directory Layout

Implement the tool assuming the following repository structure:

```text
hackathon-analyzer/
  SPEC.md                     # this spec
  scan.py                     # main static analyzer CLI
  ai/
    run_ai.py                 # optional: runs codex for AI analysis
    hackathon_context.md      # editable hackathon description/context
    prompt_template.txt       # LLM prompt template with placeholders
  data/
    repos.csv                 # list of repos to analyze (input)
  work/
    repos/                    # cloned GitHub repositories (cache)
    metrics/                  # per-repo metrics JSON + commit CSVs
    summary/
      metrics_summary.csv     # cross-repo summary for judges
    ai_outputs/               # per-repo AI analysis outputs
    logs/
      scan.log                # optional log file
````

All paths under `work/` should be created automatically if missing.

---

## 4. Dependencies

Assume the following environment:

* OS: macOS
* Required tools:

  * `python3` (≥ 3.10)
  * `git` (available in PATH)
* Optional but recommended:

  * `codex` CLI installed and in PATH for AI analysis:

    * Command form: `codex --yolo exec --sandbox danger-full-access "<PROMPT>"`
* Python dependencies (standard library only if possible: `argparse`, `csv`, `json`, `subprocess`, `datetime`, `statistics`, `os`, `pathlib`, `logging`).

No external Python packages should be required.

---

## 5. Input: `data/repos.csv`

CSV with header row. Required columns:

* `id`
  Unique identifier for the repo (used for local directories and filenames).

* `repo`
  Either:

  * GitHub slug: `owner/name`
  * OR a full git URL: `https://github.com/owner/name.git` (or SSH, if the user prefers).

Optional columns:

* `t0`
  ISO-8601 string for per-repo T0 override. If present, overrides the global `--t0` passed on CLI.

Example `data/repos.csv`:

```csv
id,repo,t0
team-alpha,openai/example-repo,
team-beta,https://github.com/org/hackathon-submission.git,2025-12-01T10:00:00Z
team-gamma,anotherorg/cool-project,
```

Assumptions:

* `id` values are unique.
* If `repo` does not contain `://`, treat it as slug and convert to `https://github.com/<repo>.git`.

---

## 6. CLI: `scan.py`

### 6.1 Usage

```bash
python3 scan.py \
  --repos data/repos.csv \
  --t0 2025-12-01T10:00:00Z \
  --work-dir work \
  [--t1 2025-12-02T10:00:00Z] \
  [--force] \
  [--no-update] \
  [--log-level INFO]
```

Arguments:

* `--repos PATH` (required)
  Path to repos CSV (`data/repos.csv`).

* `--t0 ISO_DATETIME` (required)
  Global hackathon start time (e.g., `2025-12-01T10:00:00Z`).

  * Used for all repos unless a row has its own `t0` column.
  * Parse as ISO-8601. If no timezone, assume UTC.

* `--t1 ISO_DATETIME` (optional)
  Hackathon end time. Used for “during event” vs “after event” metrics. If omitted:

  * `commits_during_event` = commits with timestamp ≥ T0.
  * `commits_after_event` = 0.

* `--work-dir PATH` (optional, default: `work`)
  Base work directory; contains `repos/`, `metrics/`, `summary/`, `logs/`.

* `--force` (optional)
  If set, recompute metrics for all repos even if metrics file already exists.

* `--no-update` (optional)
  If set, do **not** call `git fetch`/`git pull` for existing clones; use them as-is.

* `--log-level LEVEL` (optional, default: `INFO`)
  Logging verbosity (`DEBUG`, `INFO`, `WARNING`, `ERROR`).

### 6.2 Behavior Overview

For each row in `repos.csv`:

1. Resolve `repo_id` and `repo_spec` (`id` and `repo` columns).
2. Determine effective `t0`:

   * If row has `t0` column and it is non-empty → use it.
   * Else → use global `--t0`.
3. Skip if `metrics/<repo_id>.json` already exists AND `--force` is not set.
4. Ensure repo is cloned in `work/repos/<repo_id>/`.
5. Determine default branch.
6. Extract commit data from default branch (chronological).
7. Compute metrics and flags.
8. Write:

   * `work/metrics/<repo_id>.json` (summary metrics).
   * `work/metrics/<repo_id>_commits.csv` (per-commit stats).
9. After all repos are processed, write cross-repo:

   * `work/summary/metrics_summary.csv`.

This design naturally supports:

* Stopping and re-running (already-processed repos are skipped).
* Adding new rows to `repos.csv` later.

---

## 7. Cloning and Caching

### 7.1 Repo directory

For a repo with `id = team-alpha`:

* Clone / use: `work/repos/team-alpha/`

### 7.2 Cloning logic

Function: `ensure_cloned(repo_id, repo_spec, repos_root, update=True) -> Path`

1. Compute `repo_dir = repos_root / repo_id`.
2. If `repo_dir` does **not** exist:

   * Determine clone URL:

     * If `repo_spec` contains `"://"` → use as-is.
     * Else → treat as slug:

       * `clone_url = f"https://github.com/{repo_spec}.git"`
   * Run: `git clone <clone_url> <repo_dir>`
3. If `repo_dir` exists:

   * If `update` is `True`:

     * `git -C <repo_dir> fetch --all --prune`
     * Determine default branch (see below).
     * Checkout and hard reset:

       * `git -C <repo_dir> checkout <default_branch>`
       * `git -C <repo_dir> reset --hard origin/<default_branch>`

### 7.3 Default branch detection

Function: `get_default_branch(repo_dir) -> str`

Algorithm:

1. Try:

   * `git -C <repo_dir> symbolic-ref --short refs/remotes/origin/HEAD`
     Example output: `origin/main`
   * If this succeeds, strip `origin/` prefix to get `main`.
2. If that fails:

   * Fallback to `git -C <repo_dir> rev-parse --abbrev-ref HEAD`.

---

## 8. Commit Data Extraction

Function: `collect_commit_data(repo_dir, default_branch) -> List[CommitDict]`

1. Ensure you are on the default branch:

   * `git -C <repo_dir> checkout <default_branch>`
2. Get full commit history in **chronological order** (oldest first):

Use command:

```bash
git -C <repo_dir> log \
  --reverse \
  --pretty=format:'%H%x1f%aI%x1f%an%x1f%ae%x1f%P%x1f%s' \
  --numstat
```

Interpretation:

* Each commit begins with a header line:

  * Fields separated by ASCII `0x1f` (unit separator):

    * `%H`   → commit SHA
    * `%aI`  → author date (ISO-8601)
    * `%an`  → author name
    * `%ae`  → author email
    * `%P`   → parent SHAs (space-separated)
    * `%s`   → subject line
* Followed by `numstat` lines for that commit:

  * `<insertions>\t<deletions>\t<path>`
* Between commits, there is a blank line.

For each commit, compute:

* `sha`                        (string)
* `author_time`                (parsed from `%aI`, timezone-aware)
* `author_name`                (string)
* `author_email`               (string)
* `parents`                    (list of SHAs from `%P`)
* `is_merge`                   (bool, true if len(parents) > 1)
* `subject`                    (string)
* `insertions`                 (int, sum across `numstat` lines, ignoring binary markers like `-`)
* `deletions`                  (int, same as above)
* `files_changed`              (int, count of paths in `numstat`)

Return a Python list of such commit dicts in chronological order.

---

## 9. Metric Computation

Function: `compute_metrics(commits, t0, t1=None) -> MetricsDict`

### 9.1 Time classification

For each commit:

* `is_before_t0` = `commit.author_time < t0`
* If `t1` is provided:

  * `is_during_event` = `t0 <= author_time <= t1`
  * `is_after_t1` = `author_time > t1`
* If `t1` is not provided:

  * `is_during_event` = `author_time >= t0`
  * `is_after_t1` = `False`

Per-commit derived fields:

* `minutes_since_prev_commit`

  * For the first commit: `null`.
  * For others: `(current.author_time - previous.author_time).total_seconds() / 60.0`.

* `minutes_since_t0`

  * `(author_time - t0).total_seconds() / 60.0`
  * Can be negative if before T0.

### 9.2 Bulk commit flag (external code injection heuristic)

Define constants in code:

```python
BULK_INSERTION_THRESHOLD = 1000   # lines
BULK_FILES_THRESHOLD = 50         # files
```

For each commit:

* `flag_bulk_commit` = `True` if:

  * `insertions >= BULK_INSERTION_THRESHOLD` OR
  * `files_changed >= BULK_FILES_THRESHOLD`

Later metrics:

* `has_bulk_commits` = `any(commit.flag_bulk_commit for commit in commits_during_event)`

### 9.3 Repository-level metrics

Compute:

* `total_commits`

* `total_commits_before_t0`

* `total_commits_during_event`

* `total_commits_after_t1` (0 if no `t1`)

* `total_loc_added` (sum of `insertions` across all commits)

* `total_loc_deleted` (sum of `deletions` across all commits)

* `max_loc_added_single_commit`

* `max_files_changed_single_commit`

* `median_minutes_between_commits`

  * Calculate over all `minutes_since_prev_commit` where not `null`.

* `median_minutes_between_commits_during_event`

  * Same, but only for commits where both current and previous are `is_during_event`.

Time distribution relative to T0 (only counting `is_during_event` commits):

Buckets in hours:

* `commits_0_3h`       (0 ≤ Δt < 3h)
* `commits_3_6h`       (3h ≤ Δt < 6h)
* `commits_6_12h`      (6h ≤ Δt < 12h)
* `commits_12_24h`     (12h ≤ Δt < 24h)
* `commits_after_24h`  (Δt ≥ 24h)

Δt = `(author_time - t0).total_seconds() / 3600.0`.

### 9.4 Flags

* `has_commits_before_t0`
  `total_commits_before_t0 > 0`
  (This is the “No code before T0” red-flag metric.)

* `has_bulk_commits`
  `True` if any `flag_bulk_commit` in `is_during_event` commits.

* `has_large_initial_commit_after_t0`
  `True` if:

  * The **first commit that is `is_during_event`** has `flag_bulk_commit == True`.

* `has_merge_commits`
  `True` if any commit has `is_merge == True`.

These flags should be boolean fields.

---

## 10. Per-commit CSV: `work/metrics/<repo_id>_commits.csv`

For each repo, create a CSV with the following columns:

* `repo_id`
* `seq_index`                  (0-based index in chronological order)
* `sha`
* `author_time_iso`            (ISO-8601 string)
* `minutes_since_prev_commit`  (float or empty for first)
* `minutes_since_t0`           (float; can be negative)
* `insertions`
* `deletions`
* `files_changed`
* `is_merge`                   (0 or 1)
* `is_before_t0`               (0 or 1)
* `is_during_event`            (0 or 1)
* `is_after_t1`                (0 or 1)
* `flag_bulk_commit`           (0 or 1)
* `subject`                    (commit subject; safe to keep full string)

This file is intended for judges to inspect commit velocity and patterns directly in a spreadsheet.

---

## 11. Per-repo JSON: `work/metrics/<repo_id>.json`

Example structure:

```json
{
  "repo_id": "team-alpha",
  "repo": "openai/example-repo",
  "remote_url": "https://github.com/openai/example-repo.git",
  "default_branch": "main",
  "t0": "2025-12-01T10:00:00Z",
  "t1": "2025-12-02T10:00:00Z",
  "generated_at": "2025-12-01T15:30:00Z",

  "summary": {
    "total_commits": 23,
    "total_commits_before_t0": 0,
    "total_commits_during_event": 23,
    "total_commits_after_t1": 0,

    "total_loc_added": 4300,
    "total_loc_deleted": 1200,

    "max_loc_added_single_commit": 3000,
    "max_files_changed_single_commit": 80,

    "median_minutes_between_commits": 25.1,
    "median_minutes_between_commits_during_event": 22.5
  },

  "time_distribution": {
    "commits_0_3h": 5,
    "commits_3_6h": 7,
    "commits_6_12h": 8,
    "commits_12_24h": 3,
    "commits_after_24h": 0
  },

  "flags": {
    "has_commits_before_t0": false,
    "has_bulk_commits": true,
    "has_large_initial_commit_after_t0": true,
    "has_merge_commits": false
  }
}
```

Implementation requirements:

* All datetime fields in ISO-8601 with timezone (preferably UTC).
* Use `null` for metrics that cannot be computed (e.g., median with ≤1 commit).

---

## 12. Cross-repo Summary CSV: `work/summary/metrics_summary.csv`

One row per repo with key metrics and flags. Columns:

* `repo_id`

* `repo`

* `default_branch`

* `t0`

* `t1`

* `total_commits`

* `total_commits_before_t0`

* `total_commits_during_event`

* `total_commits_after_t1`

* `total_loc_added`

* `total_loc_deleted`

* `max_loc_added_single_commit`

* `max_files_changed_single_commit`

* `median_minutes_between_commits`

* `median_minutes_between_commits_during_event`

* `commits_0_3h`

* `commits_3_6h`

* `commits_6_12h`

* `commits_12_24h`

* `commits_after_24h`

* `has_commits_before_t0`             (0/1)

* `has_bulk_commits`                  (0/1)

* `has_large_initial_commit_after_t0` (0/1)

* `has_merge_commits`                 (0/1)

This file is the main artifact used by judges to spot deviations across all repos.

---

## 13. AI Analysis (Optional): `ai/run_ai.py`

### 13.1 Purpose

For each repo with metrics, generate a **short-form AI analysis** using `codex` CLI and write it to `work/ai_outputs/<repo_id>.txt`.

### 13.2 Additional input files

* `ai/hackathon_context.md`

  * Free-form markdown text describing the hackathon, rules, goals, and any nuances.
  * Edited by the organizer.

* `ai/prompt_template.txt`

  * Text file with placeholders:

    * `{{HACKATHON_CONTEXT}}`
    * `{{REPO_ID}}`
    * `{{REPO}}`
    * `{{METRICS_JSON}}`
  * Example content:

    ```text
    You are assisting in reviewing hackathon projects to determine whether they were developed during the hackathon window and to highlight any suspicious patterns.

    HACKATHON CONTEXT:
    {{HACKATHON_CONTEXT}}

    REPOSITORY:
    - ID: {{REPO_ID}}
    - Repo: {{REPO}}

    METRICS (JSON):
    {{METRICS_JSON}}

    TASK:
    Based on these metrics and flags, provide a short analysis of this submission. Focus on:

    - Whether the commit timing and volume seem consistent with a small hackathon project.
    - Any red flags (commits before T0, large bulk commits, unusual commit timing).
    - Any notable patterns worth calling out for judges.

    OUTPUT FORMAT (text only, no JSON):
    - 3–5 bullet points summarizing the key observations.
    - One final line starting with "Overall authenticity assessment:" followed by a short phrase (e.g., "looks consistent with a hackathon project", "some suspicious patterns", "highly suspicious").
    ```

### 13.3 CLI: `ai/run_ai.py`

Usage:

```bash
python3 ai/run_ai.py \
  --work-dir work \
  --repos-csv data/repos.csv \
  [--only-id team-alpha]
```

Arguments:

* `--work-dir` (same as in `scan.py`, default `work`).
* `--repos-csv` path to `data/repos.csv` (for mapping `id` → `repo`).
* `--only-id` (optional) if provided, run AI analysis only for that repo id; otherwise run for all repos that have metrics JSON.

### 13.4 Behavior

For each repo:

1. Load `work/metrics/<repo_id>.json`.

2. Read `repo` string from `repos.csv` row corresponding to `repo_id`.

3. Load `ai/hackathon_context.md`.

4. Load `ai/prompt_template.txt`.

5. Replace placeholders:

   * `{{HACKATHON_CONTEXT}}` with contents of `hackathon_context.md`.
   * `{{REPO_ID}}` with repo id.
   * `{{REPO}}` with repo string from CSV.
   * `{{METRICS_JSON}}` with pretty-printed JSON from metrics file.

6. Obtain a final `prompt` string.

7. Call `codex` CLI:

   ```python
   import subprocess

   result = subprocess.run(
       [
         "codex",
         "--yolo",
         "exec",
         "--sandbox",
         "danger-full-access",
         prompt
       ],
       capture_output=True,
       text=True,
       check=False
   )
   ```

8. Write stdout to `work/ai_outputs/<repo_id>.txt`.

   * If `result.returncode != 0`, log error and write an error marker file instead.

AI output is purely advisory; it does not feed back into metrics.

---

## 14. Logging and Error Handling

* Use `logging` module in `scan.py`.

  * Log to console and optionally to `work/logs/scan.log`.
* For each repo:

  * If cloning or analysis fails, log error but continue to the next repo.
  * Do not create partial metrics files; write them only after successful computation.

Error conditions to handle:

* Git clone failure (e.g., private repo without access).
* Git commands failing inside `repo_dir`.
* Invalid or unparsable dates for `t0`/`t1`.
* Empty commit history.

For AI runner:

* If metrics JSON is missing, skip that repo with a warning.
* If `codex` command fails (non-zero exit), log and write a short error note.

---

## 15. Implementation Notes

* Use timezone-aware datetimes (`datetime.datetime.fromisoformat` and normalize to UTC if needed).
* Keep all numeric values in metrics JSON as plain numbers (no strings).
* All scripts should be executable with `python3` and not require virtualenv setup.

This spec is sufficient for a coding agent to implement the tool end-to-end.
