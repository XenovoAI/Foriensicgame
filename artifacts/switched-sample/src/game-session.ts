import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getInvestigatorLeaderboard,
  submitInvestigatorScore,
} from '@workspace/api-client-react';

export type GameStage =
  | 'welcome'
  | 'door'
  | 'sample'
  | 'sudoku'
  | 'evidence'
  | 'message'
  | 'final'
  | 'solved';

export type PuzzleId =
  | 'sign'
  | 'door-morse'
  | 'keyboard'
  | 'sample'
  | 'sudoku'
  | 'evidence'
  | 'message';

export interface LeaderboardEntry {
  playerName: string;
  score: number;
  elapsedSeconds: number;
  correctAnswers: number;
}

interface GameFeedback {
  type: 'success' | 'error' | 'hint';
  message: string;
}

interface Session {
  stage: GameStage;
  playerName: string;
  attemptId: string | null;
  startedAt: number | null;
  finishedSeconds: number | null;
  mistakes: number;
  hintsUsed: number;
  solvedPuzzles: PuzzleId[];
  finalScore: number | null;
  feedback: GameFeedback | null;
}

interface PersistedGame {
  session: Session;
  leaderboard: LeaderboardEntry[];
}

const STORAGE_KEY = 'switched-sample-game-v1';
const PUZZLES: PuzzleId[] = [
  'sign',
  'door-morse',
  'keyboard',
  'sample',
  'sudoku',
  'evidence',
  'message',
];

const HINTS: Record<PuzzleId, string> = {
  sign: 'The hand shapes spell C, L, U, E from left to right.',
  'door-morse': 'The first group, ---, is the letter O. Use the Morse reference to decode the rest.',
  keyboard: 'Think of the long key at the bottom of a keyboard that creates a gap between words.',
  sample: 'Start with the collection time. Only one tube was collected at 09:15.',
  sudoku: 'Each row, column, and 2 × 2 box must contain 1, 2, 3, and 4 exactly once.',
  evidence: 'Use the three lab notes to match each trace to one reference profile.',
  message: 'Each group between the slashes is one letter. The first group, -.-, is the letter K.',
};

const createSession = (): Session => ({
  stage: 'welcome',
  playerName: '',
  attemptId: null,
  startedAt: null,
  finishedSeconds: null,
  mistakes: 0,
  hintsUsed: 0,
  solvedPuzzles: [],
  finalScore: null,
  feedback: null,
});

const createInitialGame = (): PersistedGame => ({
  session: createSession(),
  leaderboard: [],
});

function isPuzzleId(value: unknown): value is PuzzleId {
  return typeof value === 'string' && PUZZLES.includes(value as PuzzleId);
}

function isGameStage(value: unknown): value is GameStage {
  return (
    value === 'welcome' ||
    value === 'door' ||
    value === 'sample' ||
    value === 'sudoku' ||
    value === 'evidence' ||
    value === 'message' ||
    value === 'final' ||
    value === 'solved'
  );
}

function readGame(): PersistedGame {
  if (typeof window === 'undefined') return createInitialGame();

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return createInitialGame();

    const parsed = JSON.parse(stored) as Partial<PersistedGame>;
    const rawSession = parsed.session as Partial<Session> | undefined;
    const rawLeaderboard = Array.isArray(parsed.leaderboard)
      ? parsed.leaderboard
      : [];

    const leaderboard = rawLeaderboard
      .filter(
        (entry): entry is LeaderboardEntry =>
          typeof entry?.playerName === 'string' &&
          typeof entry?.score === 'number' &&
          typeof entry?.elapsedSeconds === 'number' &&
          typeof entry?.correctAnswers === 'number',
      )
      .slice(0, 3);

    if (!rawSession || !isGameStage(rawSession.stage)) {
      return { ...createInitialGame(), leaderboard };
    }

    const solvedPuzzles = Array.isArray(rawSession.solvedPuzzles)
      ? rawSession.solvedPuzzles.filter(isPuzzleId)
      : [];

    return {
      leaderboard,
      session: {
        ...createSession(),
        ...rawSession,
        stage: rawSession.stage,
        playerName:
          typeof rawSession.playerName === 'string'
            ? rawSession.playerName
            : '',
        attemptId:
          typeof rawSession.attemptId === 'string'
            ? rawSession.attemptId
            : null,
        startedAt:
          typeof rawSession.startedAt === 'number'
            ? rawSession.startedAt
            : null,
        finishedSeconds:
          typeof rawSession.finishedSeconds === 'number'
            ? rawSession.finishedSeconds
            : null,
        mistakes:
          typeof rawSession.mistakes === 'number' ? rawSession.mistakes : 0,
        hintsUsed:
          typeof rawSession.hintsUsed === 'number' ? rawSession.hintsUsed : 0,
        solvedPuzzles,
        finalScore:
          typeof rawSession.finalScore === 'number'
            ? rawSession.finalScore
            : null,
        feedback: null,
      },
    };
  } catch {
    return createInitialGame();
  }
}

function normalizeAnswer(answer: string): string {
  return answer.trim().toUpperCase();
}

