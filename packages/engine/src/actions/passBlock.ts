import type { Action } from "@optcg/shared-types";
import type { GameState } from "../state";
import type { ValidationResult } from "./types";
import { opponent } from "../state";

type PassBlockAction = Extract<Action, { type: "PassBlock" }>;

export function validate(state: GameState, action: PassBlockAction): ValidationResult {
  if (!state.combat) {
    return { ok: false, reason: "No battle in progress" };
  }
  if (state.combat.step !== "block") {
    return { ok: false, reason: "Not in block step" };
  }
  const defenderSlot = opponent(state.combat.attackerPlayer);
  if (action.player !== defenderSlot) {
    return { ok: false, reason: "Only the defending player can pass block" };
  }
  return { ok: true };
}

export function apply(state: GameState, _action: PassBlockAction): GameState {
  return {
    ...state,
    combat: { ...state.combat!, step: "counter" as const },
  };
}
