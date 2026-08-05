# Step 3: the finals — finalists pitch to judges

## Context

The previous change (shipped, see `docs/new-judging-refactor.md`) replaced peer
voting with two judging steps: an automated repo requirements check (`repo_check`),
and overnight judge scoring of live builds (`judge_score`, 5 criteria, 100 points).
Right now step 2 decides everything — the public `/ranking` is just the build-score
average.

That leaves the event without its ending. The landing copy already promises a
finals round ("Each finalist gets exactly 90 seconds to show their app"), but the
app has no notion of a finalist and nowhere for a judge to score a pitch. Judges
would be left huddling off-platform and an admin would be hand-entering the result
via `finalScoreOverride`.

This adds the third and final step:

1. **Requirements check** — automated, a flag. *(shipped)*
2. **Overnight build judging** — 5 criteria, 100 points. *(shipped)* Gets you on stage.
3. **The finals** — top teams are marked finalists, pitch on stage, and judges
   score the pitch on a 3-part rubric. **The pitch orders the finalists**; everyone
   else keeps their build ranking below them.

Outcome: the whole judging process lives in the app, end to end, and the leaderboard
reveal at the end of the night is a read of real data rather than a manual entry.

## Decisions taken

- **Finalists**: top N by build score in one click, admin can then toggle individuals.
- **Placement**: pitch decides the order *among finalists*; finalists always rank
  above non-finalists. Build score got them there.
- **Rubric**: Delivery (30) + Clarity (30) + Impact (40) = 100.
- **No stage view**: no presentation order, no timer, no now-presenting state.
  Judges see the finalist list and score each team after it pitches.
- **No new phase machine**: pitch scoring is open to judges until the admin
  publishes results. `isRankingFinalized()` already freezes all scoring.

## What to reuse (do not rebuild)

- `judgeScore` in `db/schema/scoring.ts` — the new `pitchScore` table is a direct
  mirror of it (same id/team/judge/criteria/comment/unique-index/check shape).
- `app/api/staff/evaluate/[teamId]/route.ts` — the new pitch route mirrors its
  auth guard, `clamp()`, and `resolveTeamId()` structure.
- `getRanking()` / `buildRankingRows()` in `lib/scoring/service.ts` — finalist
  selection reads the existing ranking; placement changes only the comparator.
- `app/staff/evaluate/[teamId]/page.tsx` — the pitch form is a second card on this
  existing page, not a new route.
- `app/admin/dashboard/ranking/page.tsx` — sparse "Publish Results" page; the
  finalists panel goes here, next to the publish toggle it feeds.
- `EVENT_JUDGE_TARGET` in `lib/scoring/constants.ts` — add `EVENT_FINALIST_TARGET = 6`
  beside it as the default N.

---

## Part 1 — Schema

**`team.isFinalist`** (`boolean`, not null, default false) in `db/schema/auth.ts`.
Add `index("team_is_finalist_idx")`.

**`pitchScore`** table in `db/schema/scoring.ts`, mirroring `judgeScore`:

```ts
id           text      primaryKey  $defaultFn(randomUUID)
teamId       integer   notNull references team(id) on delete cascade
judgeUserId  text      notNull references user(id) on delete cascade
delivery     integer   notNull default 0   // check 0–30
clarity      integer   notNull default 0   // check 0–30
impact       integer   notNull default 0   // check 0–40
comment      text
createdAt / updatedAt  timestamptz
uniqueIndex("pitch_score_team_judge_unique").on(teamId, judgeUserId)
index on teamId, index on judgeUserId
```

Add `pitchScoreRelations` + `pitchScores: many(pitchScore)` on the team and user
relations in `db/schema/relations.ts`, alongside the existing `judgeScores`.

**Migration**: one drizzle migration (column add + table create — no deletions, so
`db:generate` will not hit the interactive rename prompt that needed the two-pass
workaround last time), plus a mirrored idempotent file in `supabase/migrations/`.
End it with `ALTER TABLE "pitch_score" ENABLE ROW LEVEL SECURITY;` to match the
deny-by-default policy, exactly as `repo_check` does.

---

## Part 2 — Placement logic

### The comparator — `lib/scoring/placement.ts` (new, pure, ~30 lines)

Extract ordering into a db-free module so it is directly testable:

```ts
comparePlacement(a, b):
  1. a.isFinalist !== b.isFinalist  → finalist first
  2. both finalists                 → higher pitchAvg first
  3. higher totalAvg first          (build score; also the finalist tie-break)
  4. teamName.localeCompare
```

Rule 3 doing double duty is what makes this degrade gracefully: before any pitch
is scored every finalist has `pitchAvg = 0`, so the finals block is simply ordered
by build score until judges start scoring. Nothing looks broken mid-event.

`finalScoreOverride` is untouched — it still replaces `totalAvg` upstream in
`buildRankingRows()`, so the super-admin escape hatch keeps working.

### Wiring — `lib/scoring/service.ts`

- Add `isFinalist`, `pitchAvg`, `pitchJudgeCount` to `RankedTeam` and to
  `PublicRankingEntry`.
