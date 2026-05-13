import type { Action } from "@optcg/shared-types";
import type { GameState } from "../state";
import type { ValidationResult } from "./types";
import { opponent } from "../state";

type SurrenderAction = Extract<Action, { type: "Surrender" }>;

export function validate(state: GameState, _action: SurrenderAction): ValidationResult {
  if (state.winner) {
    return { ok: false, reason: "Game is already over" };
  }
  return { ok: true };
}

export function apply(state: GameState, action: SurrenderAction): GameState {
  return { ...state, winner: opponent(action.player) };
}
