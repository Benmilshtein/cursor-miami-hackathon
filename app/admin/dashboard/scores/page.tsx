"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Loader2, Trophy, Flag } from "lucide-react";

type JudgeSlot = { judgeUserId: string; displayName: string } | null;

type Criterion = {
  key: "innovation" | "technicalExecution" | "aiUsage" | "uxUi" | "businessPotential";
  label: string;
  shortLabel: string;
  max: number;
};

type JudgeCell = {
  scoreId: string;
  innovation: number;
  technicalExecution: number;
  aiUsage: number;
  uxUi: number;
  businessPotential: number;
  total: number;
} | null;

type TeamRow = {
  teamId: number;
  teamName: string;
  judgeCount: number;
  judgeTarget: number;
  averageFromJudges: number;
  lateSubmissionPenaltyPoints: number;
  manualOverride: number | null;
  effectiveTotal: number;
  judgeCells: JudgeCell[];
};

/** Editable row for one judge column (null = padded empty slot). */
type DraftCell = {
  scoreId: string | null;
  judgeUserId: string;
  innovation: number;
  technicalExecution: number;
  aiUsage: number;
  uxUi: number;
  businessPotential: number;
};

function sumDraft(d: DraftCell): number {
  return (
    d.innovation +
    d.technicalExecution +
    d.aiUsage +
    d.uxUi +
    d.businessPotential
  );
}

function buildDraft(t: TeamRow, slots: JudgeSlot[]): (DraftCell | null)[] {
  return slots.map((slot, ji) => {
    if (!slot) return null;
    const cell = t.judgeCells[ji];
    if (cell) {
      return {
        scoreId: cell.scoreId,
        judgeUserId: slot.judgeUserId,
        innovation: cell.innovation,
        technicalExecution: cell.technicalExecution,
        aiUsage: cell.aiUsage,
        uxUi: cell.uxUi,
        businessPotential: cell.businessPotential,
      };
    }
    return {
      scoreId: null,
      judgeUserId: slot.judgeUserId,
      innovation: 0,
      technicalExecution: 0,
      aiUsage: 0,
      uxUi: 0,
      businessPotential: 0,
    };
  });
}

type LoadResult = {
  teams: TeamRow[];
  judgeSlots: JudgeSlot[];
  criteria: Criterion[];
};

