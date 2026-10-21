# The Switched Sample

A browser-based forensic mystery where players solve linked puzzles, investigate evidence, identify the culprit, and compare local scores.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/switched-sample run dev` — run the game website
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

- The game is playable without an account or server-side data; a browser-local session stores progress and the top-three leaderboard.
- Puzzle answers and scoring are maintained in the frontend game-session module.

## Product

- Players solve a sign-language clue, Morse messages, a keyboard riddle, sample logic, a 4×4 Sudoku, evidence matching, and a final suspect decision.
- The game tracks mistakes, hints, elapsed time, and score, and keeps a local leaderboard on the same browser.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
