-- Drop legacy Better Auth tables if they exist. Supabase Auth now manages
-- identity/sessions; these are no-ops on a database that never had them.
DROP TABLE IF EXISTS "two_factor" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "account" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "session" CASCADE;--> statement-breakpoint
DROP TABLE IF EXISTS "verification" CASCADE;--> statement-breakpoint
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
$$;--> statement-breakpoint
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;--> statement-breakpoint
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