- In `buildRankingRows()`, select `team.isFinalist`, and fetch pitch averages in a
  **second query** keyed by teamId, merged via a `Map`. Do **not** add a second
  `leftJoin` to the existing `judgeScore` join — two one-to-many joins in one
  `groupBy` produce a cartesian product and would silently corrupt every build
  average on the leaderboard.
- `getRanking()` sorts with `comparePlacement` instead of its current inline sort.

### Finalist selection — `lib/scoring/finalists.ts` (new, ~50 lines)

- `selectTopFinalists(n)` — reads `getRanking()`, clears `isFinalist` on all teams,
  sets it on the top `n`. Runs in one transaction so a half-applied selection can't
  survive a failure.
- `setTeamFinalist(teamId, isFinalist)` — single toggle.
- Both call `notifyRankingUpdate()` so the public SSE stream refreshes.

---

## Part 3 — Judge experience

**`app/api/staff/pitch/[teamId]/route.ts`** (new) — GET/POST mirroring the evaluate
route: judge-only, `isRankingFinalized()` blocks writes, `clamp()` per criterion to
30/30/40, comment capped at 2000. Additionally rejects a team that is **not** a
finalist (`NOT_A_FINALIST`) — pitch scores for non-finalists would silently distort
nothing today but would be wrong the moment finalists change.

**`app/staff/evaluate/[teamId]/page.tsx`** — add a second card, *"Finals pitch"*,
rendered only when the team is a finalist. Same slider/input pattern as the build
card, its own save button, posting to the pitch route. One page, two independent
scores; no new route, no duplicated auth guard.

**`app/staff/page.tsx`** — the judge dashboard already lists every active team with
live-app links and requirement badges. Add:
- a **Finalist** badge on finalist cards;
- a *"Score pitch"* link (deep-linking to `#pitch` on the evaluate page) shown only
  for finalists, next to the existing Score link;
- finalists sorted to the top of the list once any exist, so during the finals the
  judge is not scrolling past 40 teams to find the six on stage.

Extend the existing `getApprovedTeamsForJudge()` return with `isFinalist` and
`pitchScored` — no new endpoint.

---

## Part 4 — Admin and public

**`components/admin/FinalistsPanel.tsx`** (new), mounted on
`app/admin/dashboard/ranking/page.tsx` above the publish toggle:
- number input for N (default `EVENT_FINALIST_TARGET`) + **"Select top N finalists"**;
- the current finalist list with build average, pitch average, judges-scored count,
  and a remove button;
- an add-by-team control for a manual addition.

**`app/api/admin/finalists/route.ts`** (new) — `requireSuperAdminUser`.
`GET` current finalists with both averages; `POST { topN }` to auto-select;
`PATCH { teamId, isFinalist }` to toggle.

**`app/ranking/page.tsx`** — finalist rows get a **Finalist** badge and show the
pitch score beside the build total. The `finalized` gate and the SSE wiring are
unchanged; `getPublicRankingDetail()` already flows through `getRanking()`, so the
new order arrives for free.

**Copy** (`lib/i18n.ts`, `criteria` section) — the round-2 block already describes
the 90-second pitch correctly. Two strings are now wrong and need updating:
- `round2Bullet3` says judges "huddle ~3 minutes and pick 1st, 2nd, and 3rd" — they
  now score Delivery/Clarity/Impact in the app. Reword and name the rubric.
- `tieBullet1` says placement is the five-criteria average — still true for
  non-finalists, but finalists are ordered by pitch. Reword to state the real rule.

---

## Verification

1. `npm run db:generate && npm run db:migrate` — `pitch_score` exists with RLS on,
   `team.is_finalist` exists. **Docker must be running first** (`supabase start`);
   this is what blocked migration verification last time.
2. `npm test` — new `lib/scoring/placement.test.ts` covering: finalist above
   non-finalist regardless of build score; higher pitch wins between two finalists;
   equal pitch falls back to build score; **zero pitch scores leaves finalists in
   build order** (the mid-event state); alphabetical last resort.
3. `npm run lint && npm run build && npx tsc --noEmit` — clean; catches every
   `RankedTeam` consumer missed by the new fields.
4. `npm run dev`, end to end:
   - Admin → Publish Results: "Select top 6" marks six finalists; remove one, add
     another by hand; the list shows build averages.
   - Judge → `/staff`: finalists sorted to top with a Finalist badge; "Score pitch"
     opens the evaluate page's pitch card; non-finalists have no pitch card.
   - Score a pitch as two different judges, confirm the average is the mean.
   - Admin publishes → `/ranking` shows finalists on top ordered by pitch, badged,
     with non-finalists below in build order.
   - Unpublish, change a pitch score, republish — order updates live over SSE.

## Skipped on purpose

- **No stage view** — no presentation order, no now-presenting state, no timer.
  Add only if running the finals actually proves the room needs it.
- **No separate finals open/closed phase.** `ranking_finalized` already freezes
  scoring; a second state machine is the peer-voting mistake repeated.
- **No pitch-score history or audit trail.** `judge_score` has none either; add
  both together if it ever matters.
