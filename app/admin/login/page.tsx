"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSessionUser, useSupabaseBrowser } from "@/lib/auth/AuthProvider";
import { Logo, NoiseOverlay } from "@/components/ui";

const LOADING_UI = (
  <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
    <div className="text-[var(--text-muted)]">Loading...</div>
  </div>
);

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = useSupabaseBrowser();
  const { user, isPending } = useSessionUser();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (isPending || !user) return;
    if (user.role === "super_admin") {
      router.replace("/admin/dashboard");
    } else {
      router.replace("/");
    }
  }, [isPending, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        const origin = window.location.origin;
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { name: name.trim() || email.trim() },
            emailRedirectTo: `${origin}/auth/callback?next=/admin/dashboard`,
          },
        });
        if (signUpError) {
          setError(signUpError.message);
          setIsSubmitting(false);
          return;
        }
        if (!data.session) {
          setNotice("Check your email to confirm your account, then sign in.");
          setMode("signin");
          setIsSubmitting(false);
          return;
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          setError(signInError.message);
          setIsSubmitting(false);
          return;
        }
      }

      // Server promotes configured SUPER_ADMIN_EMAILS to super_admin on /api/me.
      const res = await fetch("/api/me", { cache: "no-store" });
      const role = res.ok ? (await res.json())?.user?.role : undefined;
      if (role === "super_admin") {
        router.replace("/admin/dashboard");
        return;
      }
      await supabase.auth.signOut();
      setError("This account is not a super admin. Your email must be in SUPER_ADMIN_EMAILS.");
      setIsSubmitting(false);
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  if (isPending || user) {
    return (
      <>
        <NoiseOverlay />
        {LOADING_UI}
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
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Super Admin</h1>
            <p className="text-[var(--text-secondary)] mb-6">
              Sign in or create an account with an email in SUPER_ADMIN_EMAILS.
            </p>

            <div className="flex rounded-xl border border-[var(--border-color)] p-1 mb-6 w-full">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === "signin"
                    ? "bg-white text-black"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === "signup"
                    ? "bg-white text-black"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
              >
                Sign up
              </button>
            </div>

            {error ? (
              <div className="w-full mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}
            {notice ? (
              <div className="w-full mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {notice}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
              {mode === "signup" ? (
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border-color)] bg-white/5 px-4 py-3 text-white placeholder:text-[var(--text-muted)] focus:border-white/30 focus:outline-none"
                  autoComplete="name"
                />
              ) : null}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-[var(--border-color)] bg-white/5 px-4 py-3 text-white placeholder:text-[var(--text-muted)] focus:border-white/30 focus:outline-none"
                autoComplete="email"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-xl border border-[var(--border-color)] bg-white/5 px-4 py-3 text-white placeholder:text-[var(--text-muted)] focus:border-white/30 focus:outline-none"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[48px] rounded-xl border border-[var(--border-color)] bg-white px-6 py-4 font-semibold text-black transition-all duration-300 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting
                  ? "Please wait..."
                  : mode === "signup"
                    ? "Create super admin account"
                    : "Sign in"}
              </button>
            </form>

            <Link
              href="/"
              className="mt-8 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              Back to home
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}
