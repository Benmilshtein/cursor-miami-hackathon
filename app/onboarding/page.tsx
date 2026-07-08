"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Check, Compass, Users, Trophy, Clock, Globe } from "lucide-react";
import { useAuth, useSessionUser } from "@/lib/auth/AuthProvider";
import { isStaffPortalRole, requiresParticipantOnboarding } from "@/lib/auth/roles";
import { NoiseOverlay } from "@/components/ui";

type OnboardingLanguage = "en" | "de" | "es";

const LANG_LABELS: Record<OnboardingLanguage, string> = {
  en: "English",
  de: "Deutsch",
  es: "Español",
};

type StepContent = {
  icon: typeof Compass;
  title: string;
  text: string;
};

const STEPS: Record<OnboardingLanguage, StepContent[]> = {
  en: [
    {
      icon: Compass,
      title: "Welcome to the Hackathon",
      text: "A beginner-friendly night of building with AI. This short intro covers how the night works.",
    },
    {
      icon: Users,
      title: "Find your team",
      text: "You can have us match you into a balanced team with new people, or form your own: create a team or join one with an invite code from your dashboard.",
    },
    {
      icon: Clock,
      title: "Build the night away",
      text: "Doors at 4pm: onboarding, tutorials, and networking, then heads-down building from 6 with mentors floating around to help.",
    },
    {
      icon: Trophy,
      title: "Demos & celebration",
      text: "At 10:30 teams take the stage, we crown the winners, and then we hang and celebrate everything that got built. Let's go!",
    },
  ],
  de: [
    {
      icon: Compass,
      title: "Willkommen beim Hackathon",
      text: "Ein anfängerfreundlicher Abend zum Bauen mit KI. Diese kurze Einführung erklärt den Ablauf.",
    },
    {
      icon: Users,
      title: "Finde dein Team",
      text: "Wir können dich in ein ausgewogenes Team mit neuen Leuten einteilen, oder du bildest dein eigenes: erstelle ein Team oder tritt mit einem Einladungscode im Dashboard bei.",
    },
    {
      icon: Clock,
      title: "Bau den Abend durch",
      text: "Einlass um 16 Uhr: Onboarding, Tutorials und Networking, dann ab 18 Uhr konzentriertes Bauen mit Mentor:innen, die dir helfen.",
    },
    {
      icon: Trophy,
      title: "Demos & Feier",
      text: "Um 22:30 gehen die Teams auf die Bühne, wir küren die Gewinner und feiern dann alles, was gebaut wurde. Los geht's!",
    },
  ],
  es: [
    {
      icon: Compass,
      title: "Bienvenido al Hackathon",
      text: "Una noche para principiantes de construir con IA. Esta breve intro explica cómo funciona la noche.",
    },
    {
      icon: Users,
      title: "Encuentra tu equipo",
      text: "Podemos emparejarte en un equipo equilibrado con gente nueva, o forma el tuyo: crea un equipo o únete con un código de invitación desde tu panel.",
    },
    {
      icon: Clock,
      title: "Construye toda la noche",
      text: "Puertas a las 4pm: bienvenida, tutoriales y networking, y desde las 6 a construir con mentores circulando para ayudarte.",
    },
    {
      icon: Trophy,
      title: "Demos y celebración",
      text: "A las 10:30 los equipos suben al escenario, coronamos a los ganadores y luego celebramos todo lo que se construyó. ¡Vamos!",
    },
  ],
};

const BUTTON_LABELS: Record<
  OnboardingLanguage,
  { next: string; continue: string; loading: string; redirecting: string }
> = {
  en: { next: "Next", continue: "Continue", loading: "Loading…", redirecting: "Redirecting…" },
  de: { next: "Weiter", continue: "Weiter", loading: "Laden…", redirecting: "Weiterleitung…" },
  es: { next: "Siguiente", continue: "Continuar", loading: "Cargando…", redirecting: "Redirigiendo…" },
};

const LEVELS = [
  { value: 1, label: "Beginner", hint: "New to this? Perfect" },
  { value: 2, label: "Intermediate", hint: "Built a few things" },
  { value: 3, label: "Expert", hint: "I ship code regularly" },
];

type Preference = "auto_match" | "self_form";

