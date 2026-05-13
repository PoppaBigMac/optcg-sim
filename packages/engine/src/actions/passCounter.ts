import type { Action } from "@optcg/shared-types";
import type { GameState } from "../state";
import type { ValidationResult } from "./types";
import { opponent } from "../state";
import { resolveDamage, clearCombat } from "../battle";

type PassCounterAction = Extract<Action, { type: "PassCounter" }>;

export function validate(state: GameState, action: PassCounterAction): ValidationResult {
  if (!state.combat) {
    return { ok: false, reason: "No battle in progress" };
  }
  if (state.combat.step !== "counter") {
    return { ok: false, reason: "Not in counter step" };
  }
  const defenderSlot = opponent(state.combat.attackerPlayer);
  if (action.player !== defenderSlot) {
    return { ok: false, reason: "Only the defending player can pass counter" };
  }
  return { ok: true };
}

export function apply(state: GameState, _action: PassCounterAction): GameState {
  const withDamageStep: GameState = {
    ...state,
    combat: { ...state.combat!, step: "damage" as const },
  };
  const afterDamage = resolveDamage(withDamageStep);
  return clearCombat(afterDamage);
}
