# CLAUDE.md

Developer guide for AI agents working in this monorepo.

## Repo layout

```
optcg-sim/
├── apps/
│   ├── web/            Next.js 16 client app (@optcg/web)
│   └── game-server/    (future) WebSocket game server — sole writer of live match state
├── packages/
│   ├── engine/         (@optcg/engine) All game logic lives here, nowhere else
│   ├── cards/          (@optcg/cards) Card database and card data types
│   └── shared-types/   (@optcg/shared-types) Types shared across apps and packages
├── package.json        Workspace root (pnpm scripts)
├── pnpm-workspace.yaml Declares apps/* and packages/* as workspace members
└── tsconfig.json       Root TypeScript base config with @optcg/* path aliases
```

## Architecture

**Stack:** Next.js 16 (App Router), Supabase (Realtime + PostgreSQL), Tailwind CSS 4, TypeScript strict mode.

**Purpose:** Browser-based multiplayer One Piece TCG simulator. Two players join a game room via a shared code and play in real time.

### Architectural rules

**Game logic (packages/engine)**
- All game logic lives only in `packages/engine`. Do not implement rules, state machines, or
  card effects in `apps/web` or `apps/game-server` directly — import from `@optcg/engine` instead.
- `packages/engine` must be pure TypeScript with zero runtime dependencies on Node or browser APIs.

**Live match state (apps/game-server)**
- `apps/game-server` is the only process permitted to write live match state.
- `apps/web` must never write match state directly; it reads via subscriptions or REST snapshots.

**Persisted data (Supabase)**
- Supabase is the source of truth for all persisted data (user accounts, deck lists, match
  history, card catalog).
- `apps/game-server` writes match results to Supabase when a game ends.
- `apps/web` reads persisted data from Supabase (read-only from the browser).

### Multiplayer layer
- Supabase Realtime channels — one channel per game, keyed by `game:{gameId}`
- Broadcast for game events (card plays, phase changes, etc.)
- Presence for player connection state
- Game state stored in `games` table, updated via Server Actions

## Commands

```bash
pnpm install                                   # install all workspace deps
pnpm dev:web                                   # run apps/web on port 3000
pnpm build:web                                 # production build of apps/web
pnpm -r typecheck                              # typecheck all packages
pnpm -r lint                                   # lint all packages
pnpm --filter @optcg/web <script>              # target apps/web specifically
pnpm --filter @optcg/engine <script>           # target packages/engine specifically
```

Always use `pnpm`, never `npm` or `yarn`.

## TypeScript path aliases

The root `tsconfig.json` declares:

| Alias | Resolves to |
|---|---|
| `@optcg/engine` | `packages/engine/src/index.ts` |
| `@optcg/cards` | `packages/cards/src/index.ts` |
| `@optcg/shared-types` | `packages/shared-types/src/index.ts` |

`apps/web/tsconfig.json` also declares `@/*` → `apps/web/*` for Next.js imports.

## Working in apps/web

- Next.js 16 App Router. All pages live under `apps/web/app/`.
- Route structure:
  - `app/page.tsx` — landing: create or join a game
  - `app/(game)/[gameId]/page.tsx` — the game board (protected, must be a participant)
  - `app/(game)/[gameId]/lobby/page.tsx` — waiting room before game starts
- Type definitions: `types/game.ts` — `GameState`, `PlayerState`, `CardInstance`, `GameEvent`, `GamePhase`
- Supabase clients:
  - `lib/supabase/client.ts` — browser client (use in Client Components)
  - `lib/supabase/server.ts` — server client (use in Server Components / Server Actions)
- Run the dev server: `pnpm dev:web` (port 3000).

## Database

See `apps/web/supabase/schema.sql`. Tables:
- `games` — one row per game session
- `game_players` — maps users to game slots (p1/p2)

RLS: players can only read/write games they are a participant in.

## Key rules

- Game logic in `packages/engine` must be pure — no fetch, no Supabase, no side effects
- State updates always go through a Server Action, never direct client mutations
- TypeScript strict mode — no `any`
- Tailwind only — no inline styles
