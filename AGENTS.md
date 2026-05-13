# AGENTS.md

Guidance for autonomous agents (Claude Code, Codex, etc.) working in this repo.

## Structure overview

| Path | Purpose |
|---|---|
| `apps/web` | Next.js 15 marketing + client app |
| `apps/game-server` | (future) Real-time game WebSocket server |
| `packages/engine` | Game logic — pure TS, no I/O |
| `packages/cards` | Card data and types |
| `packages/shared-types` | Cross-package type definitions |

## Hard rules for agents

1. **Do not add game logic outside `packages/engine`.** If you find rule evaluation, state
   transitions, or card-effect resolution in `apps/`, move it to `packages/engine` instead.

2. **Do not write match state from `apps/web`.** Any mutation of live game state must go through
   `apps/game-server`. `apps/web` is read-only with respect to match state.

3. **Supabase is the source of truth.** Never cache or shadow persisted data in a separate store.
   Read from Supabase; do not duplicate tables or maintain a secondary write path.

4. **Always use pnpm.** Do not run `npm install`, `yarn add`, or any npm/yarn command. Use
   `pnpm add --filter <package> <dep>` to add a dependency to a specific workspace member.

5. **Verify the dev server after structural changes.** After any change to workspace config,
   `tsconfig.json`, `next.config.mjs`, or package manifests, confirm `pnpm dev:web` still starts
   cleanly on port 3000 before finishing.

## How to run things

```bash
pnpm dev:web                                   # start apps/web dev server (port 3000)
pnpm build:web                                 # production build
pnpm --filter @optcg/engine typecheck          # typecheck a single package
pnpm -r typecheck                              # typecheck all packages
```

## Adding a new workspace package

1. Create `apps/<name>/` or `packages/<name>/`.
2. Add `package.json` with a scoped name (`@optcg/<name>`).
3. Add `tsconfig.json` extending `../../tsconfig.json`.
4. Add a `src/index.ts` entry point.
5. If other packages import it, add the path alias to root `tsconfig.json` **and** to
   `apps/web/tsconfig.json`.
6. Run `pnpm install` to wire up the workspace symlink.

## Supabase conventions

- All Supabase client initialisation lives in `apps/web/lib/supabase/` (client-side) and in
  `apps/game-server/lib/supabase/` (server-side).
- `apps/web` uses the **anon** key (row-level security enforced).
- `apps/game-server` uses the **service-role** key (bypasses RLS for authoritative writes).
- Never commit `.env` files; use `.env.local` locally and environment variables in CI.
