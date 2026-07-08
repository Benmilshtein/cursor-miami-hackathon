import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for privileged server-only operations
 * (creating users, updating profiles) that must bypass RLS/PostgREST.
 * NEVER import this into client components — it holds the service-role key.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
