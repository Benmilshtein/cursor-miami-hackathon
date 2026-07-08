"use client";

import { useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSessionUser } from "@/lib/auth/AuthProvider";

/**
 * Compatibility layer over Supabase Auth so existing call sites that used the
 * Better Auth React client keep working. New code should prefer the hooks in
 * `@/lib/auth/AuthProvider` directly.
 */

/** Better Auth-shaped session hook: `{ data: { user } | null, isPending }`. */
export function useSession() {
  const { user, isPending } = useSessionUser();
  // Memoize so the returned `data` keeps a stable reference across renders.
  // Otherwise a fresh `{ user }` object each render makes every effect that
  // depends on `session` re-fire endlessly (the dashboard flicker loop).
  const data = useMemo(() => (user ? { user } : null), [user]);
  return { data, isPending, error: null } as const;
}

export async function signOut(): Promise<{ error: { message?: string } | null }> {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  return { error: error ? { message: error.message } : null };
}

export const authClient = {
  useSession,
  signOut,
};
