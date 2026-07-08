-- ============================================================
-- Supabase Auth migration: profile trigger + drop legacy Better Auth tables
-- Identity/sessions are now managed by Supabase Auth (auth.users).
-- public.user is a 1:1 profile keyed on the auth user id.
-- Idempotent: safe to run on a database that never had the Better Auth tables.
-- ============================================================

DROP TABLE IF EXISTS "two_factor" CASCADE;
DROP TABLE IF EXISTS "account" CASCADE;
DROP TABLE IF EXISTS "session" CASCADE;
DROP TABLE IF EXISTS "verification" CASCADE;

-- Auto-create a public.user profile row whenever a Supabase auth user is created.
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public."user" (id, email, name, first_name, last_name, role, email_verified)
  VALUES (
    NEW.id::text,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    'participant',
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
