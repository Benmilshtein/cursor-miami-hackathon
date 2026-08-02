# Replace peer-to-peer voting with active judging

## Context

Today the platform decides winners in two stages: participants award each other
"Launch Credits" in a two-round expo (`lib/peer-voting/*`), and that crowd
leaderboard is what the public `/ranking` page shows. Judges only appear at the
very end, scoring finished submissions.

We're inverting that. Peer voting goes away entirely. Judges instead engage with
teams **live through the night**, watching deployed apps evolve, and winners come
out of a **two-step judging process**:

1. **Requirements gate** — an automated GitHub check that each team created a PRD,
   a `.cursorrules` file, and a public app URL within the first hour of the
   hackathon. Result is a **flag**, not a disqualification.
2. **Final judging** — the existing 5-criteria judge scoring form.

Outcome: judges have accounts and a live view of every team's deployed app plus
its requirements status from hour one, and the public leaderboard reflects judge
scores instead of crowd credits.

## What already exists (reuse, do not rebuild)

- **`judge` role** — `db/schema/auth.ts` `userRoleEnum`. Admin invites judges at
  `/admin/dashboard/staff`, judge sets a password at `/staff/join`. **No new role
  or signup flow needed.**
- **Judge dashboard** — `app/staff/page.tsx` lists teams; `app/staff/evaluate/[teamId]`
  is the scoring form; `judge_score` table stores it. That is step 2, already built.
- **App URL submission** — `components/participant/AppUrlSection.tsx` +
  `PUT /api/projects/app-url` → `upsertAppLinks()` in `lib/projects/service.ts`.
  Teams already submit `demoUrl` + `githubUrl`.
- **Judge leaderboard API** — `getPublicRankingDetail()` in `lib/scoring/service.ts`,
  served by `GET /api/ranking`, gated on `isRankingFinalized()`.

---

## Part 1 — Delete peer voting

**Delete these files:**

```
db/schema/peer-voting.ts
lib/peer-voting/phase.ts
lib/peer-voting/service.ts
app/api/peer-voting/state/route.ts
app/api/peer-voting/vote/route.ts
app/api/admin/peer-voting/leaderboard/route.ts
app/api/admin/peer-voting/phase/route.ts
app/api/admin/peer-voting/split/route.ts
components/participant/PeerVotingSection.tsx
components/admin/PeerVotingPanel.tsx
```

**Edit these:**

| File | Change |
|---|---|
| `db/index.ts` | Drop `peerVotingSchema` import + spread |
| `db/schema/relations.ts` | Drop `peerVote` import, `peerVotes: many(...)` on user + team (lines ~29, ~44), `peerVoteRelations` (~124) |
| `db/schema/auth.ts` | Drop `votingGroupEnum`, `team.votingGroup`, `team_voting_group_idx` |
| `app/dashboard/page.tsx` | Drop `PeerVotingSection` import (34), `peerVotingActive` state (417), the `/api/peer-voting/state` fetch (439-451), `sectionVote` copy in all 3 locales, `Vote` icon import, nav item (796), `<section id="vote">` (1342-1346) |
| `app/admin/dashboard/teams/page.tsx` | Drop `PeerVotingPanel` import (6) + usage (164) |
| `lib/i18n.ts` | Rewrite the 3 crowd-voting strings (~786, ~795, ~824) to describe judge-led selection |

**Migration** — new `drizzle/00XX_drop_peer_voting.sql`:
`drop table peer_vote;` → `alter table team drop column voting_group;` → `drop type voting_group;`
Leave `supabase/migrations/20260604140000_peer_voting.sql` alone (history).

---

## Part 2 — `/ranking` shows the judge leaderboard

- `app/api/ranking/stream/route.ts` — swap `getCrowdLeaderboard()` for
  `getPublicRankingDetail()`; keep the SSE shape and `notifyRankingUpdate()` wiring
  (`lib/scoring/events.ts` already fires on judge score writes).
- `app/ranking/page.tsx` — replace `CrowdRow` (`totalCredits`/`uniqueVoters`) with
  the `PublicRankingEntry` shape (`totalAvg`, per-criterion averages, `judgeCount`).
  Retitle "Crowd vote results" → "Results". The existing `finalized` gate stays:
  nothing publishes until admin flips it at `/admin/dashboard/ranking`.

---

## Part 3 — Step 1: GitHub requirements check

### Schema

Two additions, both minimal:

1. `project.appUrlSubmittedAt` (`timestamptz`, nullable) — set in `upsertAppLinks()`
   **only** on the null → non-null transition of `demoUrl`. This is the timestamp
   the "public URL within the first hour" rule is checked against.
2. New table `repo_check` in `db/schema/scoring.ts` (it belongs with judging):

```ts
teamId        integer  primaryKey references team(id) on delete cascade
hasPrd        boolean  notNull default false
hasCursorRules boolean notNull default false
hasAppUrl     boolean  notNull default false
onTime        boolean  notNull default false   // all three within T0 + 1h
details       text                              // JSON: matched paths, timestamps, errors
checkedAt     timestamptz notNull defaultNow()
```

