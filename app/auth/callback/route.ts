import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getOptionalSessionUser } from "@/lib/auth/session";
import { dashboardPathForRole } from "@/lib/auth/roles";

export const dynamic = "force-dynamic";

const EMAIL_OTP_TYPES: readonly string[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return value !== null && EMAIL_OTP_TYPES.includes(value);
}

/**
 * Email-link and OAuth callback: activates the session cookie, then sends the
 * user to their role-specific dashboard.
 *
 * Two credential shapes arrive here:
 *
 * - `token_hash` + `type` from our Auth email templates. Verified with
 *   `verifyOtp`, which needs no browser-local state, so a confirmation link
 *   opened on a phone while signing up on a laptop still signs the user in.
 * - `code` from OAuth and PKCE. Requires the code verifier cookie set by the
 *   browser that started the flow, so it only works in that same browser.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const code = searchParams.get("code");

  const supabase = await createClient();
  let signedIn = false;

  if (tokenHash && isEmailOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    signedIn = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    signedIn = !error;
  }

  if (!signedIn) {
    return NextResponse.redirect(`${origin}/register?error=link_invalid`);
  }

  const sessionUser = await getOptionalSessionUser();
  return NextResponse.redirect(
    `${origin}${dashboardPathForRole(sessionUser?.role)}`,
  );
}
