"use client";

import { useCallback, useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";

type State = {
  phase: "closed" | "round_1" | "round_2" | "finished";
  myGroup: "A" | "B" | null;
  activeGroup: "A" | "B" | null;
  presentingGroup: "A" | "B" | null;
  canVote: boolean;
  reason: null | "VOTING_CLOSED" | "NO_TEAM" | "NO_VOTING_GROUP" | "NOT_YOUR_ROUND" | "FINISHED";
  maxCredits: number;
  usedCredits: number;
  remainingCredits: number;
  votableTeams: Array<{ id: number; name: string; description: string | null }>;
  myVotes: Array<{ teamId: number; credits: number }>;
};

function reasonMessage(state: State): { title: string; body: string } {
  switch (state.reason) {
    case "VOTING_CLOSED":
      return {
        title: "Voting hasn't started yet",
        body: "Launch Credits open once organizers kick off the expo. Hang tight!",
      };
    case "FINISHED":
      return { title: "Voting is closed", body: "Thanks for casting your Launch Credits! 🎉" };
    case "NO_TEAM":
      return { title: "Join a team first", body: "You need to be on a team to take part in the expo vote." };
    case "NO_VOTING_GROUP":
      return {
        title: "Group not assigned yet",
        body: "Your team hasn't been placed into a voting group yet. Check back shortly.",
      };
    case "NOT_YOUR_ROUND":
      if (state.myGroup && state.myGroup === state.presentingGroup) {
        return {
          title: "You're presenting this round!",
          body: "Demo your build now. You'll get to vote when the groups swap.",
        };
      }
      return { title: "Not your turn yet", body: "Voting isn't open for your group right now." };
    default:
      return { title: "Voting unavailable", body: "Check back shortly." };
  }
}

/**
 * Inline dashboard ballot for the peer-voting expo. Renders its own heading so
 * it can slot directly into the dashboard's stacked sections.
 */
export default function PeerVotingSection() {
  const [state, setState] = useState<State | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingTeam, setPendingTeam] = useState<number | null>(null);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch("/api/peer-voting/state", { credentials: "include" });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        setState(json.data as State);
        setError(null);
      } else {
        setError(json?.error?.message ?? "Failed to load voting state");
      }
    } catch {
      setError("Failed to load voting state");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchState();
  }, [fetchState]);

  const creditsFor = (teamId: number) =>
    state?.myVotes.find((v) => v.teamId === teamId)?.credits ?? 0;

  const changeCredits = useCallback(
    async (teamId: number, nextCredits: number) => {
      setPendingTeam(teamId);
      setError(null);
      try {
        const res =
          nextCredits <= 0
            ? await fetch("/api/peer-voting/vote", {
                method: "DELETE",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ teamId }),
              })
            : await fetch("/api/peer-voting/vote", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ teamId, credits: nextCredits }),
              });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) {
          throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
        }
        await fetchState();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not update your vote");
        await fetchState();
      } finally {
        setPendingTeam(null);
      }
    },
    [fetchState],
  );

  return (
    <>
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent-blue)]">
          Expo
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold text-white sm:text-2xl">Launch Credits</h2>
          {state?.myGroup ? (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                state.myGroup === "A"
                  ? "bg-[var(--accent-blue)]/20 text-[var(--accent-blue)]"
                  : "bg-[var(--accent-purple)]/20 text-[var(--accent-purple)]"
              }`}
            >
              Your group: {state.myGroup}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Back the teams you loved. You only see the other group, and you can&apos;t vote for your own team.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 text-center text-[var(--text-muted)]">
          Loading…
        </div>
      ) : !state ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error ?? "Failed to load voting state."}
        </div>
      ) : (
        <>
          {error ? (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {state.canVote ? (
            <>
              <div className="flex items-center justify-between rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-4 py-3">
                <span className="text-sm text-[var(--text-secondary)]">Credits remaining</span>
                <span className="flex items-center gap-1.5">
                  {Array.from({ length: state.maxCredits }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-3.5 w-3.5 rounded-full ${
                        i < state.remainingCredits
                          ? "bg-[var(--accent-blue)]"
                          : "border border-[var(--border-color)] bg-transparent"
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm font-semibold text-white">
                    {state.remainingCredits}/{state.maxCredits}
                  </span>
                </span>
              </div>

              {state.votableTeams.length === 0 ? (
                <div className="mt-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 text-center text-[var(--text-muted)]">
                  No teams to vote on yet.
                </div>
              ) : (
                <ul className="mt-4 space-y-3">
                  {state.votableTeams.map((t) => {
                    const credits = creditsFor(t.id);
                    const busy = pendingTeam === t.id;
                    const canAdd = state.remainingCredits > 0 && credits < state.maxCredits;
                    return (
                      <li
                        key={t.id}
                        className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">{t.name}</p>
                          {t.description ? (
                            <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                              {t.description}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          <button
                            type="button"
                            aria-label="Remove a credit"
                            disabled={busy || credits === 0}
                            onClick={() => void changeCredits(t.id, credits - 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-color)] text-white hover:bg-[var(--bg-secondary)] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-5 text-center text-lg font-bold text-[var(--accent-blue)]">
                            {credits}
                          </span>
                          <button
                            type="button"
                            aria-label="Add a credit"
                            disabled={busy || !canAdd}
                            onClick={() => void changeCredits(t.id, credits + 1)}
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--accent-blue)] bg-[var(--accent-blue)]/20 text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/30 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 text-center">
                <h3 className="text-lg font-semibold text-white">{reasonMessage(state).title}</h3>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{reasonMessage(state).body}</p>
              </div>

              {state.myVotes.length > 0 ? (
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
                  <p className="text-sm font-medium text-[var(--text-secondary)]">
                    Your votes{" "}
                    {state.phase === "round_2" || state.phase === "finished" ? "(locked)" : ""}
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-white">
                    {state.myVotes.map((v) => (
                      <li key={v.teamId} className="flex justify-between">
                        <span>Team #{v.teamId}</span>
                        <span className="font-semibold text-[var(--accent-blue)]">
                          {v.credits} credit{v.credits === 1 ? "" : "s"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
        </>
      )}
    </>
  );
}
