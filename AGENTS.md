# AGENTS.md

## Cursor Cloud specific instructions

This is the **Cursor Miami Ship Night** app: a Next.js 16 (App Router) + React 19 web platform backed by **Supabase** (Auth) and **PostgreSQL** (via Drizzle ORM). A separate, optional Python judge tool lives in `tools/hackathon-analyzer/` and is not needed to run the web app.

### Standard commands (see `package.json` / `README.md`)
- Dev server: `npm run dev` → http://localhost:3000
- Lint: `npm run lint` — note: the committed code currently reports pre-existing ESLint errors, so this exits non-zero even on a clean checkout. Don't treat that as something your change broke unless you added new violations.
- Tests: `npm run test` (Vitest, no DB required)
- Build: `npm run build`

### Backend (Supabase + Postgres) — required for auth, dashboard, and any DB-backed route
The dev environment uses the **local Supabase stack** via Docker + the Supabase CLI (both are preinstalled in the environment snapshot). The landing page renders without a backend, but login/registration/dashboard/ranking need it. Bring the backend up each session:

```bash
# 1. Start the Docker daemon (not running on a fresh VM) and open the socket
sudo dockerd > /tmp/dockerd.log 2>&1 &
sleep 8
sudo chmod 666 /var/run/docker.sock

# 2. Start the local Supabase stack (Postgres 54322, Auth/API 54321, Studio 54323, Mailpit 54324).
#    This auto-applies supabase/migrations/*.sql, which create the FULL app schema.
supabase start   # run from the repo root

# 3. CRITICAL: db/index.ts hardcodes `ssl: "require"`, but the local Supabase
#    Postgres ships with SSL OFF, so the app cannot connect until you enable it.
C=supabase_db_cursor_hackathon
cd /tmp && openssl req -x509 -newkey rsa:2048 -nodes -days 3650 \
  -keyout server.key -out server.crt -subj "/CN=localhost" 2>/dev/null
docker cp /tmp/server.key $C:/var/lib/postgresql/data/server.key
docker cp /tmp/server.crt $C:/var/lib/postgresql/data/server.crt
docker exec $C bash -c 'cd /var/lib/postgresql/data && chown 100:101 server.key server.crt && chmod 600 server.key && chmod 644 server.crt'
docker exec $C psql -U supabase_admin -d postgres \
  -c "ALTER SYSTEM SET ssl = on;" \
  -c "ALTER SYSTEM SET ssl_cert_file = 'server.crt';" \
  -c "ALTER SYSTEM SET ssl_key_file = 'server.key';"
docker exec -u postgres $C pg_ctl -D /var/lib/postgresql/data restart -m fast
```

Notes / gotchas:
- `ALTER SYSTEM SET ssl` must be run as the `supabase_admin` role — the `postgres` role is not a superuser in Supabase and gets "permission denied".
- Docker 29 + fuse-overlayfs requires `"features": {"containerd-snapshotter": false}` in `/etc/docker/daemon.json` (already configured in the snapshot).
- SSL enablement lives in the container's data volume and is lost if you run `supabase stop --no-backup` / recreate the DB container; re-run step 3 after any fresh `supabase start` that resets the volume.

### Environment variables (`.env.local`, gitignored)
Next.js and `drizzle.config.ts` auto-load `.env.local`. For the local stack use the deterministic keys from `supabase status`:
- `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` = the ANON_KEY / SERVICE_ROLE_KEY JWTs printed by `supabase start`
- `DATABASE_URL` and `DIRECT_URL` = `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` = `http://localhost:3000`
- `SUPER_ADMIN_EMAILS` = an email you control (auto-promoted to super_admin on sign-in)

### Migrations
- **Do NOT run `npm run db:migrate` against the local Supabase DB.** `supabase start` already applies `supabase/migrations/*.sql` (a consolidated schema). Drizzle's `drizzle/0000_*…0016_*` migrations would then fail on already-existing tables. `npm run db:migrate` is only for a fresh/cloud Postgres that has NOT had the supabase migrations applied.
- Local signup works without email confirmation (`supabase/config.toml` has `enable_confirmations = false`); a `handle_new_user` trigger inserts the `public.user` row automatically. Confirmation emails (if enabled) are captured by Mailpit at http://127.0.0.1:54324.

### Cloud Supabase alternative
Instead of the local stack you can point `.env.local` at a real Supabase project (as the README describes). In that case SSL is already on, and you DO run `npm run db:migrate` once to apply the Drizzle migrations.
