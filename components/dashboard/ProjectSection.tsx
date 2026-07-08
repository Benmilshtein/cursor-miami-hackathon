"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ExternalLink,
  FolderGit2,
  Github,
  Globe,
  Layers,
  Pencil,
  Play,
  Presentation,
  Save,
} from "lucide-react";
import { Button, SpotlightCard } from "@/components/ui";
import { useLanguage } from "@/lib/LanguageContext";

const PROJECT_COPY = {
  en: {
    eyebrow: "PROJECT",
    title: "Hackathon Project",
    edit: "Edit",
    deadlineLabel: "Submission deadline",
    deadlinePassed: "Submission deadline passed",
    nameLabel: "Project name *",
    namePlaceholder: "My Awesome AI Tool",
    descriptionLabel: "Description",
    descriptionPlaceholder: "What does your project do?",
    githubLabel: "GitHub URL *",
    demoLabel: "Demo URL",
    techStackLabel: "Tech Stack",
    techStackPlaceholder: "Next.js, Python, OpenAI",
    slidesLabel: "Slides URL",
    videoLabel: "Video URL",
    saving: "Saving…",
    update: "Update project",
    submit: "Submit project",
    cancel: "Cancel",
    submitted: "Project submitted!",
    updated: "Project updated!",
    loadError: "Failed to load project.",
    saveError: "Failed to save project.",
    deadlinePassedMsg: "The submission deadline has passed.",
    noSubmission: "No project submitted yet.",
    leadOnly: "Only the team lead can submit the project.",
  },
  de: {
    eyebrow: "PROJECT",
    title: "Hackathon Project",
    edit: "Edit",
    deadlineLabel: "Submission deadline",
    deadlinePassed: "Submission deadline passed",
    nameLabel: "Project name *",
    namePlaceholder: "My Awesome AI Tool",
    descriptionLabel: "Description",
    descriptionPlaceholder: "What does your project do?",
    githubLabel: "GitHub URL *",
    demoLabel: "Demo URL",
    techStackLabel: "Tech Stack",
    techStackPlaceholder: "Next.js, Python, OpenAI",
    slidesLabel: "Slides URL",
    videoLabel: "Video URL",
    saving: "Saving…",
    update: "Update project",
    submit: "Submit project",
    cancel: "Cancel",
    submitted: "Project submitted!",
    updated: "Project updated!",
    loadError: "Failed to load project.",
    saveError: "Failed to save project.",
    deadlinePassedMsg: "The submission deadline has passed.",
    noSubmission: "No project submitted yet.",
    leadOnly: "Only the team lead can submit the project.",
  },
  es: {
    eyebrow: "PROJECT",
    title: "Hackathon Project",
    edit: "Edit",
    deadlineLabel: "Submission deadline",
    deadlinePassed: "Submission deadline passed",
    nameLabel: "Project name *",
    namePlaceholder: "My Awesome AI Tool",
    descriptionLabel: "Description",
    descriptionPlaceholder: "What does your project do?",
    githubLabel: "GitHub URL *",
    demoLabel: "Demo URL",
    techStackLabel: "Tech Stack",
    techStackPlaceholder: "Next.js, Python, OpenAI",
    slidesLabel: "Slides URL",
    videoLabel: "Video URL",
    saving: "Saving…",
    update: "Update project",
    submit: "Submit project",
    cancel: "Cancel",
    submitted: "Project submitted!",
    updated: "Project updated!",
    loadError: "Failed to load project.",
    saveError: "Failed to save project.",
    deadlinePassedMsg: "The submission deadline has passed.",
    noSubmission: "No project submitted yet.",
    leadOnly: "Only the team lead can submit the project.",
  },
} as const;

type ProjectData = {
  id: string;
  teamId: number;
  name: string;
  description: string | null;
  githubUrl: string;
  demoUrl: string | null;
  techStack: string | null;
  slidesUrl: string | null;
  videoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  isTeamLead: boolean;
  teamApproved: boolean;
};

type FormFields = {
  name: string;
  description: string;
  githubUrl: string;
  demoUrl: string;
  techStack: string;
  slidesUrl: string;
  videoUrl: string;
};

