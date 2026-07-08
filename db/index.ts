import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as authSchema from "./schema/auth";
import * as relationsSchema from "./schema/relations";
import * as teamsSchema from "./schema/teams";
import * as partnersSchema from "./schema/partners";
import * as screeningSchema from "./schema/screening";
import * as scoringSchema from "./schema/scoring";
import * as projectsSchema from "./schema/projects";
import * as settingsSchema from "./schema/settings";
import * as mentorSchema from "./schema/mentor";
import * as peerVotingSchema from "./schema/peer-voting";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://localhost:5432/hackathon";
// `prepare: false` is required for the Supabase transaction pooler (PgBouncer,
// port 6543) used in serverless/production; prepared statements break there.
const client = postgres(connectionString, {
  max: 10,
  ssl: "require",
  prepare: false,
});
export const db = drizzle(client, {
  schema: {
    ...authSchema,
    ...teamsSchema,
    ...partnersSchema,
    ...screeningSchema,
    ...scoringSchema,
    ...projectsSchema,
    ...settingsSchema,
    ...mentorSchema,
    ...peerVotingSchema,
    ...relationsSchema,
  },
});

export type Database = typeof db;
