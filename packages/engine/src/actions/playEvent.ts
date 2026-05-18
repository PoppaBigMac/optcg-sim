import type { Action } from "@optcg/shared-types";
import type { GameState } from "../state";
import type { ValidationResult } from "./types";
import { getPlayer, setPlayer } from "../state";

type PlayEventAction = Extract<Action, { type: "PlayEvent" }>;

export function validate(state: GameState, action: PlayEventAction): ValidationResult {
  if (state.phase !== "Main") {
    return { ok: false, reason: "Can only play events during Main phase" };
  }
  if (state.activePlayer !== action.player) {
    return { ok: false, reason: "Not your turn" };
  }

  const player = getPlayer(state, action.player);
  const cardInHand = player.hand.find((c) => c.instanceId === action.cardInstanceId);

  if (!cardInHand) {
    return { ok: false, reason: "Card not in hand" };
  }
  if (cardInHand.card.type !== "Event") {
    return { ok: false, reason: "Card is not an Event" };
  }

  const activeDon = player.costArea.filter((d) => !d.rested);
  if (action.donToRest.length !== cardInHand.card.cost) {
    return { ok: false, reason: `Must rest exactly ${cardInHand.card.cost} DON to play this event` };
  }
  for (const donId of action.donToRest) {
    if (!activeDon.find((d) => d.instanceId === donId)) {
      return { ok: false, reason: `DON ${donId} is not active in cost area` };
    }
  }
  const uniqueDon = new Set(action.donToRest);
  if (uniqueDon.size !== action.donToRest.length) {
    return { ok: false, reason: "Duplicate DON IDs in donToRest" };
  }

  return { ok: true };
}

export function apply(state: GameState, action: PlayEventAction): GameState {
  const player = getPlayer(state, action.player);
  const cardInHand = player.hand.find((c) => c.instanceId === action.cardInstanceId)!;
  const donToRestSet = new Set(action.donToRest);

  const newHand = player.hand.filter((c) => c.instanceId !== action.cardInstanceId);
  const newCostArea = player.costArea.map((d) =>
    donToRestSet.has(d.instanceId) ? { ...d, rested: true } : d,
  );

  // Events resolve immediately and go to trash; effects are not yet implemented
  const updatedPlayer = {
    ...player,
    hand: newHand,
    costArea: newCostArea,
    trash: [...player.trash, cardInHand],
  };

  return setPlayer(state, action.player, updatedPlayer);
}