const EMPTY_FORM: FormFields = {
  name: "",
  description: "",
  githubUrl: "",
  demoUrl: "",
  techStack: "",
  slidesUrl: "",
  videoUrl: "",
};

function projectToForm(p: ProjectData): FormFields {
  return {
    name: p.name,
    description: p.description ?? "",
    githubUrl: p.githubUrl,
    demoUrl: p.demoUrl ?? "",
    techStack: p.techStack ?? "",
    slidesUrl: p.slidesUrl ?? "",
    videoUrl: p.videoUrl ?? "",
  };
}

export function ProjectSection({ isTeamLead, teamApproved }: Props) {
  const { language } = useLanguage();
  const copy = PROJECT_COPY[language];
  const [project, setProject] = useState<ProjectData | null>(null);
  const [deadline, setDeadline] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState<FormFields>(EMPTY_FORM);

  const deadlinePassed = deadline ? new Date(deadline).getTime() < Date.now() : false;

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const loadProject = useCallback(async () => {
    try {
      const res = await fetch("/api/projects/my", { credentials: "include" });
      const json = await res.json();
      if (json.success && json.data) {
        setProject(json.data.project ?? null);
        setDeadline(json.data.deadline ?? null);
        if (json.data.project) {
          setForm(projectToForm(json.data.project));
        }
      }
    } catch {
      setError(copy.loadError);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  function updateField(field: keyof FormFields, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const isNew = !project;
    const method = isNew ? "POST" : "PATCH";
    const body: Record<string, string | null> = {
      name: form.name.trim(),
      githubUrl: form.githubUrl.trim(),
      description: form.description.trim() || null,
      demoUrl: form.demoUrl.trim() || null,
      techStack: form.techStack.trim() || null,
      slidesUrl: form.slidesUrl.trim() || null,
      videoUrl: form.videoUrl.trim() || null,
    };

    try {
      const res = await fetch("/api/projects/my", {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error?.message ?? "Failed to save project.");
      }
      setProject(json.data);
      setForm(projectToForm(json.data));
      setEditing(false);
      setNotice(isNew ? copy.submitted : copy.updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.saveError);
    } finally {
      setSubmitting(false);
    }
  }

  if (!teamApproved) return null;

  if (loading) {
    return (
      <div>
        <div className="mb-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent-blue)]">
            {copy.eyebrow}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
            {copy.title}
          </h2>
        </div>
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 p-8">
          <div className="h-6 w-48 animate-pulse rounded bg-white/10" />
          <div className="mt-3 h-4 w-72 animate-pulse rounded bg-white/5" />
        </div>
      </div>
    );
  }

  const showForm = isTeamLead && (editing || !project) && !deadlinePassed;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent-blue)]">
            {copy.eyebrow}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">
            {copy.title}
          </h2>
        </div>
        {project && isTeamLead && !editing && !deadlinePassed && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-lg"
            onClick={() => setEditing(true)}
          >
            <Pencil size={14} />
            {copy.edit}
          </Button>
        )}
      </div>

      {deadline && (
        <p className={`mb-4 text-sm ${deadlinePassed ? "text-red-300" : "text-[var(--text-secondary)]"}`}>
          {deadlinePassed ? copy.deadlinePassed : copy.deadlineLabel}:{" "}
          {new Date(deadline).toLocaleString(undefined, { timeZone: "UTC" })}
          {" "}(GMT+5)
        </p>
      )}

      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          <span className="h-2 w-2 shrink-0 rounded-full bg-red-400" />
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
          {notice}
        </div>
      )}

      {showForm ? (
        <SpotlightCard className="p-5 sm:p-6" spotlightColor="rgba(255, 45, 146,0.12)">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                {copy.nameLabel}
              </span>
              <input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
                className="h-11 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 text-white outline-none transition-colors focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]/30"
                placeholder={copy.namePlaceholder}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                {copy.descriptionLabel}
              </span>
              <textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-white outline-none transition-colors focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]/30"
                placeholder={copy.descriptionPlaceholder}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                {copy.githubLabel}
              </span>
              <input
                type="url"
                value={form.githubUrl}
                onChange={(e) => updateField("githubUrl", e.target.value)}
                required
                className="h-11 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 text-white outline-none transition-colors focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]/30"
                placeholder="https://github.com/team/project"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  {copy.demoLabel}
                </span>
                <input
                  type="url"
                  value={form.demoUrl}
                  onChange={(e) => updateField("demoUrl", e.target.value)}
                  className="h-11 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 text-white outline-none transition-colors focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]/30"
                  placeholder="https://demo.example.com"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  {copy.techStackLabel}
                </span>
                <input
                  value={form.techStack}
                  onChange={(e) => updateField("techStack", e.target.value)}
                  className="h-11 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 text-white outline-none transition-colors focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]/30"
                  placeholder={copy.techStackPlaceholder}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  {copy.slidesLabel}
                </span>
                <input
                  type="url"
                  value={form.slidesUrl}
                  onChange={(e) => updateField("slidesUrl", e.target.value)}
                  className="h-11 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 text-white outline-none transition-colors focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]/30"
                  placeholder="https://slides.example.com"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">
                  {copy.videoLabel}
                </span>
                <input
                  type="url"
                  value={form.videoUrl}
                  onChange={(e) => updateField("videoUrl", e.target.value)}
                  className="h-11 w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 text-white outline-none transition-colors focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)]/30"
                  placeholder="https://youtu.be/..."
                />
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                size="md"
                className="rounded-lg"
                disabled={submitting || !form.name.trim() || !form.githubUrl.trim()}
              >
                <Save size={16} />
                {submitting
                  ? copy.saving
                  : project
                    ? copy.update
                    : copy.submit}
              </Button>
              {project && (
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  className="rounded-lg"
                  onClick={() => {
                    setForm(projectToForm(project));
                    setEditing(false);
                    setError(null);
                  }}
                >
                  {copy.cancel}
                </Button>
              )}
            </div>
          </form>
        </SpotlightCard>
      ) : project ? (
        <SpotlightCard className="p-5 sm:p-6" spotlightColor="rgba(255, 45, 146,0.12)">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]">
                <FolderGit2 size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                {project.description && (
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {project.description}
                  </p>
                )}
              </div>
            </div>

            {project.techStack && (
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Layers size={14} className="shrink-0 text-[var(--text-muted)]" />
                {project.techStack}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {project.githubUrl?.trim() && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]/60 px-3 py-2 text-sm text-white hover:bg-[var(--bg-secondary)]"
                >
                  <Github size={14} />
                  GitHub
                  <ExternalLink size={12} className="text-[var(--text-muted)]" />
                </a>
              )}
              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]/60 px-3 py-2 text-sm text-white hover:bg-[var(--bg-secondary)]"
                >
                  <Globe size={14} />
                  Demo
                  <ExternalLink size={12} className="text-[var(--text-muted)]" />
                </a>
              )}
              {project.slidesUrl && (
                <a
                  href={project.slidesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]/60 px-3 py-2 text-sm text-white hover:bg-[var(--bg-secondary)]"
                >
                  <Presentation size={14} />
                  Slides
                  <ExternalLink size={12} className="text-[var(--text-muted)]" />
                </a>
              )}
              {project.videoUrl && (
                <a
                  href={project.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]/60 px-3 py-2 text-sm text-white hover:bg-[var(--bg-secondary)]"
                >
                  <Play size={14} />
                  Video
                  <ExternalLink size={12} className="text-[var(--text-muted)]" />
                </a>
              )}
            </div>
          </div>
        </SpotlightCard>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-secondary)]/40 p-6 text-center">
          <FolderGit2 size={32} className="mx-auto text-[var(--text-muted)]" />
          <p className="mt-3 text-sm text-[var(--text-secondary)]">
            {isTeamLead
              ? deadlinePassed
                ? copy.deadlinePassedMsg
                : copy.noSubmission
              : copy.leadOnly}
          </p>
        </div>
      )}
    </div>
  );
}