function isCorrectAnswer(puzzleId: PuzzleId, answer: string): boolean {
  const normalized = normalizeAnswer(answer);

  switch (puzzleId) {
    case 'sign':
      return normalized.replace(/\s/g, '') === 'CLUE';
    case 'door-morse':
      return normalized === 'OPEN';
    case 'keyboard':
      return normalized === 'SPACE' || normalized === 'SPACEBAR';
    case 'sample':
      return normalized === 'B' || normalized === 'TUBE B';
    case 'sudoku':
      return normalized.replace(/\D/g, '') === '1234341221434321';
    case 'evidence':
      return normalized.replace(/\s/g, '') === 'RIYA,KABIR,SANA';
    case 'message':
      return normalized === 'KABIR';
  }
}

function stageAfterPuzzle(puzzleId: PuzzleId): GameStage {
  switch (puzzleId) {
    case 'sample':
      return 'sudoku';
    case 'sudoku':
      return 'evidence';
    case 'evidence':
      return 'message';
    case 'message':
      return 'final';
    default:
      return 'door';
  }
}

function scoreFor(mistakes: number, hintsUsed: number, elapsedSeconds: number) {
  return Math.max(
    100,
    1200 -
      mistakes * 75 -
      hintsUsed * 100 -
      Math.floor(elapsedSeconds / 15) * 8,
  );
}

