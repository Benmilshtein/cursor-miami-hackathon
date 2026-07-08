"use client";

import { Copy } from "lucide-react";
import { useState } from "react";

export function CopyLinkButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--accent-blue)]/50 bg-[var(--accent-blue)]/10 px-4 py-3 text-sm font-medium text-[var(--accent-blue)] hover:bg-[var(--accent-blue)]/20 transition-colors"
    >
      <Copy className="h-4 w-4" />
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}
