"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";

type Question = {
  id: number;
  title: string;
  description: string | null;
  options: string[];
  correctIndex: number;
  sortOrder: number;
  createdAt: string;
};

export default function AdminScreeningQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/screening/questions", {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to load");
      setQuestions(json.data.questions ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchQuestions();
  }, [fetchQuestions]);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/dashboard/screening"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent-blue)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Screening
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-white">Logic quiz questions</h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          Configure up to five screening questions. Participants pick one option; the correct answer is set with{" "}
          <code className="text-xs">correctIndex</code>.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-8 text-center text-[var(--text-muted)]">
          Loading…
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] overflow-hidden">
          <ul className="divide-y divide-[var(--border-color)]">
            {questions.map((q) => (
              <li key={q.id} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-white">{q.title}</p>
                    {q.description && (
                      <p className="mt-1 text-sm text-[var(--text-muted)]">{q.description}</p>
                    )}
                    <ul className="mt-2 list-inside list-disc text-sm text-[var(--text-secondary)]">
                      {(q.options as string[]).map((opt, i) => (
                        <li key={i}>
                          {opt}
                          {i === q.correctIndex && (
                            <span className="ml-1 text-green-400">(correct)</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link
                      href={`/admin/dashboard/screening/questions/${q.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {questions.length < 5 && (
            <div className="border-t border-[var(--border-color)] p-4">
              <Link
                href="/admin/dashboard/screening/questions/new"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-blue)]/20 px-4 py-2 text-sm font-medium text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/30"
              >
                <Plus className="h-4 w-4" />
                Add question
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
