"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MOCK_CHART_DATA = [
  { date: "Mon", readiness: 42, fullMark: 100 },
  { date: "Tue", readiness: 58, fullMark: 100 },
  { date: "Wed", readiness: 65, fullMark: 100 },
  { date: "Thu", readiness: 72, fullMark: 100 },
  { date: "Fri", readiness: 78, fullMark: 100 },
  { date: "Sat", readiness: 85, fullMark: 100 },
  { date: "Sun", readiness: 90, fullMark: 100 },
];

export function DashboardAnalyticsChart() {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart
        data={MOCK_CHART_DATA}
        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="readinessGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--border-color)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          axisLine={{ stroke: "var(--border-color)" }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: "var(--text-muted)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${v}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            color: "var(--text-primary, white)",
          }}
          labelStyle={{ color: "var(--text-muted)" }}
          formatter={(value) => [value != null ? `${value}%` : " - ", "Readiness"]}
          labelFormatter={(label) => label}
        />
        <Area
          type="monotone"
          dataKey="readiness"
          stroke="var(--accent-blue)"
          strokeWidth={2}
          fill="url(#readinessGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
