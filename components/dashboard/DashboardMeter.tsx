"use client";

type DashboardMeterProps = {
  label: string;
  value: number;
  valueLabel: string;
  note: string;
  accent?: "blue" | "purple" | "green";
};

const accentClassMap = {
  blue: "from-[var(--accent-blue)] to-cyan-400",
  purple: "from-[var(--accent-purple)] to-fuchsia-400",
  green: "from-[var(--accent-green)] to-emerald-300",
};

export function DashboardMeter({
  label,
  value,
  valueLabel,
  note,
  accent = "blue",
}: DashboardMeterProps) {
  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)]/65 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-white">{label}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
            {valueLabel}
          </p>
        </div>
        <span className="text-sm font-semibold text-white">{Math.round(value)}%</span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/30">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${accentClassMap[accent]} transition-all duration-500`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>

      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{note}</p>
    </div>
  );
}
