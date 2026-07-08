"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { useSessionUser, useSupabaseBrowser } from "@/lib/auth/AuthProvider";
import { Logo, NoiseOverlay } from "@/components/ui";

export default function StaffLoginPage() {
  const router = useRouter();
  const supabase = useSupabaseBrowser();
  const { user, isPending } = useSessionUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isPending || !user) return;
    if (user.role === "judge" || user.role === "mentor") {
      router.replace("/staff");
    } else {
      router.replace("/");
    }
  }, [isPending, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message ?? "Sign-in failed.");
        setIsSubmitting(false);
        return;
      }

      // Resolve the role from the server profile before routing.
      const res = await fetch("/api/me", { cache: "no-store" });
      const role = res.ok ? (await res.json())?.user?.role : undefined;
      if (role === "judge" || role === "mentor") {
        router.replace("/staff");
        return;
      }
      await supabase.auth.signOut();
      setError("This account is not a judge or mentor. Use the main site to sign in.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPending || user) {
    return (
      <>
        <NoiseOverlay />
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
          <div className="text-[var(--text-muted)]">Loading…</div>
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
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Judges & Mentors
            </h1>
            <p className="text-[var(--text-secondary)] mb-6">
              Sign in with the email and password you set when you accepted the invite.
            </p>

            {error && (
              <div className="w-full mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-[var(--border-color)] bg-white/5 px-4 py-3 text-white placeholder:text-[var(--text-muted)] focus:border-white/30 focus:outline-none"
                autoComplete="email"
              />
              <div className="relative w-full">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-[var(--border-color)] bg-white/5 py-3 pl-4 pr-12 text-white placeholder:text-[var(--text-muted)] focus:border-white/30 focus:outline-none"
                  autoComplete="current-password"
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
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[48px] rounded-xl border border-[var(--border-color)] bg-white px-6 py-4 font-semibold text-black transition-all duration-300 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Signing in…" : "Sign in"}
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
