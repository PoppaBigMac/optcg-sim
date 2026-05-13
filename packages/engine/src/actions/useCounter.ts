import type { Action } from "@optcg/shared-types";
import type { GameState } from "../state";
import type { ValidationResult } from "./types";
import { getPlayer, setPlayer, opponent } from "../state";

type UseCounterAction = Extract<Action, { type: "UseCounter" }>;

export function validate(state: GameState, action: UseCounterAction): ValidationResult {
  if (!state.combat) {
    return { ok: false, reason: "No battle in progress" };
  }
  if (state.combat.step !== "counter") {
    return { ok: false, reason: "Not in counter step" };
  }
  const defenderSlot = opponent(state.combat.attackerPlayer);
  if (action.player !== defenderSlot) {
    return { ok: false, reason: "Only the defending player can use counters" };
  }

  const defender = getPlayer(state, defenderSlot);
  const counterCard = defender.hand.find(
    (c) => c.instanceId === action.cardInstanceId,
  );

  if (!counterCard) {
    return { ok: false, reason: "Counter card not found in hand" };
  }
  if (counterCard.card.counter <= 0) {
    return { ok: false, reason: "Card has no counter value" };
  }

  return { ok: true };
}

export function apply(state: GameState, action: UseCounterAction): GameState {
  const combat = state.combat!;
  const defenderSlot = opponent(combat.attackerPlayer);
  const defender = getPlayer(state, defenderSlot);

  const counterCard = defender.hand.find(
    (c) => c.instanceId === action.cardInstanceId,
  )!;

  const updatedDefender = {
    ...defender,
    hand: defender.hand.filter((c) => c.instanceId !== action.cardInstanceId),
    trash: [...defender.trash, counterCard],
  };

  const stateWithDefender = setPlayer(state, defenderSlot, updatedDefender);

  return {
    ...stateWithDefender,
    combat: {
      ...combat,
      powerBoost: combat.powerBoost + counterCard.card.counter,
    },
  };
}
