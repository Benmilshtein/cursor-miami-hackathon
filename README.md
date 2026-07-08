# Cursor Miami Hackathon

Open-source platform for running **hackathons**: landing site, registration, teams, screening, scoring, admin tools, and partner credits — built with **Next.js**, **Supabase**, and **PostgreSQL**.

**Live site: [cursormiami.com](https://cursormiami.com)**

[![cursormiami.com](docs/screenshot.png)](https://cursormiami.com)

This is a clean, brandable template. Every name, date, venue, and sponsor in the UI is placeholder copy: clone it, edit a handful of config values, and your event can be live tomorrow.

---

## Contents

- [Features](#features)
- [Stack](#stack)
- [Quick start](#quick-start)
- [Make it yours](#make-it-yours)
- [Environment variables](#environment-variables)
- [Database](#database)
- [Scripts](#scripts)
- [Docker & deployment](#docker--deployment)
- [Project layout](#project-layout)
- [Contributors](#contributors)
- [Acknowledgements](#acknowledgements)

---

## Features

| Area | What it does |
|------|----------------|
| **Landing** | Hero, sponsors, tracks, schedule, judging criteria, requirements, tech stack, partnership page. SEO-ready: sitemap, robots, Open Graph, JSON-LD. |
| **Auth** | Email + Google / GitHub via Supabase Auth. Optional 2FA for admins. Admin sign-up limited with `SUPER_ADMIN_EMAILS`. |
| **Registration & onboarding** | User flow and completion status. |
| **Teams** | Create / join / leave, transfer lead, members. Invite links (`/r/[code]`). |
| **Screening** | MC questions, optional team video. Admins approve or reject teams and manage questions. |
| **Projects** | Participant project submissions and admin CRUD. |
| **Credits** | Sponsor credit pools: split by team or participant, Excel upload of per-user links, shared links, short codes, audit log. |
| **Staff** | Invites, evaluation queue, team scoring. |
| **Ranking** | Public ranking from judges; optional late penalty; admin can set final overrides. |
| **Admin** | Users, teams, screening, projects, partners, credits, staff, settings (deadlines, etc.), security / 2FA. |
| **i18n** | English, German, and Spanish out of the box. |

---

## Stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**
- **Tailwind CSS 4**, **Framer Motion**
- **Drizzle ORM** + **PostgreSQL**
- **Supabase** (Auth + Postgres hosting)

---

## Quick start

### Prerequisites

- **Node.js** 20+
- A free [Supabase](https://supabase.com) project (provides Auth + Postgres)

### 1. Install

```bash
git clone https://github.com/Benmilshtein/cursor-miami-hackathon.git
cd cursor-miami-hackathon
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in the values from your Supabase dashboard — see [Environment variables](#environment-variables).

### 3. Database

```bash
npm run db:migrate
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Make it yours

All branding is centralized and placeholder by design:

| What | Where |
|------|-------|
| Event name, tagline, description, city | `lib/site.ts` (`siteConfig`) |
| All landing-page copy (3 languages) | `lib/i18n.ts` |
| Event dates & venue for SEO JSON-LD | `components/seo/StructuredData.tsx` |
| Sponsors | `components/participant/SponsorsSection.tsx` |
| Schedule blocks | `lib/i18n.ts` (`schedule`) + `components/participant/HackathonSchedule.tsx` |
| Social share image | `app/opengraph-image.tsx` |
| Deliverables / judging copy | `lib/i18n.ts` (`requirements`, `criteria`) |

---

## Environment variables

Create a `.env` in the project root (see `.env.example` for full comments):

| Variable | Required | Notes |
|----------|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase dashboard → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Same place |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only; used for staff account creation |
| `DATABASE_URL` | Yes | Pooled connection string (port 6543, `?pgbouncer=true`) |
| `DIRECT_URL` | Yes | Direct connection for migrations (port 5432) |
| `NEXT_PUBLIC_APP_URL` | Yes | Public URL users see |
| `NEXT_PUBLIC_SITE_URL` | Production | Canonical URL for metadata and sitemap |
| `SUPER_ADMIN_EMAILS` | See note | Comma-separated emails auto-promoted to super admin |
| `RESEND_API_KEY` / `EMAIL_FROM` | Optional | Transactional email (Resend) |

If `SUPER_ADMIN_EMAILS` is empty, restricted admin sign-up paths are effectively disabled.

OAuth providers (Google / GitHub) are configured in the Supabase dashboard (Auth → Providers), not in `.env`.

---

## Database

- **Engine:** PostgreSQL (hosted by Supabase or anywhere else)
- **ORM:** Drizzle — schemas under `db/schema/`, migrations under `drizzle/`
- **Generate migrations:** `npm run db:generate`
- **Apply migrations:** `npm run db:migrate` (or `npm run db:studio` for a GUI)

**Docker image:** the production container runs migrations on startup (`scripts/start-with-migrate.mjs`), with retries via `DB_MIGRATION_ATTEMPTS` (default `20`) and `DB_MIGRATION_DELAY_MS` (default `3000`).

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server |
| `npm run build` | Production build (standalone) |
| `npm run start` | Production server |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (once) |
| `npm run test:watch` | Vitest (watch) |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:migrate` | Run migrations |
| `npm run db:studio` | Drizzle Studio |

---

## Docker & deployment

### Local stack

```bash
docker compose up -d
```

The app listens on **3001**. Set your `NEXT_PUBLIC_*` values in `.env` first — the compose file reads them from your environment and never contains real credentials.

### Dokploy / PaaS

See `docs/DOKPLOY.md` for a Dokploy walkthrough using `docker-compose.dokploy.yml`. You are not locked in: deploy on Vercel, plain Docker, Kubernetes, Railway, Fly.io, or any panel — use the included **Dockerfile** and your own env values.

---

## Project layout

```
├── app/                 # Routes: marketing, dashboard, admin, API, auth, screening, ranking, staff…
├── components/          # UI and feature sections
├── db/                  # Drizzle client, schema, relations
├── lib/                 # Auth helpers, domain logic (teams, screening, credits, scoring…), i18n, site config
├── docs/                # Feature guides (teams, credits, auth/schema, Dokploy)
├── drizzle/             # SQL migrations
├── supabase/            # Supabase local config + auth trigger migrations
├── Dockerfile
├── docker-compose.yml
└── scripts/             # e.g. start-with-migrate.mjs
```

---

## Contributors

- [Ben Milshtein](https://github.com/Benmilshtein) — author & maintainer
- [Jerry](https://github.com/Mr-Higgs) — contributor

---

## Acknowledgements

Based on [CURSOR 48H](https://github.com/cursorcommunityled/cursor_hackathon) by the Cursor Community Led team — an open-source platform for 48-hour AI hackathons (MIT). Thanks to its contributors for the foundation this project builds on.

---

## License

MIT — see [LICENSE](LICENSE). Fork it, rebrand it, run your event.
