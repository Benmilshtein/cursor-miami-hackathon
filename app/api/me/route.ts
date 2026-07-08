import { NextResponse } from "next/server";
import { getOptionalSessionUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/**
 * Returns the current AppSessionUser (id, email, role, teamId, …) or null.
 * Used by the client AuthProvider to hydrate the session after Supabase auth
 * state changes, without exposing the public.user table over PostgREST.
 */
export async function GET() {
  try {
    const user = await getOptionalSessionUser();
    return NextResponse.json({ user });
  } catch (error) {
    // Most likely a DB-connection failure (e.g. DATABASE_URL unset/wrong in
    // prod). Log the real cause so it shows up in server logs instead of an
    // opaque 500 that the client reads as "not a super admin".
    console.error("/api/me: failed to load session user", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
