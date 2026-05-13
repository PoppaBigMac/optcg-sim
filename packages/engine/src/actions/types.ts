import type { GameState } from "../state";

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

export type ActionResult =
  | { ok: true; state: GameState }
  | { ok: false; reason: string };
