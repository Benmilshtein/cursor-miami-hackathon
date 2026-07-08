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

type Provider = "linkedin_oidc" | "github";

const PROVIDER_LABEL: Record<Provider, string> = {
  linkedin_oidc: "LinkedIn",
  github: "GitHub",
};

export default function RegisterPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const supabase = useSupabaseBrowser();
  const { user, isPending } = useSessionUser();

  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pendingProvider, setPendingProvider] = useState<Provider | null>(null);
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

  const handleSocial = async (provider: Provider) => {
    setError(null);
    setPendingProvider(provider);
    try {
      const origin = window.location.origin;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${origin}/auth/callback?next=/dashboard` },
      });
      if (oauthError) {
        setPendingProvider(null);
        setError(
          `${PROVIDER_LABEL[provider]} sign-in is not configured. ` +
            "Enable the provider in your Supabase project's Auth settings.",
        );
      }
      // On success the browser is redirected to the provider by supabase-js.
    } catch {
      setPendingProvider(null);
      setError("Authentication is currently unavailable. Please try again.");
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
          // Email confirmation is enabled — no session yet.
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

            <div className="w-full flex flex-col gap-3">
              <button
                type="button"
                onClick={() => void handleSocial("linkedin_oidc")}
                disabled={pendingProvider !== null || isSubmitting}
                className="w-full inline-flex min-h-[48px] items-center justify-center gap-3 rounded-xl border border-[var(--border-color)] bg-[#0A66C2] px-6 py-4 font-semibold text-white transition-all duration-300 hover:bg-[#004182] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.55V9h3.57v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
                </svg>
                {pendingProvider === "linkedin_oidc"
                  ? t("registerPage", "connecting")
                  : t("registerPage", "signInLinkedin")}
              </button>

              <button
                type="button"
                onClick={() => void handleSocial("github")}
                disabled={pendingProvider !== null || isSubmitting}
                className="w-full inline-flex min-h-[48px] items-center justify-center gap-3 rounded-xl border border-[var(--border-color)] bg-[#1f2328] px-6 py-4 font-semibold text-white transition-all duration-300 hover:bg-[#2b3138] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 1.5a10.5 10.5 0 0 0-3.32 20.47c.52.1.71-.23.71-.5v-1.76c-2.92.64-3.54-1.4-3.54-1.4-.48-1.22-1.17-1.55-1.17-1.55-.96-.65.07-.64.07-.64 1.06.08 1.62 1.09 1.62 1.09.94 1.62 2.47 1.15 3.07.88.1-.68.37-1.15.67-1.41-2.33-.27-4.78-1.17-4.78-5.18 0-1.15.41-2.08 1.08-2.81-.11-.27-.47-1.34.1-2.79 0 0 .88-.28 2.88 1.07a10 10 0 0 1 5.24 0c2-1.35 2.88-1.07 2.88-1.07.57 1.45.21 2.52.1 2.79.67.73 1.08 1.66 1.08 2.81 0 4.02-2.45 4.9-4.79 5.16.38.33.71.97.71 1.96v2.91c0 .28.19.61.72.5A10.5 10.5 0 0 0 12 1.5z" />
                </svg>
                {pendingProvider === "github"
                  ? t("registerPage", "connecting")
                  : t("registerPage", "signInGithub")}
              </button>
            </div>

            <div className="my-6 flex w-full items-center gap-3 text-xs text-[var(--text-muted)]">
              <span className="h-px flex-1 bg-[var(--border-color)]" />
              or
              <span className="h-px flex-1 bg-[var(--border-color)]" />
            </div>

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
                disabled={isSubmitting || pendingProvider !== null}
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
