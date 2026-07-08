"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useSupabaseBrowser } from "@/lib/auth/AuthProvider";
import { Logo, NoiseOverlay } from "@/components/ui";

function StaffJoinContent() {
  const router = useRouter();
  const supabase = useSupabaseBrowser();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "done">("loading");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [telegramUsername, setTelegramUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvite = useCallback(async () => {
    if (!token.trim()) {
      setStatus("invalid");
      return;
    }
    try {
      const res = await fetch(
        `/api/staff/invite-by-token?token=${encodeURIComponent(token)}`,
      );
      const json = await res.json();
      if (!res.ok) {
        setStatus("invalid");
        return;
      }
      if (json.success && json.data) {
        setEmail(json.data.email ?? "");
        setRole(json.data.role ?? "");
        setStatus("valid");
      } else {
        setStatus("invalid");
      }
    } catch {
      setStatus("invalid");
    }
  }, [token]);

  useEffect(() => {
    void fetchInvite();
  }, [fetchInvite]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/staff/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          token,
          password,
          name: name.trim() || email,
          companyName: companyName.trim() || undefined,
          phone: phone.trim() || undefined,
          position: position.trim() || undefined,
          telegramUsername: telegramUsername.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error?.message ?? "Something went wrong. Try again.");
        setSubmitting(false);
        return;
      }
      // The account exists now; sign in with the password just set.
      const signInEmail = (json?.data?.email as string | undefined) ?? email;
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: signInEmail,
        password,
      });
      if (signInError) {
        setError("Account created, but sign-in failed. Use the staff login page.");
        setSubmitting(false);
        return;
      }
      setStatus("done");
      router.replace("/staff");
    } catch {
      setError("Request failed. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <>
        <NoiseOverlay />
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
          <div className="text-[var(--text-muted)]">Loading invite…</div>
        </div>
      </>
    );
  }

  if (status === "invalid") {
    return (
      <>
        <NoiseOverlay />
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] px-4">
          <div className="glass-card p-8 text-center max-w-md">
            <h1 className="text-xl font-bold text-white mb-2">Invalid or expired link</h1>
            <p className="text-[var(--text-secondary)] mb-6">
              This invite link is invalid or has already been used. Ask for a new invite.
            </p>
            <Link
              href="/"
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            >
              Back to home
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (status === "done") {
    return (
      <>
        <NoiseOverlay />
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
          <div className="text-[var(--text-muted)]">Redirecting…</div>
        </div>
      </>
    );
  }

  return (
    <>
      <NoiseOverlay />
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="glass-card p-8">
            <Logo size={40} className="mb-6" />
            <h1 className="text-2xl font-bold text-white mb-1">Set up your account</h1>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              You’re joining as a <strong className="text-white">{role}</strong>. Set a password and optional details.
            </p>
            <p className="text-[var(--text-muted)] text-sm mb-4">{email}</p>

            {error && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-[var(--text-secondary)]">
                  Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-[var(--border-color)] bg-white/5 px-4 py-3 text-white placeholder:text-[var(--text-muted)] focus:border-white/30 focus:outline-none"
                  autoComplete="name"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[var(--text-secondary)]">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
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
              </div>
              <div>
                <label className="mb-1 block text-sm text-[var(--text-secondary)]">
                  Confirm password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Re-enter your password"
                    className="w-full rounded-xl border border-[var(--border-color)] bg-white/5 py-3 pl-4 pr-12 text-white placeholder:text-[var(--text-muted)] focus:border-white/30 focus:outline-none"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[var(--text-muted)] hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    aria-label={
                      showConfirmPassword ? "Hide confirm password" : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm text-[var(--text-secondary)]">
                  Company
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Company name"
                  className="w-full rounded-xl border border-[var(--border-color)] bg-white/5 px-4 py-3 text-white placeholder:text-[var(--text-muted)] focus:border-white/30 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[var(--text-secondary)]">
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="w-full rounded-xl border border-[var(--border-color)] bg-white/5 px-4 py-3 text-white placeholder:text-[var(--text-muted)] focus:border-white/30 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[var(--text-secondary)]">
                  Position
                </label>
                <input
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Job title"
                  className="w-full rounded-xl border border-[var(--border-color)] bg-white/5 px-4 py-3 text-white placeholder:text-[var(--text-muted)] focus:border-white/30 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-[var(--text-secondary)]">
                  Telegram username
                </label>
                <input
                  type="text"
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value)}
                  placeholder="@username"
                  className="w-full rounded-xl border border-[var(--border-color)] bg-white/5 px-4 py-3 text-white placeholder:text-[var(--text-muted)] focus:border-white/30 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={
                  submitting || password.length < 8 || confirmPassword.length < 8
                }
                className="w-full min-h-[48px] rounded-xl border border-[var(--border-color)] bg-white px-6 py-3 font-semibold text-black hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Creating account…" : "Create account"}
              </button>
            </form>

            <Link
              href="/"
              className="mt-6 block text-center text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            >
              Back to home
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}

const FALLBACK = (
  <>
    <NoiseOverlay />
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="text-[var(--text-muted)]">Loading…</div>
    </div>
  </>
);

export default function StaffJoinPage() {
  return (
    <Suspense fallback={FALLBACK}>
      <StaffJoinContent />
    </Suspense>
  );
}
