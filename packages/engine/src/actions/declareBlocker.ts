import type { Action } from "@optcg/shared-types";
import type { GameState } from "../state";
import type { ValidationResult } from "./types";
import { getPlayer, setPlayer, opponent } from "../state";
import { hasUnblockable } from "../keywords";

type DeclareBlockerAction = Extract<Action, { type: "DeclareBlocker" }>;

export function validate(state: GameState, action: DeclareBlockerAction): ValidationResult {
  if (!state.combat) {
    return { ok: false, reason: "No battle in progress" };
  }
  if (state.combat.step !== "block") {
    return { ok: false, reason: "Not in block step" };
  }
  const defenderSlot = opponent(state.combat.attackerPlayer);
  if (action.player !== defenderSlot) {
    return { ok: false, reason: "Only the defending player can declare a blocker" };
  }

  const defender = getPlayer(state, defenderSlot);
  const blocker = defender.characterArea.find(
    (c) => c.instanceId === action.blockerInstanceId,
  );

  if (!blocker) {
    return { ok: false, reason: "Blocker not found in character area" };
  }
  if (blocker.rested) {
    return { ok: false, reason: "Blocker is rested and cannot block" };
  }

  const hasBlockerKeyword = blocker.card.effects.some(
    (e) => e.includes("[Blocker]"),
  );
  if (!hasBlockerKeyword) {
    return { ok: false, reason: "Character does not have [Blocker] keyword" };
  }

  // Unblockable attacker cannot be blocked
  const combat = state.combat;
  const attackerPlayer = getPlayer(state, combat.attackerPlayer);
  const attacker =
    attackerPlayer.leader.instanceId === combat.attackerInstanceId
      ? attackerPlayer.leader
      : attackerPlayer.characterArea.find((c) => c.instanceId === combat.attackerInstanceId);
  if (attacker && hasUnblockable(attacker)) {
    return { ok: false, reason: "Attacker has [Unblockable] and cannot be blocked" };
  }

  return { ok: true };
}

export function apply(state: GameState, action: DeclareBlockerAction): GameState {
  const combat = state.combat!;
  const defenderSlot = opponent(combat.attackerPlayer);
  const defender = getPlayer(state, defenderSlot);

  const characterArea = defender.characterArea.map((c) =>
    c.instanceId === action.blockerInstanceId
      ? { ...c, rested: true }
      : c,
  );

  const updatedDefender = { ...defender, characterArea };
  const stateWithDefender = setPlayer(state, defenderSlot, updatedDefender);

  return {
    ...stateWithDefender,
    combat: {
      ...combat,
      targetKind: "character" as const,
      targetInstanceId: action.blockerInstanceId,
      step: "counter" as const,
    },
  };
}
