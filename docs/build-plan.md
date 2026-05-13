# OPTCG-Sim Build Plan

**Last updated:** 2026-05-12
**Current phase:** Phase 1 — Engine correctness
**Latest tag:** v0.1.0-alpha

## Status legend
- 🔲 Not started
- 🟡 In progress (branch open)
- 🟠 Blocked (needs review or external input)
- ✅ Done (merged to master)

## Phase 0 — Foundation ✅
- ✅ Monorepo restructure (`restructure/monorepo`)
- ✅ Engine scaffold (`engine/scaffold`)
- ✅ Game server scaffold (`server/scaffold`)
- ✅ Hot-seat web MVP (`web/hotseat-mvp`)
- ✅ v0.1.0-alpha tag

## Phase 1 — Engine correctness (current)
- ✅ Rules audit (`engine/rules-audit`) → produced docs/rules-audit-2026-05.md
- ✅ P0-1: Combat resolution (Block/Counter/Damage steps) — `engine/p0-combat-resolution`
- ✅ P0-2: Clear state.combat at end of phase — `engine/p0-combat-resolution`
- ✅ P0-3: Effective-power calculation utility — `engine/p0-combat-resolution`
- ✅ P0-4: Win-by-combat condition (0 Life + Leader damage) — `engine/p0-combat-resolution`
- ✅ P0-5: First-turn attack restriction — `engine/p0-combat-resolution`, fixed per-player in `fix/first-turn-attack-per-player`
- 🔲 Missing actions: PlayStage, PlayEvent, DeclareBlocker, PassBlock, UseCounter, PassCounter, ActivateMainEffect, ResolveTrigger, DeclineTrigger, TrashCharacterForLimit, ReturnDon
- 🔲 Keyword system foundation (Rush, Blocker, Double Attack, Banish, Unblockable)
- 🔲 Effect/trigger system foundation (On Play, On K.O., When Attacking, Trigger)
- 🔲 Engine test coverage to 80%+

## Phase 2 — Auth + persistence
- 🔲 Supabase JWT verification on game-server WS connect
- 🔲 Real user accounts in web (login, signup, profile)
- 🔲 Deck CRUD in Supabase (save/load/delete decks)
- 🔲 Deckbuilder UI (search, filter, build, validate against deck rules)
- 🔲 Match history persistence (action log → Supabase)

## Phase 3 — Real cards
- 🔲 Card data importer from community DB
- 🔲 Card script template + DSL docs
- 🔲 Scripts for first archetype (~50 cards)
- 🔲 Scripts for second archetype
- 🔲 Scripts for third archetype

## Phase 4 — Multiplayer polish
- 🔲 Matchmaking queue (Elo/Glicko-2)
- 🔲 Reconnect-to-match
- 🔲 Animations + sound
- 🔲 Mobile touch UX pass
- 🔲 PWA install

## Phase 5 — Spectator + replays
- 🔲 Replay viewer (re-run action log)
- 🔲 Spectator mode (read-only WS listener)
- 🔲 Public replay sharing

## Phase 6 — Tournament tooling
- 🔲 Brackets (single/double elim, Swiss)
- 🔲 Judge accounts
- 🔲 Tournament organizer dashboard

## Phase 7 — Long tail
- 🔲 Card script coverage for all sets
- 🔲 New-set workflow
- 🔲 Localization (JP first)

## How to use this doc
- Update status emojis as branches open/merge.
- Never check a box without merging to master.
- When a step is broken into substeps, add them inline.
- Reference: `_RULES_REFERENCE.md` is the source of truth for game rules. `docs/rules-audit-2026-05.md` is the gap analysis driving Phase 1.
