# CLAUDE.md

## Commands

```bash
npm run dev      # Start dev server at localhost:3000
npm run build    # Production build
npm run lint     # ESLint
npx tsc --noEmit # Type-check
```

## Architecture

**Stack:** Next.js (App Router), Supabase (Realtime + PostgreSQL), Tailwind CSS, TypeScript strict mode.

**Purpose:** Browser-based multiplayer One Piece TCG simulator. Two players join a game room via a shared code and play in real time.

**Multiplayer layer:**
- Supabase Realtime channels — one channel per game, keyed by `game:{gameId}`
- Broadcast for game events (card plays, phase changes, etc.)
- Presence for player connection state
- Game state stored in `games` table, updated via Server Actions

**Route structure:**
- `app/page.tsx` — landing: create or join a game
- `app/(game)/[gameId]/page.tsx` — the game board (protected, must be a participant)
- `app/(game)/[gameId]/lobby/page.tsx` — waiting room before game starts

**Type definitions:** `types/game.ts` — `GameState`, `PlayerState`, `CardInstance`, `GameEvent`, `GamePhase`

**Supabase clients:**
- `lib/supabase/client.ts` — browser client (use in Client Components)
- `lib/supabase/server.ts` — server client (use in Server Components / Server Actions)

**Game logic:** `lib/game/` — pure functions only, no side effects, no Supabase imports.

## Database

See `supabase/schema.sql`. Tables:
- `games` — one row per game session
- `game_players` — maps users to game slots (p1/p2)

RLS: players can only read/write games they are a participant in.

## Key rules

- Game logic in `lib/game/` must be pure — no fetch, no Supabase, no side effects
- State updates always go through a Server Action, never direct client mutations
- TypeScript strict mode — no `any`
- Tailwind only — no inline styles
