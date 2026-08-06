"use client";

import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type PrdExampleModalProps = {
  open: boolean;
  onClose: () => void;
};

export function PrdExampleModal({ open, onClose }: PrdExampleModalProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-2xl shadow-black/50"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-color)] px-5 py-4 sm:px-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--accent-blue)]">
              Ship Night
            </p>
            <h2
              id={titleId}
              className="mt-1 text-xl sm:text-2xl font-bold text-white"
            >
              Product Requirements Document (PRD)
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--border-color)] p-2 text-[var(--text-muted)] hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6 sm:py-6 text-[var(--text-secondary)] text-sm sm:text-[15px] leading-relaxed space-y-6">
          <section className="space-y-2">
            <h3 className="text-base font-semibold text-white">What is a PRD?</h3>
            <p>
              A PRD is a one-page document that says{" "}
              <strong className="text-white">
                what you are building, who it&apos;s for, and what &quot;done&quot; looks like
              </strong>{" "}
              before you start shipping. It is not a business plan, a pitch deck, or a
              technical spec. It&apos;s the shortest possible answer to:{" "}
              <em>
                if this works, what exactly exists at the end of the night?
              </em>
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-semibold text-white">Why it&apos;s required</h3>
            <p>
              Your PRD locks your scope. Once submitted, it becomes the standard your
              final demo is measured against: judges compare what you said you&apos;d
              build to what you actually shipped. Teams that skip this step almost
              always over-scope and run out of time.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-semibold text-white">Rules</h3>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="text-white">One page maximum.</strong> If it
                doesn&apos;t fit, cut features, not words.
              </li>
              <li>
                <strong className="text-white">Due at 6:30 PM.</strong> Submit through
                the Ship Night platform. No PRD, no submission.
              </li>
              <li>
                <strong className="text-white">Scope is locked at 6:30.</strong> You
                can cut features after that, but you can&apos;t add new ones.
              </li>
              <li>
                <strong className="text-white">Final submissions lock at 9:30 PM.</strong>{" "}
                Hard cutoff in the platform.
              </li>
              <li>
                <strong className="text-white">Write it in 20 minutes.</strong> This is
                a scoping exercise, not a writing exercise.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-base font-semibold text-white">Required sections</h3>
            <ol className="list-decimal space-y-3 pl-5">
              <li>
                <strong className="text-white">Product name + one-liner</strong>
                <p className="mt-1">
                  What it is in a single sentence a stranger would understand.
                </p>
              </li>
              <li>
                <strong className="text-white">Problem</strong>
                <p className="mt-1">
                  Who has this problem and what they do today instead. Two sentences.
                </p>
              </li>
              <li>
                <strong className="text-white">Solution</strong>
                <p className="mt-1">How your product solves it. Three sentences max.</p>
              </li>
              <li>
                <strong className="text-white">Core features (V1)</strong>
                <p className="mt-1">
                  3 to 5 bullets. These are the only things you&apos;re building
                  tonight. Anything else goes in &quot;Out of scope.&quot;
                </p>
              </li>
              <li>
                <strong className="text-white">Out of scope</strong>
                <p className="mt-1">
                  What you are deliberately NOT building. This section is what keeps
                  you shipping.
                </p>
              </li>
              <li>
                <strong className="text-white">Success criteria</strong>
                <p className="mt-1">
                  The specific thing you will demo on stage at 10:00 PM (3 minutes,
                  live product only, no slides). Be concrete: &quot;a user can upload
                  X and get Y back in under 5 seconds.&quot;
                </p>
              </li>
              <li>
                <strong className="text-white">Tech stack</strong>
                <p className="mt-1">One line. What you&apos;re building it with.</p>
              </li>
            </ol>
          </section>

          <div className="h-px bg-[var(--border-color)]" />

          <section className="space-y-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-primary)]/60 p-4 sm:p-5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--accent-green)]">
                Example PRD
              </p>
              <h3 className="mt-1 text-xl font-bold text-white">Lot Check</h3>
              <p className="mt-1 italic text-[var(--text-secondary)]">
                Snap a photo of any parking sign and get a plain-English answer on
                whether you can park there right now.
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="font-semibold text-white">Problem</h4>
              <p>
                Miami parking signs stack three to four rules on one pole, often
                contradicting each other. Drivers either guess and get ticketed, or
                circle the block looking for a safer spot.
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="font-semibold text-white">Solution</h4>
              <p>
                A mobile web app where you take a photo of the sign. A vision model
                reads every rule on the pole, compares them against the current day
                and time, and returns a green &quot;You can park&quot; or red
                &quot;Don&apos;t park&quot; with a one-line reason.
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="font-semibold text-white">Core features (V1)</h4>
              <ul className="list-disc space-y-1 pl-5">
                <li>Camera capture from mobile browser</li>
                <li>Vision model extracts all rules from the sign image</li>
                <li>Rules evaluated against current local day/time</li>
                <li>Green / red verdict with a plain-English explanation</li>
                <li>
                  &quot;Until when?&quot; line showing when the verdict changes
                </li>
              </ul>
            </div>

            <div className="space-y-1">
              <h4 className="font-semibold text-white">Out of scope</h4>
              <ul className="list-disc space-y-1 pl-5">
                <li>User accounts and saved history</li>
                <li>Native iOS/Android apps</li>
                <li>Street-cleaning schedules and city permit zones</li>
                <li>Payments or ticket appeals</li>
              </ul>
            </div>

            <div className="space-y-1">
              <h4 className="font-semibold text-white">Success criteria</h4>
              <p>
                A judge photographs a real parking sign on their phone and gets a
                correct verdict with an explanation in under 5 seconds.
              </p>
            </div>

            <div className="space-y-1">
              <h4 className="font-semibold text-white">Tech stack</h4>
              <p>Next.js + Vercel, Claude vision API, built in Cursor.</p>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="text-base font-semibold text-white">
              Before you submit, check:
            </h3>
            <ul className="space-y-2">
              {[
                "Fits on one page",
                "Core features list has 5 items or fewer",
                '"Out of scope" is filled in and honest',
                "Success criteria describes something you can physically demo on stage (3 min, live product)",
                "Your whole team agrees this is what you're building",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span
                    className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-[var(--border-color)] text-[10px] text-[var(--text-muted)]"
                    aria-hidden
                  >
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}
