import type { Action } from "@optcg/shared-types";
import type { GameState } from "../state";
import type { ValidationResult } from "./types";
import { refreshPhase, drawPhase, donPhase, endPhaseFn } from "../phases";

type EndPhaseAction = Extract<Action, { type: "EndPhase" }>;

export function validate(state: GameState, action: EndPhaseAction): ValidationResult {
  if (state.activePlayer !== action.player) {
    return { ok: false, reason: "Not your turn" };
  }
  if (state.phase !== "Main") {
    return { ok: false, reason: "Can only end turn during Main phase" };
  }
  return { ok: true };
}

// End turn: run End cleanup → switch player → auto-advance Refresh → Draw → Don → Main
export function apply(state: GameState, _action: EndPhaseAction): GameState {
  let s = endPhaseFn(state);    // End: clear modifiers, switch player, → Refresh
  if (s.winner) return s;
  s = refreshPhase(s);          // Refresh: untap all, return DON → Draw
  if (s.winner) return s;
  s = drawPhase(s);             // Draw: draw 1 card (or skip T1 first player) → Don
  if (s.winner) return s;
  s = donPhase(s);              // Don: add DON to cost area → Main
  return s;
}
