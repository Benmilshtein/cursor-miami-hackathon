import { defineConfig } from "drizzle-kit";
import { existsSync, readFileSync } from "node:fs";

// Drizzle Kit doesn't auto-load `.env.local` (Next.js does at runtime).
// Read it manually so `npm run db:migrate` picks up the Supabase DIRECT_URL.
for (const path of [".env.local", ".env"]) {
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || process.env[m[1]] !== undefined) continue;
    let value = m[2];
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[m[1]] = value;
  }
}

export default defineConfig({
  dialect: "postgresql",
  schema: ["./db/schema/auth.ts", "./db/schema/teams.ts", "./db/schema/partners.ts", "./db/schema/screening.ts", "./db/schema/scoring.ts", "./db/schema/projects.ts", "./db/schema/settings.ts", "./db/schema/mentor.ts", "./db/schema/peer-voting.ts"],
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "postgresql://localhost:5432/hackathon",
  },
});
