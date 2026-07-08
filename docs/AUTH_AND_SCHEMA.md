# Auth and Data Schema

## Schema design

### Auth and participant (Better Auth + app)

- **user**: Better Auth core table plus `firstName`, `lastName`, `teamId`, `isTeamLead`. Email is unique and used as the cross-provider identity; provider-specific IDs live in `account`.
- **account**: One row per OAuth link (Google/GitHub). `accountId` + `providerId` identify the external account; use this for “googleOauthId” / “githubOauthId” lookups instead of duplicating on `user`.
- **session**, **verification**: Standard Better Auth tables for sessions and verification flows.
- **team**: `id`, `name`, `joinCode`, timestamps. One team has many users; one user has at most one team (`user.teamId`). Team lead is indicated by `user.isTeamLead`; only one lead per team is enforced in application logic (or via a partial unique index later).

### Partner credits

- **partner**: Partner metadata.
- **credit_pool**: One pool per distribution batch; `total_amount`, `target_type` (`team` | `participant`), `distribution_type` (`even` | `excel_unique` | `general_link`), optional `general_credit_url` for a single shared sponsor link.
- **team_credit_allocation**: Per-team allocation for a pool; `amount`, `status` (`assigned` | `claimed` | `used`).
- **participant_credit_allocation**: Per-participant allocation; same shape; unique on `(credit_pool_id, user_id)`.
- **credit_redemption_link**: Redeemable short code; optional `full_url` (sponsor URL from Excel); `claimed_at` / `revoked_at` for lifecycle.
- **credit_upload_batch** / **credit_pending_link**: Staged Excel rows (user id + URL) before admin runs “distribute”.
- **credit_audit_log**: Admin actions (upload, distribute, revoke, reassign).

**Even** distribution is in `lib/credits/distribution.ts`: floor(total / count) per entity; remainder stays in the pool. Recipients are **teams with screening approved** or **participants on an approved team** (not all users with role participant).

**excel_unique**: Upload Excel (columns `user_id` + `url`), dedupe, stage pending rows, then distribute assigns one link per eligible user; undistributed rows stay pending.

**general_link**: One URL on the pool; distribute creates one allocation per eligible participant; participants **claim** on the profile.

**Operational notes (credits)**

- **Who uploads**: Only **super admin** (`POST` upload-links, audited in `credit_audit_log`). Excel must list platform `user.id` values and sponsor URLs (`http://` / `https://`).
- **Staging vs distribute**: Upload stages `credit_pending_link` rows; **Distribute Excel links** assigns them. Rows for unknown user ids are reported in the upload response; they are not staged.
- **Eligibility at distribute time**: Each recipient must be a **participant on an approved team** (`lib/credits/eligible-participants.ts`). If a staged user is not eligible yet, that row stays **pending** until they are eligible and you run distribute again (or remove/replace the row).
- **One link per participant**: `excel_unique` creates at most one `participant_credit_allocation` per `(pool, user)`; duplicate users in the sheet dedupe to the first URL.
- **Team-target pools**: Sponsor **per-team** credit uses **even** distribution and **generated** short links (not Excel URLs). Excel upload is **participant** pools only.

### Scoring and ranking

- **Judges** (`user.role === "judge"`) submit criteria via **staff evaluate** API; updates are blocked when ranking is **finalized**.
- **Super admin** can **enter or edit** any judge’s row (`upsertJudgeScoreByAdmin`, `updateJudgeScoreByAdmin`) and team-level **adjustments** on `team`: `lateSubmissionPenaltyPoints`, optional `judgeCountOverride`, and optional **`finalScoreOverride`** (0–100), which **replaces** the computed average on the public leaderboard when set. Admin score APIs do **not** check finalization so corrections remain possible after freeze if needed.

## Assumptions

- Social auth only (Google, GitHub); no email/password in the first version.
- Provider identities are stored in `account`; no `googleOauthId` / `githubOauthId` columns on `user` to avoid duplication and stay aligned with Better Auth.
- Email is the canonical cross-provider identifier for merging or deduplication.
- `DATABASE_URL` is set at runtime; a fallback exists only so the app builds when env is missing.
- Register entry is a dedicated `/register` page; all “Register” CTAs point there.

## Extending later

- **Team creation**: Add a team service (e.g. `lib/teams/create.ts`) and a route/form that creates a team, sets `user.teamId` and `user.isTeamLead` for the creator, and generates `joinCode`.
- **Team join (invite/join code)**: Look up team by `joinCode`, validate capacity and rules, then update `user.teamId` in a transaction.
- **Credits dashboard**: Read from `credit_pool`, `team_credit_allocation`, and `participant_credit_allocation`; no schema change required.
