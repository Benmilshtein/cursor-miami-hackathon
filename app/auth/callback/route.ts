import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { dashboardPathForRole } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

/**
 * OAuth / email-link callback: exchanges the auth `code` for a session
 * cookie, then redirects the user to their role-specific dashboard.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const sessionUser = await getOptionalSessionUser();
      const dest = dashboardPathForRole(sessionUser?.role);
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  return NextResponse.redirect(`${origin}/register?error=auth_callback`);
}