export function useGameSession() {
  const [game, setGame] = useState<PersistedGame>(readGame);
  const gameRef = useRef(game);
  const [clock, setClock] = useState(() => Date.now());
  const [sharedLeaderboard, setSharedLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [sharedStatus, setSharedStatus] = useState<'loading' | 'shared' | 'local'>('loading');
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'shared' | 'error'>('idle');

  const updateGame = useCallback((change: (current: PersistedGame) => PersistedGame) => {
    const updated = change(gameRef.current);
    gameRef.current = updated;
    setGame(updated);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // The current session remains playable if browser storage is unavailable.
    }
    return updated;
  }, []);

  const refreshSharedLeaderboard = useCallback(async () => {
    try {
      const entries = await getInvestigatorLeaderboard();
      setSharedLeaderboard(entries);
      setSharedStatus('shared');
      setLeaderboardError(null);
    } catch {
      setSharedLeaderboard(null);
      setSharedStatus('local');
      setLeaderboardError(
        'Shared records are unavailable. Showing results saved on this device.',
      );
    }
  }, []);

  const submitCompletedScore = useCallback(async () => {
    const completed = gameRef.current.session;
    if (
      completed.stage !== 'solved' ||
      !completed.attemptId ||
      completed.finalScore === null ||
      completed.finishedSeconds === null
    ) {
      return;
    }

    setSubmissionStatus('submitting');
    try {
      const entries = await submitInvestigatorScore({
        attemptId: completed.attemptId,
        playerName: completed.playerName,
        score: completed.finalScore,
        elapsedSeconds: completed.finishedSeconds,
        correctAnswers: completed.solvedPuzzles.length + 1,
      });
      setSharedLeaderboard(entries);
      setSharedStatus('shared');
      setLeaderboardError(null);
      setSubmissionStatus('shared');
    } catch {
      setSharedLeaderboard(null);
      setSharedStatus('local');
      setLeaderboardError(
        'This completed score is saved on this device, but could not be shared.',
      );
      setSubmissionStatus('error');
    }
  }, []);

  useEffect(() => {
    void refreshSharedLeaderboard();
  }, [refreshSharedLeaderboard]);

  useEffect(() => {
    if (game.session.stage === 'solved') {
      void submitCompletedScore();
    } else {
      setSubmissionStatus('idle');
    }
  }, [
    game.session.stage,
    game.session.attemptId,
    game.session.playerName,
    game.session.finalScore,
    game.session.finishedSeconds,
    game.session.solvedPuzzles.length,
    submitCompletedScore,
  ]);

  useEffect(() => {
    if (game.session.stage === 'welcome' || game.session.stage === 'solved') return;
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [game.session.stage]);

  const start = useCallback(
    (name: string) => {
      const playerName = name.trim().slice(0, 24);
      if (!playerName) return;

      updateGame((current) => ({
        leaderboard: current.leaderboard,
        session: {
          ...createSession(),
          stage: 'door',
          playerName,
          attemptId: window.crypto.randomUUID(),
          startedAt: Date.now(),
          feedback: { type: 'success', message: 'Investigation started.' },
        },
      }));
      setClock(Date.now());
    },
    [updateGame],
  );

  const submit = useCallback(
    (puzzleId: PuzzleId, answer: string): boolean => {
      let accepted = false;

      updateGame((current) => {
        const session = current.session;
        if (session.stage === 'welcome' || session.stage === 'solved') {
          return current;
        }

        const isDoorPuzzle =
          puzzleId === 'sign' ||
          puzzleId === 'door-morse' ||
          puzzleId === 'keyboard';
        if (isDoorPuzzle && session.stage !== 'door') return current;
        if (!isDoorPuzzle && puzzleId !== session.stage) return current;
        if (session.solvedPuzzles.includes(puzzleId)) return current;

        if (!isCorrectAnswer(puzzleId, answer)) {
          return {
            ...current,
            session: {
              ...session,
              mistakes: session.mistakes + 1,
              feedback: {
                type: 'error',
                message: 'Not quite. Review the evidence and try again.',
              },
            },
          };
        }

        accepted = true;
        const solvedPuzzles = [...session.solvedPuzzles, puzzleId];
        const allDoorPuzzlesSolved = ['sign', 'door-morse', 'keyboard'].every(
          (id) => solvedPuzzles.includes(id as PuzzleId),
        );
        const nextStage = isDoorPuzzle
          ? allDoorPuzzlesSolved
            ? 'sample'
            : 'door'
          : stageAfterPuzzle(puzzleId);

        return {
          ...current,
          session: {
            ...session,
            solvedPuzzles,
            stage: nextStage,
            feedback: {
              type: 'success',
              message:
                nextStage === 'sample'
                  ? 'All checks passed. The lab door is open.'
                  : 'Evidence recorded. Move to the next stage.',
            },
          },
        };
      });

      return accepted;
    },
    [updateGame],
  );

  const requestHint = useCallback(
    (puzzleId: PuzzleId): string => {
      const message = HINTS[puzzleId];
      updateGame((current) => {
        if (
          current.session.stage === 'welcome' ||
          current.session.stage === 'solved' ||
          current.session.solvedPuzzles.includes(puzzleId)
        ) {
          return current;
        }
        const isDoorPuzzle =
          puzzleId === 'sign' ||
          puzzleId === 'door-morse' ||
          puzzleId === 'keyboard';
        if (isDoorPuzzle && current.session.stage !== 'door') return current;
        if (!isDoorPuzzle && puzzleId !== current.session.stage) return current;

        return {
          ...current,
          session: {
            ...current.session,
            hintsUsed: current.session.hintsUsed + 1,
            feedback: { type: 'hint', message },
          },
        };
      });
      return message;
    },
    [updateGame],
  );

  const chooseSuspect = useCallback(
    (name: string): boolean => {
      let accepted = false;
      updateGame((current) => {
        const session = current.session;
        if (session.stage !== 'final') return current;

        if (name.trim().toUpperCase() !== 'KABIR') {
          return {
            ...current,
            session: {
              ...session,
              mistakes: session.mistakes + 1,
              feedback: {
                type: 'error',
                message:
                  'That conclusion does not fit every clue. Reconsider the timeline and evidence.',
              },
            },
          };
        }

        accepted = true;
        const finishedSeconds = Math.max(
          0,
          Math.floor((Date.now() - (session.startedAt ?? Date.now())) / 1000),
        );
        const finalScore = scoreFor(
          session.mistakes,
          session.hintsUsed,
          finishedSeconds,
        );
        const entry: LeaderboardEntry = {
          playerName: session.playerName,
          score: finalScore,
          elapsedSeconds: finishedSeconds,
          correctAnswers: session.solvedPuzzles.length + 1,
        };
        const leaderboard = [...current.leaderboard, entry]
          .sort(
            (a, b) =>
              b.score - a.score || a.elapsedSeconds - b.elapsedSeconds,
          )
          .slice(0, 3);

        return {
          leaderboard,
          session: {
            ...session,
            stage: 'solved',
            finishedSeconds,
            finalScore,
            feedback: {
              type: 'success',
              message: 'Case solved. The evidence identifies Kabir.',
            },
          },
        };
      });
      return accepted;
    },
    [updateGame],
  );

  const clearFeedback = useCallback(() => {
    updateGame((current) => ({
      ...current,
      session: { ...current.session, feedback: null },
    }));
  }, [updateGame]);

  const restart = useCallback(() => {
    updateGame((current) => ({
      ...createInitialGame(),
      leaderboard: current.leaderboard,
    }));
  }, [updateGame]);

  const session = game.session;
  const elapsedSeconds =
    session.finishedSeconds ??
    (session.startedAt === null
      ? 0
      : Math.max(0, Math.floor((clock - session.startedAt) / 1000)));
  const score =
    session.finalScore ??
    (session.startedAt === null
      ? 0
      : scoreFor(session.mistakes, session.hintsUsed, elapsedSeconds));

  return {
    stage: session.stage,
    playerName: session.playerName,
    elapsedSeconds,
    score,
    mistakes: session.mistakes,
    hintsUsed: session.hintsUsed,
    solvedPuzzles: session.solvedPuzzles,
    leaderboard: game.leaderboard,
    sharedLeaderboard: sharedLeaderboard ?? [],
    leaderboardSource:
      sharedStatus === 'shared' ? ('shared' as const) : ('local' as const),
    leaderboardLoading: sharedStatus === 'loading',
    leaderboardError,
    submissionStatus,
    feedback: session.feedback,
    correctAnswers: session.solvedPuzzles.length + (session.stage === 'solved' ? 1 : 0),
    start,
    submit,
    chooseSuspect,
    requestHint,
    clearFeedback,
    restart,
    refreshSharedLeaderboard,
    retryScoreSubmission: submitCompletedScore,
  };
}
