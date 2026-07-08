"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { AppSessionUser } from "@/lib/auth/session";

type AuthContextValue = {
  supabase: SupabaseClient;
  user: AppSessionUser | null;
  isPending: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<AppSessionUser | null>(null);
  const [isPending, setIsPending] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const json = (await res.json()) as { user: AppSessionUser | null };
      setUser(json.user ?? null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let active = true;

    void (async () => {
      await refresh();
      if (active) setIsPending(false);
    })();

    // Re-hydrate the app session whenever Supabase auth state changes.
    // Only fetch our own /api/me here (never await supabase calls in this
    // callback, per Supabase guidance).
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void (async () => {
        await refresh();
        if (active) setIsPending(false);
      })();
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, refresh]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, [supabase]);

  const value = useMemo(
    () => ({ supabase, user, isPending, refresh, signOut }),
    [supabase, user, isPending, refresh, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

/** App session user + loading state (replacement for Better Auth's useSession). */
export function useSessionUser(): { user: AppSessionUser | null; isPending: boolean } {
  const { user, isPending } = useAuth();
  return { user, isPending };
}

/** The browser Supabase client (for sign-in/up/social calls in auth pages). */
export function useSupabaseBrowser(): SupabaseClient {
  return useAuth().supabase;
}
