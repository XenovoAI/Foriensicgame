import { desc, asc } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  GetInvestigatorLeaderboardResponse,
  SubmitInvestigatorScoreBody,
  SubmitInvestigatorScoreResponse,
} from "@workspace/api-zod";
import { db, investigatorScoresTable } from "@workspace/db";

const router: IRouter = Router();

async function readTopScores() {
  const rows = await db
    .select({
      playerName: investigatorScoresTable.playerName,
      score: investigatorScoresTable.score,
      elapsedSeconds: investigatorScoresTable.elapsedSeconds,
      correctAnswers: investigatorScoresTable.correctAnswers,
      createdAt: investigatorScoresTable.createdAt,
    })
    .from(investigatorScoresTable)
    .orderBy(
      desc(investigatorScoresTable.score),
      asc(investigatorScoresTable.elapsedSeconds),
      asc(investigatorScoresTable.createdAt),
    )
    .limit(3);

  return GetInvestigatorLeaderboardResponse.parse(
    rows.map(({ playerName, score, elapsedSeconds, correctAnswers }) => ({
      playerName,
      score,
      elapsedSeconds,
      correctAnswers,
    })),
  );
}

router.get("/leaderboard", async (_req, res): Promise<void> => {
  res.json(SubmitInvestigatorScoreResponse.parse(await readTopScores()));
});

router.post("/leaderboard", async (req, res): Promise<void> => {
  const parsed = SubmitInvestigatorScoreBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.playerName.trim()) {
    res.status(400).json({ error: "Provide a valid completed case score." });
    return;
  }

  const score = {
    ...parsed.data,
    playerName: parsed.data.playerName.trim(),
  };

  await db
    .insert(investigatorScoresTable)
    .values(score)
    .onConflictDoNothing({ target: investigatorScoresTable.attemptId });

  res.json(await readTopScores());
});

export default router;