function roleHome(role: string): string {
  if (isStaffPortalRole(role)) return "/staff";
  if (role === "super_admin") return "/admin/dashboard";
  return "/dashboard";
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isPending } = useSessionUser();
  const { refresh } = useAuth();

  const [lang, setLang] = useState<OnboardingLanguage>("en");
  const [step, setStep] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [pooled, setPooled] = useState(false);

  const [experienceLevel, setExperienceLevel] = useState<number | null>(null);
  const [matchNumber, setMatchNumber] = useState<number | null>(null);
  const [builtApp, setBuiltApp] = useState<boolean | null>(null);
  const [vibeCode, setVibeCode] = useState<boolean | null>(null);
  const [preference, setPreference] = useState<Preference | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const role = user?.role ?? "participant";

  // Redirect users who don't need participant onboarding, or who already finished it.
  useEffect(() => {
    if (isPending) return;
    if (!user) {
      router.replace("/register");
      return;
    }
    if (!requiresParticipantOnboarding(role) || user.onboardingCompleted) {
      router.replace(roleHome(role));
    }
  }, [isPending, user, role, router]);

  const steps = STEPS[lang];
  const labels = BUTTON_LABELS[lang];

  if (isPending || !user || !requiresParticipantOnboarding(role) || user.onboardingCompleted) {
    return (
      <>
        <NoiseOverlay />
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
          <div className="text-[var(--text-muted)]">{labels.loading}</div>
        </div>
      </>
    );
  }

  const canSubmit =
    experienceLevel !== null &&
    matchNumber !== null &&
    builtApp !== null &&
    vibeCode !== null &&
    preference !== null;

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError("Please answer every question to continue.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/me/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          experienceLevel,
          matchNumber,
          builtApp,
          vibeCode,
          teamPreference: preference,
        }),
      });
      const data = (await res.json().catch(() => null)) as
        | { error?: { message?: string } }
        | null;
      if (!res.ok) {
        throw new Error(data?.error?.message ?? "Failed to save");
      }
      await refresh();
      if (preference === "self_form") {
        router.replace("/dashboard");
      } else {
        setPooled(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setSubmitting(false);
    }
  };

  if (pooled) {
    return (
      <>
        <NoiseOverlay />
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-lg rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center shadow-xl"
          >
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--accent-green)]/20">
              <Check className="h-7 w-7 text-[var(--accent-green)]" />
            </div>
            <h1 className="text-xl font-bold text-white">You&apos;re in the pool!</h1>
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
              We&apos;ll match you into a balanced team with at least one experienced
              builder. Check your dashboard after the organizers run team matching - 
              your teammates will show up there.
            </p>
            <Link
              href="/dashboard"
              className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-[var(--accent-blue)] px-5 py-3 text-sm font-medium text-white hover:bg-[var(--accent-blue)]/90"
            >
              Go to dashboard
            </Link>
          </motion.div>
        </div>
      </>
    );
  }

  const current = steps[step];
  const Icon = current?.icon ?? Compass;
  const isLastInfo = step === steps.length - 1;

  return (
    <>
      <NoiseOverlay />
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 shadow-xl">
          {!showProfile ? (
            <>
              {/* Language toggle */}
              <div className="mb-6 flex items-center justify-center gap-1">
                <Globe className="mr-1.5 h-4 w-4 text-[var(--text-muted)]" />
                {(Object.entries(LANG_LABELS) as [OnboardingLanguage, string][]).map(
                  ([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setLang(key);
                        setStep(0);
                      }}
                      className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                        lang === key
                          ? "bg-[var(--accent-blue)]/20 text-[var(--accent-blue)]"
                          : "text-[var(--text-muted)] hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {label}
                    </button>
                  ),
                )}
              </div>

              <div className="flex justify-center mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--accent-blue)]/20">
                  <Icon className="h-7 w-7 text-[var(--accent-blue)]" />
                </div>
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${lang}-${step}`}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="text-xl font-bold text-white text-center">{current?.title}</h1>
                  <p className="mt-4 text-[var(--text-secondary)] text-center text-sm leading-relaxed">
                    {current?.text}
                  </p>
                </motion.div>
              </AnimatePresence>
              <div className="mt-8 flex items-center justify-between gap-4">
                <div className="flex gap-1">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 w-8 rounded-full ${
                        i <= step ? "bg-[var(--accent-blue)]" : "bg-[var(--border-color)]"
                      }`}
                    />
                  ))}
                </div>
                {!isLastInfo ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.min(s + 1, steps.length - 1))}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-blue)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-blue)]/90"
                  >
                    {labels.next}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowProfile(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-blue)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-blue)]/90"
                  >
                    {labels.continue}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="mb-6 text-center">
                <h1 className="text-xl font-bold text-white">A quick intro before we start</h1>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  Five quick taps so we can set you up with the right people.
                </p>
              </div>

              {error ? (
                <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              {/* Experience level */}
              <fieldset className="mb-6">
                <legend className="mb-3 text-sm font-semibold text-white">
                  How much have you built before?
                </legend>
                <div className="grid gap-2">
                  {LEVELS.map((level) => (
                    <button
                      key={level.value}
                      type="button"
                      onClick={() => setExperienceLevel(level.value)}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors ${
                        experienceLevel === level.value
                          ? "border-[var(--accent-green)] bg-[var(--accent-green)]/10"
                          : "border-[var(--border-color)] bg-white/5 hover:border-white/30"
                      }`}
                    >
                      <span className="font-medium text-white">{level.label}</span>
                      <span className="text-xs text-[var(--text-muted)]">{level.hint}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Lucky number */}
              <fieldset className="mb-6">
                <legend className="mb-1 text-sm font-semibold text-white">Pick a lucky number</legend>
                <p className="mb-3 text-xs text-[var(--text-muted)]">
                  Just for fun. It helps us mix up balanced teams.
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setMatchNumber(n)}
                      className={`min-h-[56px] rounded-xl border text-xl font-bold transition-colors ${
                        matchNumber === n
                          ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/15 text-white"
                          : "border-[var(--border-color)] bg-white/5 text-[var(--text-secondary)] hover:border-white/30"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </fieldset>

              {/* Toggles */}
              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                <YesNo label="Built an app before?" value={builtApp} onChange={setBuiltApp} />
                <YesNo label="Do you vibe code?" value={vibeCode} onChange={setVibeCode} />
              </div>

              {/* Preference */}
              <fieldset className="mb-7">
                <legend className="mb-3 text-sm font-semibold text-white">
                  How do you want your team?
                </legend>
                <div className="grid gap-2">
                  <PreferenceOption
                    active={preference === "auto_match"}
                    onClick={() => setPreference("auto_match")}
                    title="Match me into a team"
                    desc="We'll place you on a balanced team with new people. No team needed."
                  />
                  <PreferenceOption
                    active={preference === "self_form"}
                    onClick={() => setPreference("self_form")}
                    title="I'll form my own team"
                    desc="Create a team or join one with a code from the dashboard."
                  />
                </div>
              </fieldset>

              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setShowProfile(false)}
                  className="text-sm text-[var(--text-muted)] hover:text-white"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => void handleSubmit()}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-blue)] px-6 py-3 text-sm font-medium text-white hover:bg-[var(--accent-blue)]/90 disabled:opacity-50"
                >
                  {submitting ? "Saving…" : "Let's go"}
                  <Check className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function YesNo({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-white">{label}</p>
      <div className="flex gap-2">
        {[
          { label: "Yes", v: true },
          { label: "No", v: false },
        ].map((opt) => (
          <button
            key={opt.label}
            type="button"
            onClick={() => onChange(opt.v)}
            className={`min-h-[44px] flex-1 rounded-xl border text-sm font-medium transition-colors ${
              value === opt.v
                ? "border-[var(--accent-green)] bg-[var(--accent-green)]/10 text-white"
                : "border-[var(--border-color)] bg-white/5 text-[var(--text-secondary)] hover:border-white/30"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function PreferenceOption({
  active,
  onClick,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-3 text-left transition-colors ${
        active
          ? "border-[var(--accent-blue)] bg-[var(--accent-blue)]/10"
          : "border-[var(--border-color)] bg-white/5 hover:border-white/30"
      }`}
    >
      <div className="font-medium text-white">{title}</div>
      <div className="mt-0.5 text-xs text-[var(--text-muted)]">{desc}</div>
    </button>
  );
}
