# Admin Guide: Distributing Partner Credits

This guide explains how an admin hands out partner/sponsor credits to participants — including
the bulk upload of **unique, one-time credit URLs** at hackathon kickoff.

All credit screens live under **Admin → Dashboard → Credits** and require the `super_admin` role
with a recent 2FA step-up (a 15-minute verification cookie).

---

## Concepts

- **Partner** — the sponsor providing credits (managed under **Admin → Dashboard → Partners**).
- **Credit pool** — a batch of credits from one partner, distributed in one of three modes.
- **Eligibility** — any participant (`role = participant`) can receive credits. There is **no team
  or screening requirement**: participants with no team, or on an unscreened team,
  are all eligible. Only non-participants (mentors, judges, admins) are excluded.
- **Redemption link** — what a participant actually receives. They see it in their dashboard
  (the partner-credits panel) and **Claim** it; claiming marks it used. Each unique sponsor URL is
  attached to exactly one participant's account.

---

## The three distribution modes

Pick the mode when you **create the pool**:

| Mode | Use when | What participants get |
| --- | --- | --- |
| **Unique per user (Excel)** (`excel_unique`) | The sponsor gave you a list of **unique one-time URLs** (the kickoff case). | One distinct sponsor URL each. |
| **General (one URL for all)** (`general_link`) | The sponsor gave you **one shared URL** for everyone. | The same URL. |
| **Even split** (`even`) | You want the app to mint short links and split them across teams/participants. | App-generated short links. |

The rest of this guide focuses on **Unique per user (Excel)** — uploading a bag of unique URLs and
disbursing them to whoever you choose.

---

## How the bag-of-links model works

You upload a file containing **only the credit URLs** — no `user_id`, no pairing. Each URL becomes an
**available link** in the pool. Then you **disburse**: pick who should receive links (members of
selected teams, or selected individual participants) and the system hands each chosen person one
available URL, which appears in their dashboard to claim. You can disburse in waves as people arrive —
already-assigned people are skipped and only remaining URLs are popped.

---

## Step-by-step: upload links, then disburse

1. **Add the sponsor** under **Admin → Dashboard → Partners** (if not already there).
2. **Create the credit pool:** **Credits → Create credit pool**
   - Partner: the sponsor
   - Distribution mode: **Unique per user (Excel)**
   - Total credits: `0` (the upload sets the count)
3. On the pool page, **Upload credit links**: choose a **CSV or Excel** file containing the URLs (one
   per row). A `url`/`link` header is optional; `user_id` is not required. Click **Upload to
   staging** — the confirmation shows how many links were staged. Uploading only stages them; nothing
   is sent yet. (You can upload more files later to add more links to the bag.)
4. In **Disburse links**, pick a mode:
   - **Selected teams** — check one or more teams; every participant member of those teams gets a link.
   - **Selected participants** — search and check specific people.
5. Click **Disburse links.** The result shows how many links were `assigned`, how many are still
   available, and whether any selected recipients got nothing because links ran out.
6. Repeat step 4–5 as more teams form / more people arrive. Re-running skips anyone already assigned.
7. **Verify:** use **Load links** / **Refresh links** to see each link against a recipient email and
   its claimed status, **Copy all URLs** to export them, and **Revoke** / **Reassign** to correct
   mistakes. The **Audit log** records every upload and disbursement.

> The **Download participant list** button is optional — it exports the current participants for your
> own reference. You do **not** need it to upload links.

---

## Edge cases

- **More URLs than recipients** — the extras stay **available** in the bag. Disburse again to more
  people later; already-assigned recipients are skipped, so it's safe to re-run.
- **Fewer URLs than selected recipients** — only that many receive a link (the result tells you how
  many got nothing); upload more URLs and disburse again to top them up.
- **Late joiners** — once they've signed up / joined a team, just select them (or their team) and
  disburse. Existing allocations are untouched.
- **Duplicate URLs in the file** — deduped automatically (first occurrence wins), including against
  URLs already staged for the pool.
- **Non-participants (mentor / judge / admin)** — never receive links; only `role = participant`
  accounts are eligible, even when their team is selected.

---

## What the participant sees

On their dashboard, the partner-credits panel lists each allocated credit with the partner name, a
status (assigned / claimed / used), and the link. They click **Claim** to mark it claimed; the admin
links view then shows `claimed: yes`. Short links route through `/r/<code>` and redirect to the
sponsor URL.

---

## Reference (for engineers)

- Eligibility & recipients: `lib/credits/eligible-participants.ts`
- Picker data (teams + participants): `app/api/admin/credit-pools/[id]/recipients/route.ts`
- Participant-list template (optional): `app/api/admin/credit-pools/[id]/eligible-template/route.ts`
- Upload/staging (CSV/XLSX): `app/api/admin/credit-pools/[id]/upload-links/route.ts`
- Disbursement: `app/api/admin/credit-pools/[id]/distribute-excel/route.ts`, `runUniqueDistribution` in `lib/credits/distribution.ts`
- Link parsing/dedup: `lib/credits/parse-excel-links.ts`
- Participant view: `components/participant/PartnerCreditsPanel.tsx`, `app/r/[code]`

