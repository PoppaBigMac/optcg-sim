export { createInitialState } from "./setup";
export type { DeckInput } from "./setup";
export { applyAction } from "./engine";
export type { GameState, PlayerState, CardInstance, Modifier } from "./state";
export { getPlayer, setPlayer, opponent } from "./state";
export type { ActionResult, ValidationResult } from "./actions/types";
