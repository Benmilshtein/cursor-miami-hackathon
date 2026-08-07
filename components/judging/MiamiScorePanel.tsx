"use client";

import { useState } from "react";
import { Check, Loader2, Lock, Send } from "lucide-react";

export type MiamiPillarValues = {
  problemIdentification: number;
  productMaturity: number;
  solutionViability: number;
};

export type MiamiScoreRow = MiamiPillarValues & {
  judgeUserId: string;
  judgeName: string;
  total: number;
  submittedAt: string;
};

export type MiamiAverages = MiamiPillarValues & { total: number; judgeCount: number };

export type MiamiSubmittedScore = MiamiPillarValues & { total: number; submittedAt: string };

const PILLARS: { key: keyof MiamiPillarValues; label: string; short: string }[] = [
  { key: "problemIdentification", label: "Problem Identification", short: "Problem" },
  { key: "productMaturity", label: "Product Maturity", short: "Maturity" },
  { key: "solutionViability", label: "Solution Viability", short: "Viability" },
];

type MiamiScorePanelProps = {
  teamId: number;
  teamName: string;
  /** Super admins see all scores read-only and never get inputs. */
  isAdmin: boolean;
  myScore: MiamiSubmittedScore | null;
  scoresVisible: boolean;
  scores: MiamiScoreRow[];
  averages: MiamiAverages | null;
  onSubmitted?: (score: MiamiSubmittedScore) => void;
};

function ScoresTable({ scores, averages }: { scores: MiamiScoreRow[]; averages: MiamiAverages | null }) {
  if (scores.length === 0) {
    return <p className="text-xs text-[var(--text-muted)]">No judge scores submitted yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-[var(--text-muted)]">
            <th className="py-1 pr-3 font-medium">Judge</th>
            {PILLARS.map((p) => (
              <th key={p.key} className="py-1 pr-3 font-medium" title={p.label}>
                {p.short}
              </th>
            ))}
            <th className="py-1 font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {scores.map((s) => (
            <tr key={s.judgeUserId} className="border-t border-[var(--border-color)]/50 text-[var(--text-secondary)]">
              <td className="py-1.5 pr-3 text-white">{s.judgeName}</td>
              {PILLARS.map((p) => (
                <td key={p.key} className="py-1.5 pr-3 tabular-nums">
                  {s[p.key]}
                </td>
              ))}
              <td className="py-1.5 font-semibold tabular-nums text-white">{s.total} / 30</td>
            </tr>
          ))}
          {averages && (
            <tr className="border-t border-[var(--border-color)] text-[var(--accent-blue)]">
              <td className="py-1.5 pr-3 font-medium">
                Average ({averages.judgeCount} judge{averages.judgeCount === 1 ? "" : "s"})
              </td>
              <td className="py-1.5 pr-3 tabular-nums">{averages.problemIdentification}</td>
              <td className="py-1.5 pr-3 tabular-nums">{averages.productMaturity}</td>
              <td className="py-1.5 pr-3 tabular-nums">{averages.solutionViability}</td>
              <td className="py-1.5 font-semibold tabular-nums">{averages.total} / 30</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Per-team Miami pillar scoring block.
 * - Judge, not submitted: three 0-10 inputs + one-shot submit (final).
 * - Judge, submitted: own score + all judges' scores (now visible).
 * - Admin: all judges' scores, read-only.
 */
export function MiamiScorePanel({
  teamId,
  teamName,
  isAdmin,
  myScore,
  scoresVisible,
  scores,
  averages,
  onSubmitted,
}: MiamiScorePanelProps) {
  const [values, setValues] = useState<Record<keyof MiamiPillarValues, string>>({
    problemIdentification: "",
    productMaturity: "",
    solutionViability: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const parsed: Partial<MiamiPillarValues> = {};
    for (const p of PILLARS) {
      const raw = values[p.key].trim();
      const n = Number(raw);
      if (raw === "" || !Number.isInteger(n) || n < 0 || n > 10) {
        setError(`${p.label} must be a whole number from 0 to 10.`);
        return;
      }
      parsed[p.key] = n;
    }
    if (
      !window.confirm(
        `Submit final scores for “${teamName}”? Scores cannot be changed after submission.`,
      )
    ) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/scoring-system/scores", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, ...parsed }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message ?? "Failed to submit score");
      }
      onSubmitted?.(json.data as MiamiSubmittedScore);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit score");
    } finally {
      setSubmitting(false);
    }
  };

  if (isAdmin) {
    return (
      <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 p-3">
        <ScoresTable scores={scores} averages={averages} />
      </div>
    );
  }

  if (myScore) {
    return (
      <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/[0.04] p-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 font-medium text-emerald-400">
            <Check className="h-3.5 w-3.5" /> Your score (final)
          </span>
          {PILLARS.map((p) => (
            <span
              key={p.key}
              className="rounded bg-white/5 px-1.5 py-0.5 text-[var(--text-secondary)]"
              title={p.label}
            >
              {p.short}: <span className="font-semibold text-white">{myScore[p.key]}</span>
            </span>
          ))}
          <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-semibold text-emerald-300">
            {myScore.total} / 30
          </span>
        </div>
        {scoresVisible && scores.length > 1 && <ScoresTable scores={scores} averages={averages} />}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 p-3">
      <div className="flex flex-wrap items-end gap-3">
        {PILLARS.map((p) => (
          <label key={p.key} className="flex flex-col gap-1">
            <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              {p.label}
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={10}
              step={1}
              placeholder="0–10"
              value={values[p.key]}
              onChange={(e) => {
                setValues((prev) => ({ ...prev, [p.key]: e.target.value }));
                setError(null);
              }}
              className="w-20 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-2.5 py-1.5 text-sm text-white placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:outline-none"
            />
          </label>
        ))}
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={submitting}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent-blue)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--accent-blue)]/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          {submitting ? "Submitting…" : "Submit score"}
        </button>
      </div>
      <p className="mt-2 flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
        <Lock className="h-3 w-3" />
        One submission per team. Scores are final and other judges&apos; scores unlock after you submit.
      </p>
      {error && <p className="mt-1.5 text-xs text-red-300">{error}</p>}
    </div>
  );
}