Cached so the check runs once per team, not once per judge page load.

3. New `site_settings` key `hackathon_start_at` (ISO string) — T0. Follow the exact
   pattern of `getProjectDeadline`/`setProjectDeadline` in `lib/projects/service.ts`.

### Logic — `lib/judging/repo-check.ts` (new, ~150 lines)

`runRepoCheck(teamId)`:

1. Read `project.githubUrl`, `project.demoUrl`, `project.appUrlSubmittedAt`; read T0.
   Missing T0 or GitHub URL → store a `details` error and return.
2. Parse `owner/repo` out of the GitHub URL (accept page URL, `.git`, and SSH forms —
   `scan.py` in `~/Desktop/cursor-hackathon-hcmc-2025` normalizes the same three).
3. `GET /repos/{owner}/{repo}/git/trees/HEAD?recursive=1` — find:
   - **PRD**: any path matching `/(^|\/)prd[^/]*\.(md|txt)$/i` or `/(^|\/)(docs|\.cursor)\/.*prd/i`
   - **cursorrules**: `.cursorrules` at root, or any path under `.cursor/rules/`
4. For each matched path: `GET /repos/{o}/{r}/commits?path=<p>&until=<T0+1h>&per_page=1`.
   A non-empty response means the file existed inside the first hour. This is exact
   and needs no clone.
5. `hasAppUrl` = `demoUrl` non-empty; on-time = `appUrlSubmittedAt <= T0 + 1h`.
6. `onTime` = all three present **and** all three within the window. Upsert `repo_check`.

**`GITHUB_TOKEN` env var required** — add to `.env.example`. Unauthenticated GitHub
is 60 req/hr, which will not survive ~50 teams × 3 calls. With a token it's 5000/hr.
Handle 403/rate-limit and 404/private-repo by writing the reason into `details`
rather than throwing.

### API routes (new)

- `POST /api/admin/repo-check` — super-admin, runs the check for all teams (or one
  via `{ teamId }`). Guard with `requireSuperAdminUser`.
- `GET /api/staff/repo-check` — judges only, returns cached `repo_check` rows keyed
  by teamId. No live GitHub calls on the judge path.

### Check for yourself

`lib/judging/repo-check.test.ts` (vitest is already configured) — one test over the
path-matching + on-time predicate with a fixture tree and fixture timestamps. No
network: inject the GitHub fetch. This is the only non-trivial logic here.

---

## Part 4 — Judge live-view through the night

`lib/scoring/service.ts` → `getApprovedTeamsForJudge()` currently filters
`screeningStatus = 'approved'` and the UI only links teams that have a `project` row.
For overnight viewing judges need every active team that has a deployed URL.

- Widen the query to all `status = 'active'` teams, and left-join `repo_check`.
  Return `demoUrl`, `githubUrl`, and the four check booleans per team.
- `app/staff/page.tsx` — on each team card add:
  - a prominent **Open live app** link (`demoUrl`, `target="_blank"`) — this is the
    through-the-night surface;
  - a requirements badge: PRD / `.cursorrules` / URL, green or amber, with the
    "on time" state distinct from "present but late". **Flag only** — the Score
    link stays enabled regardless, matching the analyzer's own no-auto-DQ stance.
- `app/api/staff/evaluate/[teamId]/route.ts` — leave the `NO_PROJECT` guard as is.
  Scoring still requires a submission; only *viewing* is widened.
- `app/admin/dashboard/teams/page.tsx` — where `PeerVotingPanel` was, put a
  "Run repo check" button hitting `POST /api/admin/repo-check`, plus a pass/fail
  column. Reuses the slot the deleted panel occupied.

---

## Verification

1. `npm run db:generate && npm run db:migrate` — confirm `peer_vote`, `team.voting_group`,
   and the `voting_group` enum are gone; `repo_check` and `project.app_url_submitted_at` exist.
2. `npm test` — the repo-check unit test passes.
3. `npm run lint && npm run build` — catches every dangling peer-voting import.
4. `npm run dev`, then end-to-end:
   - Participant dashboard: no Vote nav item, no vote section; App URL section still saves.
   - Admin → Teams: no peer-voting panel; "Run repo check" populates the pass/fail column.
   - Admin: set `hackathon_start_at`, then run the check against a real repo with a
     known PRD/`.cursorrules` and confirm the on-time result matches the commit dates.
   - Judge (`/staff`): sees every active team, "Open live app" opens `demoUrl`,
     requirements badges render, Score still works on teams with a project.
   - `/ranking`: shows nothing until admin finalizes, then judge averages — not credits.

## Skipped on purpose

- **No judge notes/annotations table.** Judges get live URLs + `judge_score.comment`.
  Add a notes table only if judges actually ask for it after the event.
- **No judging phase state machine.** The peer-voting one is exactly the machinery
  we're deleting; `ranking_finalized` already freezes scores.
- **No repo cloning or commit-velocity metrics in-app.** `scan.py` already does that
  offline and better. Wire its CSV in later if judges want the deeper analysis.
