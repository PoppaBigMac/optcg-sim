import type { Action } from "@optcg/shared-types";
import type { GameState } from "../state";
import type { ValidationResult } from "./types";
import { getPlayer, setPlayer } from "../state";

type PlayCharacterAction = Extract<Action, { type: "PlayCharacter" }>;

export function validate(state: GameState, action: PlayCharacterAction): ValidationResult {
  if (state.phase !== "Main") {
    return { ok: false, reason: "Can only play characters during Main phase" };
  }
  if (state.activePlayer !== action.player) {
    return { ok: false, reason: "Not your turn" };
  }

  const player = getPlayer(state, action.player);

  const cardInHand = player.hand.find((c) => c.instanceId === action.cardInstanceId);
  if (!cardInHand) {
    return { ok: false, reason: "Card not in hand" };
  }
  if (cardInHand.card.type !== "Character") {
    return { ok: false, reason: "Card is not a Character" };
  }
  if (player.characterArea.length >= 5) {
    return { ok: false, reason: "Character area is full (max 5)" };
  }

  // Validate DON cost: must rest exactly `card.cost` active DON from cost area
  const activeDon = player.costArea.filter((d) => !d.rested);
  if (action.donToRest.length !== cardInHand.card.cost) {
    return { ok: false, reason: `Must rest exactly ${cardInHand.card.cost} DON to play this card` };
  }

  for (const donId of action.donToRest) {
    const don = activeDon.find((d) => d.instanceId === donId);
    if (!don) {
      return { ok: false, reason: `DON ${donId} is not active in cost area` };
    }
  }

  // Check for duplicates in donToRest
  const uniqueDon = new Set(action.donToRest);
  if (uniqueDon.size !== action.donToRest.length) {
    return { ok: false, reason: "Duplicate DON IDs in donToRest" };
  }

  return { ok: true };
}

export function apply(state: GameState, action: PlayCharacterAction): GameState {
  const player = getPlayer(state, action.player);

  const cardInHand = player.hand.find((c) => c.instanceId === action.cardInstanceId)!;
  const donToRestSet = new Set(action.donToRest);

  const newHand = player.hand.filter((c) => c.instanceId !== action.cardInstanceId);
  const newCostArea = player.costArea.map((d) =>
    donToRestSet.has(d.instanceId) ? { ...d, rested: true } : d
  );

  const playedCharacter = { ...cardInHand, summoningSickness: true };

  const updatedPlayer = {
    ...player,
    hand: newHand,
    costArea: newCostArea,
    characterArea: [...player.characterArea, playedCharacter],
  };

  return setPlayer(state, action.player, updatedPlayer);
}
