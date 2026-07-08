import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const screeningQuestion = pgTable(
  "screening_question",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    title: text("title").notNull(),
    description: text("description"),
    options: jsonb("options").$type<string[]>().notNull(),
    correctIndex: smallint("correct_index").notNull(),
    sortOrder: smallint("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [index("screening_question_sort_order_idx").on(t.sortOrder)]
);

export const screeningAnswer = pgTable(
  "screening_answer",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    questionId: integer("question_id")
      .notNull()
      .references(() => screeningQuestion.id, { onDelete: "cascade" }),
    selectedIndex: smallint("selected_index").notNull(),
    isCorrect: boolean("is_correct").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.questionId] }),
    index("screening_answer_question_idx").on(t.questionId),
  ]
);
