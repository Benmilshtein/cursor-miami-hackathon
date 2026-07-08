"use client";

import { useCallback, useEffect, useState } from "react";
import { Globe, Github, Check, ExternalLink } from "lucide-react";

type ProjectShape = { demoUrl: string | null; githubUrl: string | null } | null;

const norm = (v: string | null) => (v && v.trim() ? v.trim() : null);

/**
 * Inline dashboard section where a team submits its public app URL (stored in
 * project.demo_url) and GitHub URL (project.github_url). Open to any team
 * regardless of screening status; only the team lead can edit.
 */
export default function AppUrlSection({ isLead }: { isLead: boolean }) {
  const [appUrl, setAppUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [savedApp, setSavedApp] = useState<string | null>(null);
  const [savedGithub, setSavedGithub] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/projects/my", { credentials: "include" });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.success) {
        const project = (json.data?.project ?? null) as ProjectShape;
        setSavedApp(project?.demoUrl ?? null);
        setSavedGithub(norm(project?.githubUrl ?? null));
        setAppUrl(project?.demoUrl ?? "");
        setGithubUrl(project?.githubUrl ?? "");
      }
    } catch {
      // Soft-fail: leave fields empty/editable.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    setJustSaved(false);
    try {
      const res = await fetch("/api/projects/app-url", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appUrl: appUrl.trim() || null,
          githubUrl: githubUrl.trim() || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
      }
      const demoUrl = (json.data?.demoUrl ?? null) as string | null;
      const gh = (json.data?.githubUrl ?? null) as string | null;
      setSavedApp(demoUrl);
      setSavedGithub(norm(gh));
      setAppUrl(demoUrl ?? "");
      setGithubUrl(gh ?? "");
      setJustSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your links");
    } finally {
      setSaving(false);
    }
  }, [appUrl, githubUrl]);

  const dirty =
    norm(appUrl) !== (savedApp ?? null) || norm(githubUrl) !== (savedGithub ?? null);

  return (
    <>
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent-blue)]">
          Submission
        </p>
        <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">Your app</h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Share the public URL where anyone can open your app, plus your code repo.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5">
        {loading ? (
          <p className="text-sm text-[var(--text-muted)]">Loading…</p>
        ) : isLead ? (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)]">
                  Public app URL
                </label>
                <input
                  type="url"
                  inputMode="url"
                  placeholder="https://mycursorapp.com"
                  value={appUrl}
                  onChange={(e) => {
                    setAppUrl(e.target.value);
                    setJustSaved(false);
                  }}
                  className="mt-2 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-white placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)]">
                  GitHub URL
                </label>
                <input
                  type="url"
                  inputMode="url"
                  placeholder="https://github.com/your-team/your-repo"
                  value={githubUrl}
                  onChange={(e) => {
                    setGithubUrl(e.target.value);
                    setJustSaved(false);
                  }}
                  className="mt-2 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-white placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving || !dirty}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent-blue)]/20 px-5 py-2 text-sm font-medium text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {justSaved && !dirty ? <Check className="h-4 w-4" /> : null}
                {saving ? "Saving…" : justSaved && !dirty ? "Saved" : "Save"}
              </button>
              {savedApp ? (
                <a
                  href={savedApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-[var(--accent-blue)] hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open your app
                </a>
              ) : null}
            </div>
            {error ? (
              <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            ) : null}
          </>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />
              {savedApp ? (
                <a
                  href={savedApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-sm text-[var(--accent-blue)] hover:underline"
                >
                  {savedApp}
                </a>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">No app URL submitted yet.</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Github className="h-5 w-5 shrink-0 text-[var(--text-muted)]" />
              {savedGithub ? (
                <a
                  href={savedGithub}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-sm text-[var(--accent-blue)] hover:underline"
                >
                  {savedGithub}
                </a>
              ) : (
                <p className="text-sm text-[var(--text-muted)]">No GitHub URL submitted yet.</p>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)]">
              Only the team lead can submit these links.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
