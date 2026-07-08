"use client";

import { useLanguage } from "@/lib/LanguageContext";

const LANGS = ["en", "de", "es"] as const;

type LanguageSwitcherProps = {
  className?: string;
};

export function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage();

  return (
    <div
      className={`flex items-center rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] p-1 ${className}`}
      role="group"
      aria-label="Language"
    >
      {LANGS.map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => setLanguage(lang)}
          className={`rounded-full px-2 py-1 text-xs font-medium transition-colors sm:px-3 sm:text-sm ${
            language === lang
              ? "bg-[var(--accent-purple)] text-white"
              : "text-[var(--text-secondary)] hover:text-white"
          }`}
        >
          {lang.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
