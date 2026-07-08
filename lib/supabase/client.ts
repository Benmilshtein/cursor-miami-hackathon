import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | undefined;

/**
 * Returns the singleton browser Supabase client. A single instance ensures
 * auth-state listeners (e.g. in AuthProvider) fire for sign-in/out triggered
 * anywhere in the app.
 *
 * During the production build, client components are server-rendered to
 * prerender static pages (e.g. /_not-found). If NEXT_PUBLIC_SUPABASE_* are not
 * present in that build environment, createBrowserClient would throw and fail
 * the export - even though the client is only actually used in the browser.
 * To keep the build resilient we fall back to harmless placeholders when the
 * env is missing and there is no `window`. In the browser the real (build-time
 * inlined) values are required; a missing value there is a genuine
 * misconfiguration and surfaces as an error.
 */
export function createClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (typeof window === "undefined") {
      // Build/SSR with missing public env: don't crash prerendering. Not cached
      // so the browser still builds the real client once env is available.
      return createBrowserClient(
        url ?? "https://placeholder.supabase.co",
        key ?? "placeholder-anon-key",
      );
    }
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Set them in the build environment so they are inlined into the client bundle.",
    );
  }

  browserClient = createBrowserClient(url, key);
  return browserClient;
}
