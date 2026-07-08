-- ============================================================
-- Enable Row Level Security (deny-by-default) on all public tables.
--
-- WHY: Supabase auto-exposes every public table through its Data API
-- (PostgREST). That API is reachable with the public anon key
-- (NEXT_PUBLIC_SUPABASE_ANON_KEY), which ships to every browser. Without
-- RLS, the anon/authenticated role has full read+write access to every
-- table -- a live, public data exposure (the "Unrestricted" badge in the
-- Table Editor).
--
-- WHAT: Turn RLS on for every base table in the public schema and create
-- NO permissive policies. RLS-on + no-policy = deny all for anon and
-- authenticated, so the Data API returns nothing.
--
-- WHY THIS IS SAFE FOR THE APP: the app never touches the Data API for
-- data. All data access goes through Drizzle + postgres-js as the
-- service/superuser role, which BYPASSES RLS. (Supabase JS is used only
-- for auth: signIn/OAuth/getUser/onAuthStateChange.) So this change has
-- zero effect on application queries.
--
-- Notes:
--  * pg_tables returns only base tables (not views) in the public schema;
--    Drizzle's and Supabase's migration bookkeeping live in other schemas
--    and are untouched.
--  * No FORCE ROW LEVEL SECURITY -- the service role must keep bypassing
--    RLS so the app keeps working.
--  * If a table ever needs to be browser-readable via PostgREST, add a
--    narrow permissive policy for it in a later migration.
--  * Idempotent: enabling RLS on an already-enabled table is a no-op.
-- ============================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
  END LOOP;
END $$;
