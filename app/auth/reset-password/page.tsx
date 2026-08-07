"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useAuth, useSessionUser, useSupabaseBrowser } from "@/lib/auth/AuthProvider";
import { dashboardPathForRole } from "@/lib/auth/roles";
import { Logo, NoiseOverlay } from "@/components/ui";

const MIN_PASSWORD_LENGTH = 8;

/**
 * Set a new password after following a recovery email link.
 *
 * `/auth/callback` has already exchanged the recovery token for a session, so
 * the visitor is signed in here; this page just writes the new password and
 * sends them on to their role dashboard.
 */
export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = useSupabaseBrowser();
  const { refresh } = useAuth();
  const { user, isPending } = useSessionUser();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message ?? "Could not update the password.");
        return;
      }
      setDone(true);
      await refresh();
      router.replace(dashboardPathForRole(user?.role));
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPending) {
    return (
      <>
        <NoiseOverlay />
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
          <div className="text-[var(--text-muted)]">Loading…</div>
        </div>
      </>
    );
  }

  // No session means the link was never opened, already used, or expired.
  if (!user) {
    return (
      <>
        <NoiseOverlay />
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] px-4">
          <div className="glass-card w-full max-w-md p-8 sm:p-10 flex flex-col items-center text-center">
            <Logo size={48} className="mb-6" />
            <h1 className="mb-2 text-2xl font-bold text-white">Reset link expired</h1>
            <p className="mb-6 text-[var(--text-secondary)]">
              This password reset link is no longer valid. Request a new one from the sign-in
              page.
            </p>
            <Link
              href="/staff/login"
              className="w-full min-h-[48px] rounded-xl border border-[var(--border-color)] bg-white px-6 py-4 font-semibold text-black transition-all duration-300 hover:bg-white/90"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NoiseOverlay />
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-8 sm:p-10 flex flex-col items-center text-center">
            <Logo size={48} className="mb-6" />
            <h1 className="mb-2 text-2xl sm:text-3xl font-bold text-white">Set a new password</h1>
            <p className="mb-6 text-[var(--text-secondary)]">
              Signed in as <span className="text-white">{user.email}</span>. Choose a new password
              to finish.
            </p>

            {error && (
              <div className="mb-4 w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {done ? (
              <div className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                Password updated. Taking you to your dashboard…
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
                <div className="relative w-full">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                    className="w-full rounded-xl border border-[var(--border-color)] bg-white/5 py-3 pl-4 pr-12 text-white placeholder:text-[var(--text-muted)] focus:border-white/30 focus:outline-none"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden />
                    )}
                  </button>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-white/5 px-4 py-3 text-white placeholder:text-[var(--text-muted)] focus:border-white/30 focus:outline-none"
                  autoComplete="new-password"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full min-h-[48px] rounded-xl border border-[var(--border-color)] bg-white px-6 py-4 font-semibold text-black transition-all duration-300 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Saving…" : "Save new password"}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}