export default function AdminFinalScoresPage() {
  const [judgeSlots, setJudgeSlots] = useState<JudgeSlot[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [savingJudgesTeamId, setSavingJudgesTeamId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set());
  const [judgeDrafts, setJudgeDrafts] = useState<Record<number, (DraftCell | null)[]>>({});
  const prevExpandedRef = useRef<Set<number>>(new Set());

  const load = useCallback(async (): Promise<LoadResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/official-scores", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
      const nextTeams: TeamRow[] = json.data?.teams ?? [];
      const nextSlots: JudgeSlot[] = json.data?.judgeSlots ?? [];
      const nextCriteria: Criterion[] = json.data?.criteria ?? [];
      setTeams(nextTeams);
      setJudgeSlots(nextSlots);
      setCriteria(nextCriteria);
      return { teams: nextTeams, judgeSlots: nextSlots, criteria: nextCriteria };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setTeams([]);
      setJudgeSlots([]);
      setCriteria([]);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const prev = prevExpandedRef.current;
    const curr = expanded;
    prevExpandedRef.current = new Set(curr);

    for (const tid of curr) {
      if (!prev.has(tid)) {
        const t = teams.find((x) => x.teamId === tid);
        if (t) {
          setJudgeDrafts((d) => ({ ...d, [tid]: buildDraft(t, judgeSlots) }));
        }
      }
    }
    for (const tid of prev) {
      if (!curr.has(tid)) {
        setJudgeDrafts((d) => {
          const { [tid]: _, ...rest } = d;
          return rest;
        });
      }
    }
  }, [expanded, teams, judgeSlots]);

  function toggleExpand(teamId: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  }

  function updateDraft(
    teamId: number,
    field: "manualOverride" | "lateSubmissionPenaltyPoints",
    raw: string,
  ) {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.teamId !== teamId) return t;
        if (field === "manualOverride") {
          if (raw.trim() === "") return { ...t, manualOverride: null };
          const n = parseFloat(raw);
          return { ...t, manualOverride: Number.isNaN(n) ? null : n };
        }
        const n = parseInt(raw, 10);
        return { ...t, lateSubmissionPenaltyPoints: Number.isNaN(n) ? 0 : n };
      }),
    );
  }

  function updateJudgeDraft(
    teamId: number,
    slotIndex: number,
    key: Criterion["key"],
    raw: string,
    max: number,
  ) {
    setJudgeDrafts((prev) => {
      const row = prev[teamId];
      if (!row) return prev;
      const copy = row.map((c) => (c ? { ...c } : c));
      const cell = copy[slotIndex];
      if (!cell) return prev;
      const n = parseInt(raw, 10);
      const v = Number.isNaN(n) ? 0 : Math.max(0, Math.min(max, n));
      copy[slotIndex] = { ...cell, [key]: v };
      return { ...prev, [teamId]: copy };
    });
  }

  async function save(teamId: number) {
    const t = teams.find((x) => x.teamId === teamId);
    if (!t) return;
    setSavingId(teamId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/teams/${teamId}/official-score`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          finalScore: t.manualOverride,
          latePenalty: t.lateSubmissionPenaltyPoints,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingId(null);
    }
  }

  async function saveJudgeDrafts(teamId: number) {
    const draft = judgeDrafts[teamId];
    if (!draft) return;
    setSavingJudgesTeamId(teamId);
    setError(null);
    try {
      const requests: Promise<Response>[] = [];
      for (let ji = 0; ji < draft.length; ji++) {
        const d = draft[ji];
        if (!d) continue;
        const body = {
          innovation: d.innovation,
          technicalExecution: d.technicalExecution,
          aiUsage: d.aiUsage,
          uxUi: d.uxUi,
          businessPotential: d.businessPotential,
        };
        if (d.scoreId) {
          requests.push(
            fetch(`/api/admin/scores/${d.scoreId}`, {
              method: "PATCH",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }),
          );
        } else {
          requests.push(
            fetch(`/api/admin/teams/${teamId}/judge-score`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                judgeUserId: d.judgeUserId,
                ...body,
              }),
            }),
          );
        }
      }
      const results = await Promise.all(requests);
      for (const res of results) {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
      }
      const data = await load();
      if (data) {
        const t = data.teams.find((x) => x.teamId === teamId);
        if (t && expanded.has(teamId)) {
          setJudgeDrafts((prev) => ({
            ...prev,
            [teamId]: buildDraft(t, data.judgeSlots),
          }));
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save judge scores");
    } finally {
      setSavingJudgesTeamId(null);
    }
  }

  const judgeColCount = judgeSlots.length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Final scores</h1>
          <p className="mt-1 text-[var(--text-secondary)] max-w-3xl text-sm leading-relaxed">
            Five criteria per judge (max 100 per judge). The row shows <strong>each judge&apos;s total</strong>; expand
            to <strong>edit scores</strong> (same as judge view) or add a row if the judge has not voted yet. The
            public ranking uses <strong>the average of judge totals</strong> minus <strong>late penalty</strong>;
            optionally <strong>manual override</strong>. Then{" "}
            <Link
              href="/admin/dashboard/ranking"
              className="text-[var(--accent-blue)] hover:underline inline-flex items-center gap-1"
            >
              <Trophy className="h-3.5 w-3.5" />
              publish the results
            </Link>
            .
          </p>
        </div>
        <Link
          href="/admin/dashboard/ranking"
          className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--accent-blue)]/15 px-4 py-2 text-sm font-medium text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/25"
        >
          <Trophy className="h-4 w-4" />
          Publish results
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--text-muted)]" />
        </div>
      ) : teams.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-10 text-center text-[var(--text-secondary)]">
          No approved teams yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)]">
          <div className="overflow-x-auto">
            <table
              className="w-full text-left text-sm"
              style={{ minWidth: `${420 + judgeColCount * 88 + 360}px` }}
            >
              <thead>
                <tr className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50">
                  <th className="px-2 py-3 w-10" />
                  <th className="px-3 py-3 font-medium text-[var(--text-secondary)] min-w-[160px]">Team</th>
                  {judgeSlots.map((slot, i) => (
                    <th
                      key={i}
                      className="px-2 py-3 font-medium text-[var(--text-secondary)] text-center w-[88px] align-bottom"
                      title={slot ? slot.displayName : undefined}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                          Judge {i + 1}
                        </span>
                        <span className="text-xs text-white font-normal line-clamp-2 max-w-[84px]">
                          {slot ? slot.displayName : "—"}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th className="px-2 py-3 font-medium text-[var(--text-secondary)] text-center whitespace-nowrap">
                    Judges
                  </th>
                  <th className="px-2 py-3 font-medium text-[var(--text-secondary)] text-right whitespace-nowrap">
                    Avg total
                  </th>
                  <th className="px-2 py-3 font-medium text-[var(--text-secondary)] text-center w-24">
                    Late −pts
                  </th>
                  <th className="px-2 py-3 font-medium text-[var(--text-secondary)] text-center w-28">
                    Manual
                  </th>
                  <th className="px-2 py-3 font-medium text-[var(--text-secondary)] text-right whitespace-nowrap">
                    Public
                  </th>
                  <th className="px-2 py-3 w-20" />
                </tr>
              </thead>
              <tbody>
                {teams.map((t) => {
                  const isOpen = expanded.has(t.teamId);
                  const draftRow = judgeDrafts[t.teamId];
                  return (
                    <Fragment key={t.teamId}>
                      <tr className="border-b border-[var(--border-color)]/40">
                        <td className="px-1 py-2 align-middle">
                          <button
                            type="button"
                            onClick={() => toggleExpand(t.teamId)}
                            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-white hover:bg-white/5"
                            aria-expanded={isOpen}
                            aria-label={isOpen ? "Collapse judge breakdown" : "Expand judge breakdown"}
                          >
                            {isOpen ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                        <td className="px-3 py-3 font-medium text-white">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="truncate">{t.teamName}</span>
                            {t.lateSubmissionPenaltyPoints > 0 && (
                              <span
                                className="inline-flex shrink-0 text-red-500"
                                title="Team submitted after the project deadline"
                                aria-label="Late submission: penalty after deadline"
                              >
                                <Flag className="h-4 w-4 text-red-500" strokeWidth={2} aria-hidden />
                              </span>
                            )}
                          </div>
                        </td>
                        {t.judgeCells.map((cell, ji) => (
                          <td
                            key={ji}
                            className="px-2 py-3 text-center tabular-nums text-[var(--text-muted)] text-xs"
                          >
                            {cell ? (
                              <span className="text-white font-medium">{cell.total.toFixed(1)}</span>
                            ) : judgeSlots[ji] ? (
                              "—"
                            ) : (
                              ""
                            )}
                          </td>
                        ))}
                        <td className="px-2 py-3 text-center text-[var(--text-secondary)] tabular-nums text-xs">
                          {t.judgeCount}/{t.judgeTarget}
                        </td>
                        <td className="px-2 py-3 text-right tabular-nums text-[var(--text-muted)] text-xs">
                          {t.averageFromJudges.toFixed(1)}
                        </td>
                        <td className="px-2 py-3">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={t.lateSubmissionPenaltyPoints}
                            onChange={(e) =>
                              updateDraft(t.teamId, "lateSubmissionPenaltyPoints", e.target.value)
                            }
                            className="w-full max-w-[72px] mx-auto block rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-2 py-1.5 text-white text-sm text-center"
                          />
                        </td>
                        <td className="px-2 py-3">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="0.1"
                            placeholder="auto"
                            value={t.manualOverride ?? ""}
                            onChange={(e) => updateDraft(t.teamId, "manualOverride", e.target.value)}
                            className="w-full max-w-[88px] mx-auto block rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-2 py-1.5 text-white text-sm text-center"
                          />
                        </td>
                        <td className="px-2 py-3 text-right font-semibold tabular-nums text-white text-xs">
                          {t.effectiveTotal.toFixed(1)}
                        </td>
                        <td className="px-2 py-3">
                          <button
                            type="button"
                            disabled={savingId === t.teamId}
                            onClick={() => void save(t.teamId)}
                            className="rounded-lg border border-[var(--accent-blue)]/40 bg-[var(--accent-blue)]/15 px-3 py-1.5 text-xs font-medium text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/25 disabled:opacity-50"
                          >
                            {savingId === t.teamId ? "…" : "Save"}
                          </button>
                        </td>
                      </tr>
                      {isOpen && draftRow && (
                        <tr className="border-b border-[var(--border-color)]/40 bg-[var(--bg-secondary)]/20">
                          <td colSpan={2 + judgeColCount + 6} className="px-3 py-4">
                            <div className="overflow-x-auto rounded-lg border border-[var(--border-color)]/50">
                              <table className="w-full text-xs min-w-[720px]">
                                <thead>
                                  <tr className="border-b border-[var(--border-color)]/60">
                                    <th className="px-2 py-2 text-left font-medium text-[var(--text-secondary)] w-40">
                                      Criterion
                                    </th>
                                    {judgeSlots.map((slot, ji) => (
                                      <th
                                        key={ji}
                                        className="px-1 py-2 text-center font-medium text-[var(--text-secondary)] min-w-[72px]"
                                        title={slot?.displayName}
                                      >
                                        {slot ? (
                                          <span className="line-clamp-2">{slot.displayName}</span>
                                        ) : (
                                          <span className="text-[var(--text-muted)]">—</span>
                                        )}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {criteria.map((c) => (
                                    <tr key={c.key} className="border-b border-[var(--border-color)]/30">
                                      <td className="px-2 py-1.5 text-[var(--text-secondary)]">
                                        {c.label}{" "}
                                        <span className="text-[var(--text-muted)]">(max {c.max})</span>
                                      </td>
                                      {draftRow.map((cell, ji) => (
                                        <td key={ji} className="px-1 py-1">
                                          {cell ? (
                                            <input
                                              type="number"
                                              min={0}
                                              max={c.max}
                                              value={cell[c.key]}
                                              onChange={(e) =>
                                                updateJudgeDraft(t.teamId, ji, c.key, e.target.value, c.max)
                                              }
                                              className="w-full min-w-0 rounded border border-[var(--border-color)] bg-[var(--bg-secondary)] px-1 py-1 text-center text-white tabular-nums"
                                            />
                                          ) : (
                                            <span className="block text-center text-[var(--text-muted)]">—</span>
                                          )}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                  <tr className="bg-[var(--bg-secondary)]/40 font-semibold">
                                    <td className="px-2 py-2 text-[var(--text-secondary)]">Judge total</td>
                                    {draftRow.map((cell, ji) => (
                                      <td key={ji} className="px-2 py-2 text-center tabular-nums text-white">
                                        {cell ? sumDraft(cell).toFixed(1) : ""}
                                      </td>
                                    ))}
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                              <button
                                type="button"
                                disabled={savingJudgesTeamId === t.teamId}
                                onClick={() => void saveJudgeDrafts(t.teamId)}
                                className="rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-xs font-medium text-emerald-300 hover:bg-emerald-500/25 disabled:opacity-50"
                              >
                                {savingJudgesTeamId === t.teamId ? (
                                  <span className="inline-flex items-center gap-2">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Saving…
                                  </span>
                                ) : (
                                  "Save judge scores"
                                )}
                              </button>
                              <span className="text-[11px] text-[var(--text-muted)]">
                                A new row (judge without a score) is created on save. Column limits match the judge form.
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
