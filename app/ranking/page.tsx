"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Award, BarChart3, Lock, Users } from "lucide-react";
import { Logo, NoiseOverlay } from "@/components/ui";

type CrowdRow = {
  teamId: number;
  teamName: string;
  totalCredits: number;
  uniqueVoters: number;
  rank: number;
};

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-6 w-6 text-amber-400" />;
  if (rank === 2) return <Medal className="h-6 w-6 text-gray-300" />;
  if (rank === 3) return <Award className="h-6 w-6 text-orange-400" />;
  return <span className="text-sm font-bold text-[var(--text-muted)]">{rank}</span>;
}

function getRankBorder(rank: number) {
  if (rank === 1) return "border-amber-400/40 bg-amber-400/5";
  if (rank === 2) return "border-gray-300/30 bg-gray-300/5";
  if (rank === 3) return "border-orange-400/30 bg-orange-400/5";
  return "border-[var(--border-color)] bg-[var(--card-bg)]";
}

export default function RankingPage() {
  const [leaderboard, setLeaderboard] = useState<CrowdRow[]>([]);
  const [finalized, setFinalized] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const es = new EventSource("/api/ranking/stream");

    es.onopen = () => setConnected(true);
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && Array.isArray(data.leaderboard)) {
          setLeaderboard(
            data.leaderboard.map(
              (r: Record<string, unknown>) =>
                ({
                  teamId: Number(r.teamId),
                  teamName: String(r.teamName ?? ""),
                  totalCredits: Number(r.totalCredits ?? 0),
                  uniqueVoters: Number(r.uniqueVoters ?? 0),
                  rank: Number(r.rank ?? 0),
                }) satisfies CrowdRow,
            ),
          );
          if (typeof data.finalized === "boolean") setFinalized(data.finalized);
        }
      } catch {
        /* ignore parse errors */
      }
    };
    es.onerror = () => {
      setConnected(false);
    };

    return () => {
      es.close();
    };
  }, []);

  return (
    <>
      <NoiseOverlay />
      <div className="min-h-screen bg-[var(--bg-primary)] px-4 py-8 md:py-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="group flex items-center gap-3">
                <Logo size={36} />
                <span className="font-bold text-white hidden sm:block">48H</span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              {finalized && (
                <div className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Lock className="h-3 w-3" />
                  Final
                </div>
              )}
              <div
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
                  connected
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`}
                />
                {connected ? "Live" : "Reconnecting…"}
              </div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Crowd vote results</h1>
            <p className="text-[var(--text-secondary)] text-sm md:text-base">
              {finalized
                ? "Ranked by Launch Credits from the peer expo. Ties broken by reach (unique voters)."
                : "Results will be published by the organizers when ready."}
            </p>
          </motion.div>

          {!finalized ? (
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-12 text-center">
              <Lock className="mx-auto mb-4 h-10 w-10 text-[var(--text-muted)]" />
              <p className="text-[var(--text-secondary)]">Results not published yet</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                The leaderboard will be available after organizers publish it
              </p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-12 text-center">
              <BarChart3 className="mx-auto mb-4 h-10 w-10 text-[var(--text-muted)]" />
              <p className="text-[var(--text-secondary)]">No votes yet</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Teams will appear here once the crowd starts voting
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {leaderboard.map((team) => {
                  const rank = team.rank;
                  return (
                    <motion.div
                      key={team.teamId}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className={`rounded-xl border p-4 md:p-5 transition-colors ${getRankBorder(rank)}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/5">
                          {getRankIcon(rank)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3
                            className={`font-semibold truncate ${rank <= 3 ? "text-white" : "text-[var(--text-secondary)]"}`}
                          >
                            {team.teamName}
                          </h3>
                          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                            <Users className="h-3.5 w-3.5" />
                            <span className="tabular-nums">{team.uniqueVoters}</span>
                            <span>{team.uniqueVoters === 1 ? "voter" : "voters"}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <div
                            className={`text-2xl font-bold tabular-nums ${rank <= 3 ? "text-white" : "text-[var(--text-secondary)]"}`}
                          >
                            {team.totalCredits}
                          </div>
                          <div className="text-xs text-[var(--text-muted)]">
                            {team.totalCredits === 1 ? "credit" : "credits"}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
