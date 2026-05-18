import type { Action } from "@optcg/shared-types";
import type { GameState } from "../state";
import type { ValidationResult } from "./types";
import { getPlayer, setPlayer } from "../state";

type PlayStageAction = Extract<Action, { type: "PlayStage" }>;

export function validate(state: GameState, action: PlayStageAction): ValidationResult {
  if (state.phase !== "Main") {
    return { ok: false, reason: "Can only play stages during Main phase" };
  }
  if (state.activePlayer !== action.player) {
    return { ok: false, reason: "Not your turn" };
  }

  const player = getPlayer(state, action.player);
  const cardInHand = player.hand.find((c) => c.instanceId === action.cardInstanceId);

  if (!cardInHand) {
    return { ok: false, reason: "Card not in hand" };
  }
  if (cardInHand.card.type !== "Stage") {
    return { ok: false, reason: "Card is not a Stage" };
  }

  const activeDon = player.costArea.filter((d) => !d.rested);
  if (action.donToRest.length !== cardInHand.card.cost) {
    return { ok: false, reason: `Must rest exactly ${cardInHand.card.cost} DON to play this stage` };
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

export function apply(state: GameState, action: PlayStageAction): GameState {
  const player = getPlayer(state, action.player);
  const cardInHand = player.hand.find((c) => c.instanceId === action.cardInstanceId)!;
  const donToRestSet = new Set(action.donToRest);

  const newHand = player.hand.filter((c) => c.instanceId !== action.cardInstanceId);
  const newCostArea = player.costArea.map((d) =>
    donToRestSet.has(d.instanceId) ? { ...d, rested: true } : d,
  );

  // New stage replaces old one; old stage goes to trash
  const newTrash = [...player.trash, ...player.stageArea];

  const updatedPlayer = {
    ...player,
    hand: newHand,
    costArea: newCostArea,
    stageArea: [cardInHand],
    trash: newTrash,
  };

  return setPlayer(state, action.player, updatedPlayer);
}
