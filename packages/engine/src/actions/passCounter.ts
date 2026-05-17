import type { Action } from "@optcg/shared-types";
import type { GameState, CardInstance } from "../state";
import type { CombatState } from "../state";
import type { ValidationResult } from "./types";
import { getPlayer, opponent } from "../state";
import { resolveDamage, clearCombat } from "../battle";
import { hasDoubleAttack } from "../keywords";

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

function findAttacker(state: GameState, combat: CombatState): CardInstance | undefined {
  const ap = getPlayer(state, combat.attackerPlayer);
  if (ap.leader.instanceId === combat.attackerInstanceId) return ap.leader;
  return ap.characterArea.find((c) => c.instanceId === combat.attackerInstanceId);
}

export function apply(state: GameState, _action: PassCounterAction): GameState {
  const combat = state.combat!;
  const withDamageStep: GameState = {
    ...state,
    combat: { ...combat, step: "damage" as const },
  };

  const afterFirst = resolveDamage(withDamageStep);

  if (
    combat.targetKind === "leader" &&
    !afterFirst.winner
  ) {
    const attacker = findAttacker(afterFirst, combat);
    if (attacker && hasDoubleAttack(attacker)) {
      const afterSecond = resolveDamage(afterFirst);
      return clearCombat(afterSecond);
    }
  }

  return clearCombat(afterFirst);
}
