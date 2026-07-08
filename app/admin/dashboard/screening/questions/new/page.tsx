"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewScreeningQuestionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState(["", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addOption = () => setOptions((o) => [...o, ""]);
  const setOption = (i: number, v: string) =>
    setOptions((o) => {
      const next = [...o];
      next[i] = v;
      return next;
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const opts = options.map((s) => s.trim()).filter(Boolean);
    if (!title.trim()) {
      setError("Enter a title.");
      return;
    }
    if (opts.length < 2) {
      setError("At least two answer options are required.");
      return;
    }
    if (correctIndex < 0 || correctIndex >= opts.length) {
      setError("Choose a valid index for the correct answer.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/screening/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          options: opts,
          correctIndex,
          sortOrder: 0,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? "Failed to create");
      router.push("/admin/dashboard/screening/questions");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href="/admin/dashboard/screening/questions"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent-blue)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Questions
      </Link>
      <h1 className="text-2xl font-bold text-white">New question</h1>
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-white focus:border-[var(--accent-blue)] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-white focus:border-[var(--accent-blue)] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Answer options</label>
          {options.map((opt, i) => (
            <input
              key={i}
              type="text"
              value={opt}
              onChange={(e) => setOption(i, e.target.value)}
              placeholder={`Option ${i + 1}`}
              className="mb-2 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-white placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:outline-none"
            />
          ))}
          <button
            type="button"
            onClick={addOption}
            className="text-sm text-[var(--accent-blue)] hover:underline"
          >
            + Add option
          </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Correct answer index (0-based)</label>
          <input
            type="number"
            min={0}
            max={Math.max(0, options.length - 1)}
            value={correctIndex}
            onChange={(e) => setCorrectIndex(parseInt(e.target.value, 10) || 0)}
            className="w-24 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-white focus:border-[var(--accent-blue)] focus:outline-none"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-[var(--accent-blue)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--accent-blue)]/90 disabled:opacity-50"
          >
            {submitting ? "Creating…" : "Create"}
          </button>
          <Link
            href="/admin/dashboard/screening/questions"
            className="rounded-lg border border-[var(--border-color)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
