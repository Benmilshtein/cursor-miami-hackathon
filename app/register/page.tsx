"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/LanguageContext";
import { useSessionUser, useSupabaseBrowser } from "@/lib/auth/AuthProvider";
import { dashboardPathForRole } from "@/lib/auth/roles";
import { Logo, NoiseOverlay } from "@/components/ui";

const LOADING_UI = (
  <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
    <div className="text-[var(--text-muted)]">Loading...</div>
  </div>
);

export default function RegisterPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const supabase = useSupabaseBrowser();
  const { user, isPending } = useSessionUser();

  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && user) {
      router.replace(dashboardPathForRole(user.role));
    }
  }, [isPending, router, user]);

  // Resolve the freshly authenticated user's role-specific dashboard. The
  // session context (`user`) isn't populated synchronously right after a
  // password sign-in/sign-up, so read it directly from /api/me.
  const resolveDashboardPath = async (): Promise<string> => {
    try {
      const res = await fetch("/api/me", { cache: "no-store" });
      const json = (await res.json()) as { user: { role?: string | null } | null };
      return dashboardPathForRole(json.user?.role);
    } catch {
      return "/dashboard";
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
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
            emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
          },
        });
        if (signUpError) {
          setError(signUpError.message);
          setIsSubmitting(false);
          return;
        }
        if (!data.session) {
          // Email confirmation is enabled - no session yet.
          setNotice("Check your email to confirm your account, then sign in.");
          setMode("signin");
          setIsSubmitting(false);
          return;
        }
        router.replace(await resolveDashboardPath());
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(signInError.message);
        setIsSubmitting(false);
        return;
      }
      router.replace(await resolveDashboardPath());
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
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {t("registerPage", "title")}
            </h1>
            <p className="text-[var(--text-secondary)] mb-8">
              {t("registerPage", "subtitle")}
            </p>

            {error ? (
              <div className="mb-6 w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}
            {notice ? (
              <div className="mb-6 w-full rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {notice}
              </div>
            ) : null}

            <div className="mb-5 flex w-full rounded-xl border border-[var(--border-color)] p-1">
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  mode === "signup"
                    ? "bg-white text-black"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
              >
                Create account
              </button>
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  mode === "signin"
                    ? "bg-white text-black"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
              >
                Sign in
              </button>
            </div>

            <form onSubmit={handleEmailSubmit} className="w-full flex flex-col gap-4">
              {mode === "signup" ? (
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className="w-full rounded-xl border border-[var(--border-color)] bg-white/5 px-4 py-3 text-white placeholder:text-[var(--text-muted)] focus:border-white/30 focus:outline-none"
                />
              ) : null}
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-xl border border-[var(--border-color)] bg-white/5 px-4 py-3 text-white placeholder:text-[var(--text-muted)] focus:border-white/30 focus:outline-none"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                className="w-full rounded-xl border border-[var(--border-color)] bg-white/5 px-4 py-3 text-white placeholder:text-[var(--text-muted)] focus:border-white/30 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[48px] rounded-xl border border-[var(--border-color)] bg-white px-6 py-4 font-semibold text-black transition-all duration-300 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting
                  ? "Please wait..."
                  : mode === "signup"
                    ? "Create account"
                    : "Sign in"}
              </button>
            </form>

            <p className="mt-6 text-sm text-[var(--text-muted)]">{t("registerPage", "help")}</p>

            <Link
              href="/"
              className="mt-8 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              {t("registerPage", "backHome")}
            </Link>
          </div>
        </motion.div>
      </div>
    </>
  );
}
