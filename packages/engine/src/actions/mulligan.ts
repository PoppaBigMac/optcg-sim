import type { Action } from "@optcg/shared-types";
import type { GameState } from "../state";
import type { ValidationResult } from "./types";
import { getPlayer, setPlayer } from "../state";
import { seededShuffle } from "../rng";

type MulliganAction = Extract<Action, { type: "Mulligan" }>;

export function validate(state: GameState, action: MulliganAction): ValidationResult {
  if (state.phase !== "Mulligan") {
    return { ok: false, reason: "Not in Mulligan phase" };
  }
  const player = getPlayer(state, action.player);
  if (player.mulliganDone) {
    return { ok: false, reason: "Mulligan already resolved for this player" };
  }
  return { ok: true };
}

export function apply(state: GameState, action: MulliganAction): GameState {
  const player = getPlayer(state, action.player);

  let updatedPlayer = player;
  let rngState = state.rngState;

  if (!action.keep) {
    // Return hand to deck and reshuffle, draw 5 new cards
    const fullDeck = [...player.deck, ...player.hand];
    const { result: shuffled, rngState: newRng } = seededShuffle(fullDeck, rngState);
    rngState = newRng;
    const newHand = shuffled.splice(0, 5);
    updatedPlayer = { ...player, hand: newHand, deck: shuffled, mulliganDone: true };
  } else {
    updatedPlayer = { ...player, mulliganDone: true };
  }

  let newState = { ...setPlayer(state, action.player, updatedPlayer), rngState };

  // Check if both players have resolved mulligan
  const otherPlayer = getPlayer(newState, action.player === "p1" ? "p2" : "p1");
  if (otherPlayer.mulliganDone) {
    // Both done — advance to first player's Refresh phase
    // But on turn 1, skip Refresh and go straight to Draw
    newState = { ...newState, phase: "Refresh" };
  }

  return newState;
}
