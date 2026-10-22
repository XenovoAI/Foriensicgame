import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const investigatorScoresTable = pgTable("investigator_scores", {
  attemptId: uuid("attempt_id").primaryKey(),
  playerName: text("player_name").notNull(),
  score: integer("score").notNull(),
  elapsedSeconds: integer("elapsed_seconds").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type InvestigatorScore = typeof investigatorScoresTable.$inferSelect;
export type NewInvestigatorScore = typeof investigatorScoresTable.$inferInsert;
