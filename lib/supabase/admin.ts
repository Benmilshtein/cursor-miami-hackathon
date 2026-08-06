import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for privileged server-only operations
 * (creating users, updating profiles) that must bypass RLS/PostgREST.
 * NEVER import this into client components - it holds the service-role key.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not set. Add it in Vercel project environment variables.",
    );
  }
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add the Supabase service-role key in Vercel project environment variables (Production + Preview).",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
